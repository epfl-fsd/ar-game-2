import {
  MEDIAPIPE_HANDS_LOCATE_FILE_BASE,
  MIN_DETECTION_CONFIDENCE,
  MIN_TRACKING_CONFIDENCE,
  MODEL_COMPLEXITY,
} from "@/constants/mediapipe";
import { loadMediaPipeScripts } from "@/services/mediapipe";
import type { HandTracker, HandTrackerOptions } from "@/types/hand";
import type { MediaPipeHandsInstance } from "@/types/mediapipe";

export function createHandTracker(options: HandTrackerOptions): HandTracker {
  let hands: MediaPipeHandsInstance | null = null;
  let stream: MediaStream | null = null;
  let frameId: number | null = null;
  let running = false;
  let cancelled = false;

  async function start() {
    const acquiredStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: options.width,
        height: options.height,
      },
    });
    if (cancelled) {
      for (const track of acquiredStream.getTracks()) track.stop();
      return;
    }
    stream = acquiredStream;
    options.video.srcObject = stream;
    options.onPermissionGranted?.();

    try {
      await options.video.play();
    } catch (error) {
      // stop() clears srcObject mid-flight (e.g. React Strict Mode's
      // double effect invocation in dev), which aborts this play()
      // request; that's an expected cancellation, not a real failure.
      if (cancelled) return;
      throw error;
    }
    if (cancelled) return;

    await loadMediaPipeScripts();
    if (cancelled) return;

    hands = new window.Hands({
      locateFile: (file) => `${MEDIAPIPE_HANDS_LOCATE_FILE_BASE}${file}`,
    });
    hands.setOptions({
      maxNumHands: options.maxHands,
      modelComplexity: MODEL_COMPLEXITY,
      minDetectionConfidence: MIN_DETECTION_CONFIDENCE,
      minTrackingConfidence: MIN_TRACKING_CONFIDENCE,
    });
    hands.onResults((results) => {
      options.onResults(results.multiHandLandmarks ?? []);
    });

    running = true;
    const pump = async () => {
      if (!running || !hands) return;
      await hands.send({ image: options.video });
      if (running) frameId = requestAnimationFrame(pump);
    };
    frameId = requestAnimationFrame(pump);
  }

  function stop() {
    cancelled = true;
    running = false;
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null;

    for (const track of stream?.getTracks() ?? []) {
      track.stop();
    }
    stream = null;
    options.video.srcObject = null;

    hands?.close?.();
    hands = null;
  }

  return { start, stop };
}
