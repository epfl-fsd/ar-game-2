"use client";

import { useEffect, useRef, useState } from "react";
import { DEDUP_THRESH_PX, MAX_HANDS, PINCH_THRESH_PX } from "@/constants/hand";
import { CAPTURE_HEIGHT, CAPTURE_WIDTH } from "@/constants/mediapipe";
import { LOGO_COLOR, STL_URL } from "@/constants/scene";
import { isPinching, palmDistance } from "@/lib/gestures";
import { createThreeScene } from "@/services/scene";
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

type CameraStatus = "pending" | "ready" | "error";

export default function ArScene() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("pending");

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let disposed = false;
    const scene = createThreeScene(canvas, {
      maxHands: MAX_HANDS,
      stlUrl: STL_URL,
      logoColor: LOGO_COLOR,
    });

    const resizeObserver = new ResizeObserver(() => {
      scene.resize(canvas.clientWidth, canvas.clientHeight);
    });
    resizeObserver.observe(canvas);

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
    });

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
        console.error("Failed to start camera/hand tracking:", error);
        if (!disposed) setCameraStatus("error");
      });

    return () => {
      disposed = true;
      resizeObserver.disconnect();
      tracker.stop();
      scene.dispose();
    };
  }, []);

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
      {cameraStatus !== "ready" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 px-6 text-center text-white">
          <p>
            {cameraStatus === "pending"
              ? "En attente de l'autorisation d'accès à la caméra…"
              : "Impossible d'accéder à la caméra. Vérifiez les autorisations et rechargez la page."}
          </p>
        </div>
      )}
    </>
  );
}
