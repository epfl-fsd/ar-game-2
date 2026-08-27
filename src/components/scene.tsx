"use client";

import { useEffect, useRef, useState } from "react";
import CameraDeniedPage from "@/components/denied";
import CameraLoader from "@/components/loader";
import PhotoDialog from "@/components/photo-dialog";
import { DEDUP_THRESH_PX, MAX_HANDS, PINCH_THRESH_PX } from "@/constants/hand";
import { CAPTURE_HEIGHT, CAPTURE_WIDTH } from "@/constants/mediapipe";
import { isPinching, palmDistance } from "@/lib/gestures";
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

export default function ArScene() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("pending");
  const [photo, setPhoto] = useState<string | null>(null);

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
          setPhoto(output.toDataURL("image/png"));
        };
        arImage.src = arDataUrl;
      });
    };
    const removePhotoKeyToggle = createKeyToggle("p", capturePhoto);

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

        scene.updateHands(frames);
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
        <CameraLoader text="Waiting for camera permission…" />
      )}
      {cameraStatus === "loading" && <CameraLoader text="Loading…" />}
      <PhotoDialog photo={photo} onClose={() => setPhoto(null)} />
    </>
  );
}
