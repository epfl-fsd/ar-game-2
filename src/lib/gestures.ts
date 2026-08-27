import { WRIST } from "@/constants/hand";
import type { HandLandmarks, Landmark } from "@/types/hand";

const THUMB_TIP = 4;
const INDEX_TIP = 8;

// [MCP, TIP] pairs for the 4 non-thumb fingers. Thumb is excluded: its curl
// geometry (moves across the palm) doesn't fit this wrist-distance ratio model.
const FINGERS: ReadonlyArray<readonly [number, number]> = [
  [5, 8], // index
  [9, 12], // middle
  [13, 16], // ring
  [17, 20], // pinky
];

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
 * Scale-invariant "closed fist" score: mean, over the 4 non-thumb fingers, of
 * (tip-to-wrist distance / MCP-to-wrist distance). An extended finger's tip
 * sits well beyond its knuckle relative to the wrist (ratio ~1.4-2.2); a
 * curled finger's tip folds back toward the wrist (ratio drops below ~1.0).
 * Uses x/y only (ignores MediaPipe's noisier relative z).
 */
export function fistScore(lms: HandLandmarks): number {
  const wrist = lms[WRIST];
  let sum = 0;
  for (const [mcp, tip] of FINGERS) {
    const tipToWrist = Math.hypot(lms[tip].x - wrist.x, lms[tip].y - wrist.y);
    const mcpToWrist = Math.hypot(lms[mcp].x - wrist.x, lms[mcp].y - wrist.y);
    sum += tipToWrist / mcpToWrist;
  }
  return sum / FINGERS.length;
}

export function isFist(lms: HandLandmarks, threshold: number): boolean {
  return fistScore(lms) < threshold;
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
