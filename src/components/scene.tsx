"use client";

import { useEffect, useRef, useState } from "react";
import CameraDeniedPage from "@/components/denied";
import CameraLoader from "@/components/loader";
import { DEDUP_THRESH_PX, MAX_HANDS, PINCH_THRESH_PX } from "@/constants/hand";
import { CAPTURE_HEIGHT, CAPTURE_WIDTH } from "@/constants/mediapipe";
import { PHOTO_COUNTDOWN_S } from "@/constants/scene";
import { isPinching, palmDistance } from "@/lib/gestures";
import { addPhotoFrame } from "@/services/photo";
import { createThreeScene } from "@/services/scene";
import { createKeyToggle } from "@/services/toggle";
import { createHandTracker } from "@/services/tracker";
import type { HandFrame, HandLandmarks } from "@/types/hand";

function dedupeHands(
  rawHands: HandLandmarks[],
  width: number,
  height: number,
): HandLandmarks[] {
  const deduped: HandLandmarks[] = [];
  for (const hand of rawHands) {
    const isDuplicate = deduped.some(
      (other) => palmDistance(hand, other, width, height) < DEDUP_THRESH_PX,
    );
    if (!isDuplicate) deduped.push(hand);
  }
  return deduped;
}

type CameraStatus = "pending" | "loading" | "ready" | "error";

export default function ArScene({
  onPhotoCaptured,
}: {
  onPhotoCaptured: (dataUrl: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("pending");
  const [countdown, setCountdown] = useState<number | null>(null);

  // Kept in a ref (rather than an effect dependency) so the capture
  // pipeline always calls the latest callback without needing to tear down
  // and restart the camera/tracker/Three.js scene when it changes identity.
  const onPhotoCapturedRef = useRef(onPhotoCaptured);
  onPhotoCapturedRef.current = onPhotoCaptured;

  // capturePhoto itself lives inside the effect below (it needs the video/
  // scene instances), so it's exposed here for the countdown effect to call.
  const capturePhotoRef = useRef<() => void>(() => {});

  // Ticks the on-screen countdown down to 0, then fires the actual capture.
  // A pending tick is cleared on unmount/re-run, so a photo never fires
  // after the component (or a mid-countdown re-render) has gone away.
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 1) {
      const timer = setTimeout(() => {
        capturePhotoRef.current();
        setCountdown(null);
      }, 1000);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => setCountdown((c) => (c ?? 1) - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let disposed = false;
    const scene = createThreeScene(canvas, { maxHands: MAX_HANDS });

    const resizeObserver = new ResizeObserver(() => {
      scene.resize(canvas.clientWidth, canvas.clientHeight);
    });
    resizeObserver.observe(canvas);

    const removeFingersKeyToggle = createKeyToggle("f", scene.toggleFingersHud);

    const capturePhoto = () => {
      if (video.readyState < 2) return;
      scene.requestPhoto((arDataUrl) => {
        const width = video.clientWidth;
        const height = video.clientHeight;
        const output = document.createElement("canvas");
        output.width = width;
        output.height = height;
        const ctx = output.getContext("2d");
        if (!ctx) return;

        // Replicate the video's CSS object-cover crop + horizontal mirror.
        const videoAspect = video.videoWidth / video.videoHeight;
        const canvasAspect = width / height;
        let sx = 0;
        let sy = 0;
        let sw = video.videoWidth;
        let sh = video.videoHeight;
        if (videoAspect > canvasAspect) {
          sw = video.videoHeight * canvasAspect;
          sx = (video.videoWidth - sw) / 2;
        } else {
          sh = video.videoWidth / canvasAspect;
          sy = (video.videoHeight - sh) / 2;
        }
        ctx.save();
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, sx, sy, sw, sh, 0, 0, width, height);
        ctx.restore();

        // The AR canvas isn't CSS-mirrored: its world space already accounts
        // for the mirror (see lmToWorld in services/scene.ts), so it's drawn
        // on top as-is.
        const arImage = new Image();
        arImage.onload = () => {
          ctx.drawImage(arImage, 0, 0, width, height);
          addPhotoFrame(output).then((framedDataUrl) => {
            onPhotoCapturedRef.current(framedDataUrl);
          });
        };
        arImage.src = arDataUrl;
      });
    };
    capturePhotoRef.current = capturePhoto;
    const removePhotoKeyToggle = createKeyToggle("p", () =>
      setCountdown((current) => current ?? PHOTO_COUNTDOWN_S),
    );

    // Edge-trigger state per hand slot; a slot is simply the hand's index in
    // this frame's deduped landmark list (mirrors ar-game-1, which never
    // needed cross-frame identity beyond MediaPipe's own internal tracking).
    const wasPinching: boolean[] = Array(MAX_HANDS).fill(false);

    const tracker = createHandTracker({
      video,
      maxHands: MAX_HANDS,
      width: CAPTURE_WIDTH,
      height: CAPTURE_HEIGHT,
      onResults: (rawHands) => {
        if (disposed) return;
        const width = canvas.clientWidth || window.innerWidth;
        const height = canvas.clientHeight || window.innerHeight;

        const frames: HandFrame[] = dedupeHands(rawHands, width, height)
          .slice(0, MAX_HANDS)
          .map((landmarks, slot) => {
            const pinching = isPinching(
              landmarks,
              width,
              height,
              PINCH_THRESH_PX,
            );
            const justPinched = pinching && !wasPinching[slot];
            wasPinching[slot] = pinching;
            return { slot, landmarks, justPinched };
          });

        // The capture trigger box (top of screen) works exactly like the
        // model selector: hold a landmark inside it to arm the countdown.
        if (scene.updateHands(frames)) {
          setCountdown((current) => current ?? PHOTO_COUNTDOWN_S);
        }
      },
      onPermissionGranted: () => {
        if (!disposed) setCameraStatus("loading");
      },
    });

    function teardown() {
      if (disposed) return;
      disposed = true;
      resizeObserver.disconnect();
      removeFingersKeyToggle();
      removePhotoKeyToggle();
      tracker.stop();
      scene.dispose();
    }

    tracker
      .start()
      .then(() => {
        if (disposed) {
          tracker.stop();
        } else {
          setCameraStatus("ready");
        }
      })
      .catch((error) => {
        if (disposed) return;
        console.warn("Failed to start camera/hand tracking:", error);
        teardown();
        setCameraStatus("error");
      });

    return teardown;
  }, []);

  if (cameraStatus === "error") {
    return <CameraDeniedPage />;
  }

  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 h-full w-full object-cover [transform:scaleX(-1)]"
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full pointer-events-none"
      />
      {cameraStatus === "pending" && (
        <CameraLoader text="En attente de l'autorisation de la caméra…" />
      )}
      {cameraStatus === "loading" && <CameraLoader text="Chargement…" />}
      {countdown !== null && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="text-9xl font-bold text-white drop-shadow-lg">
            {countdown}
          </span>
        </div>
      )}
    </>
  );
}
