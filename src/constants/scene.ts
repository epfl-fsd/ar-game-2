export const LOGO_TARGET_SIZE = 1.6;

// Self-timer countdown (seconds) between tapping the capture button and the
// photo actually being taken.
export const PHOTO_COUNTDOWN_S = 5;

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

// Spinner shown in a box while its STL preview is still loading.
export const SELECTOR_LOADER_COLOR = "#ffffff";
export const SELECTOR_LOADER_SPIN_RAD_PER_MS = 0.004;

/** Target size (world units) of the mini logo preview rendered inside each box. */
export const SELECTOR_PREVIEW_SIZE = SELECTOR_BOX_SIZE * 0.55;
/** Idle rotation speed of the mini logo preview, independent of hover state. */
export const SELECTOR_PREVIEW_SPIN_RAD_PER_MS = 0.0012;

// Confirmed selection: show a checkmark, then ignore hover for a beat so the
// same box doesn't immediately re-trigger while the fingertip is still in it.
export const SELECTOR_CHECK_COLOR = "#22c55e";
export const SELECTOR_COOLDOWN_MS = 900;

// Photo-capture trigger box: same hover-to-activate mechanic as the model
// selector above, mirrored to the bottom-left corner (selector sits
// bottom-right), at the same distance from center/bottom for symmetry.
export const CAPTURE_TRIGGER_BOX_SIZE = 0.85;
export const CAPTURE_TRIGGER_BOX_MARGIN_X = SELECTOR_BOX_MARGIN_X;
export const CAPTURE_TRIGGER_BOX_Y = SELECTOR_BOX_Y;
export const CAPTURE_TRIGGER_HOVER_MS = 1100;
export const CAPTURE_TRIGGER_BOX_COLOR = 0xffffff;
export const CAPTURE_TRIGGER_PROGRESS_COLOR = 0xffffff;
export const CAPTURE_TRIGGER_ICON_COLOR = "#ffffff";
export const CAPTURE_TRIGGER_SPIN_RAD_PER_MS = 0.006;
export const CAPTURE_TRIGGER_COOLDOWN_MS = 900;

// White bar added under a captured photo, with the EPFL wordmark on the
// left and a QR code on the right. Fractions of the source photo's
// width/bar height, so the frame scales with capture resolution.
export const PHOTO_BORDER_RATIO = 0.02;
export const PHOTO_BOTTOM_BAR_RATIO = 0.1;
export const PHOTO_URL = "https://apprentissage.epfl.ch/";
