/** Max simultaneous tracked hands (multiplayer parity with ar-game-1). */
export const MAX_HANDS = 4;

/** MediaPipe wrist landmark index. */
export const WRIST = 0;

/** MediaPipe fingertip landmark indices, thumb -> pinky. */
export const FINGERTIPS: readonly number[] = [4, 8, 12, 16, 20];

/** Palms closer than this (px) are treated as the same physical hand. */
export const DEDUP_THRESH_PX = 120;

// Pinch (thumb tip to index tip) distance below which the launch triggers,
// matching ar-game-1's PINCH_THRESH.
export const PINCH_THRESH_PX = 38;
