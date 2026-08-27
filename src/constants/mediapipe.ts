// Only the Hands model script is loaded from the CDN; the camera feed is
// acquired directly via getUserMedia (see services/tracker.ts) instead of
// @mediapipe/camera_utils, whose Camera.start() calls window.alert() on
// getUserMedia failure — including expected cases like permission denial.
export const MEDIAPIPE_SCRIPTS = [
  "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js",
] as const;

export const MEDIAPIPE_HANDS_LOCATE_FILE_BASE =
  "https://cdn.jsdelivr.net/npm/@mediapipe/hands/";

export const MODEL_COMPLEXITY: 0 | 1 = 1;

// Requested getUserMedia capture resolution (independent of the full-viewport
// CSS display size, which uses object-fit: cover).
export const CAPTURE_WIDTH = 1280;
export const CAPTURE_HEIGHT = 720;
export const MIN_DETECTION_CONFIDENCE = 0.7;
export const MIN_TRACKING_CONFIDENCE = 0.5;
