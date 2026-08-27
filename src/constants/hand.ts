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

// Hysteresis band around fistScore == 1.0 (tip == knuckle distance from
// wrist) for the "closed fist" gesture used to toggle the hand HUD: an
// already-open hand must drop below FIST_ENTER to count as closed, and an
// already-closed hand must rise above FIST_EXIT to count as open again.
export const FIST_ENTER_THRESHOLD = 0.85;
export const FIST_EXIT_THRESHOLD = 1.05;
