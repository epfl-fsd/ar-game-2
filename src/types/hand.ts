export interface Landmark {
  x: number;
  y: number;
  z: number;
}

/** 21 MediaPipe hand landmarks, in their standard index order. */
export type HandLandmarks = Landmark[];

export interface HandFrame {
  slot: number;
  landmarks: HandLandmarks;
  /** Edge-triggered: true only on the frame a hand transitions to pinching. */
  justPinched: boolean;
}

export interface HandTrackerOptions {
  video: HTMLVideoElement;
  maxHands: number;
  width: number;
  height: number;
  onResults: (hands: HandLandmarks[]) => void;
}

export interface HandTracker {
  start(): Promise<void>;
  stop(): void;
}
