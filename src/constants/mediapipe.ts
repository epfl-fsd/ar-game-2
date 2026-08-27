export const MEDIAPIPE_SCRIPTS = [
  "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js",
  "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js",
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
