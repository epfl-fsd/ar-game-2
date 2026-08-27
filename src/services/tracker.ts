import {
  MEDIAPIPE_HANDS_LOCATE_FILE_BASE,
  MIN_DETECTION_CONFIDENCE,
  MIN_TRACKING_CONFIDENCE,
  MODEL_COMPLEXITY,
} from "@/constants/mediapipe";
import { loadMediaPipeScripts } from "@/services/mediapipe";
import type { HandTracker, HandTrackerOptions } from "@/types/hand";
import type {
  MediaPipeCameraInstance,
  MediaPipeHandsInstance,
} from "@/types/mediapipe";

export function createHandTracker(options: HandTrackerOptions): HandTracker {
  let hands: MediaPipeHandsInstance | null = null;
  let camera: MediaPipeCameraInstance | null = null;

  async function start() {
    await loadMediaPipeScripts();

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

    camera = new window.Camera(options.video, {
      onFrame: async () => {
        if (hands) await hands.send({ image: options.video });
      },
      width: options.width,
      height: options.height,
    });
    await camera.start();
  }

  function stop() {
    camera?.stop?.();
    camera = null;

    for (const track of (
      options.video.srcObject as MediaStream | null
    )?.getTracks() ?? []) {
      track.stop();
    }

    hands?.close?.();
    hands = null;
  }

  return { start, stop };
}
