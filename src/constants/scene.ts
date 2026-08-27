export const LOGO_TARGET_SIZE = 1.6;

export const MAX_PROJECTILES = 60;
export const LAUNCH_SPEED = 0.1;
export const LAUNCH_COOLDOWN_MS = 700;
export const GRAVITY = 0.002;

export const HAND_SCALE_REF_PX = 140;
export const HAND_SCALE_MIN = 0.3;
export const HAND_SCALE_MAX = 2.4;

export const CULL_X = 10;
export const CULL_Y = -8;

// Sci-fi "targeting HUD" overlay: a bracket on each fingertip, joined by lines.
export const FINGERS_ENABLED = false; // default, can be toggled on/off in-app
export const HUD_COLOR = 0xffffff;
export const HUD_SQUARE_SIZE = 0.18;
export const HUD_LINE_OPACITY = 0.85;

// Toggle the HUD on/off by holding a closed fist continuously this long.
export const HUD_TOGGLE_HOLD_MS = 10000;

// Model-selector boxes: hold a fingertip inside one to switch the held model.
// Stacked vertically in the bottom-right corner.
export const SELECTOR_BOX_SIZE = 0.85;
export const SELECTOR_BOX_MARGIN_X = 0.75; // fraction of horizontal half-extent
export const SELECTOR_BOX_Y = 0.62; // fraction of vertical half-extent, bottom-most box
export const SELECTOR_STACK_GAP = 0.15; // vertical gap between stacked boxes
export const SELECTOR_HOVER_MS = 1100;
export const SELECTOR_BOX_COLOR = 0xffffff;
export const SELECTOR_PROGRESS_COLOR = 0xffffff;
export const SELECTOR_SPIN_RAD_PER_MS = 0.006;

/** Target size (world units) of the mini logo preview rendered inside each box. */
export const SELECTOR_PREVIEW_SIZE = SELECTOR_BOX_SIZE * 0.55;
/** Idle rotation speed of the mini logo preview, independent of hover state. */
export const SELECTOR_PREVIEW_SPIN_RAD_PER_MS = 0.0012;

// Confirmed selection: show a checkmark, then ignore hover for a beat so the
// same box doesn't immediately re-trigger while the fingertip is still in it.
export const SELECTOR_CHECK_COLOR = "#22c55e";
export const SELECTOR_COOLDOWN_MS = 900;
