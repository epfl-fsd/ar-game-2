import type { HandLandmarks, Landmark } from "@/types/hand";

const THUMB_TIP = 4;
const INDEX_TIP = 8;

/** Euclidean distance between two landmarks, scaled to pixel space. */
export function pixelDistance(
  a: Landmark,
  b: Landmark,
  width: number,
  height: number,
): number {
  return Math.hypot((a.x - b.x) * width, (a.y - b.y) * height);
}

/** Palm (landmark 9) distance between two hands, in pixel space. */
export function palmDistance(
  a: HandLandmarks,
  b: HandLandmarks,
  width: number,
  height: number,
): number {
  return pixelDistance(a[9], b[9], width, height);
}

/** True when thumb tip and index tip are closer than thresholdPx apart. */
export function isPinching(
  lms: HandLandmarks,
  width: number,
  height: number,
  thresholdPx: number,
): boolean {
  return (
    pixelDistance(lms[THUMB_TIP], lms[INDEX_TIP], width, height) < thresholdPx
  );
}

/**
 * Normalized direction from one 2D point to another. Deliberately takes
 * plain points rather than raw landmarks: the launch direction must be
 * computed from world-space (post `lmToWorld`) points, since that transform
 * applies a non-uniform x/y scale for the canvas aspect ratio — normalizing
 * raw [0,1] landmark deltas would give a distorted angle on non-square
 * viewports. Callers pass `lmToWorld(wrist)` -> `lmToWorld(middleTip)`.
 */
export function normalizedDirection(
  from: { x: number; y: number },
  to: { x: number; y: number },
): { x: number; y: number } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
}
