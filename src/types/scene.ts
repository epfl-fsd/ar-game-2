import type { HandFrame } from "@/types/hand";

export interface ThreeSceneHandle {
  /** Returns true the frame the hand-hover photo trigger just completed. */
  updateHands(frames: HandFrame[]): boolean;
  resize(width: number, height: number): void;
  toggleFingersHud(): void;
  /** Captures the AR canvas on its next render and passes the PNG data URL to callback. */
  requestPhoto(callback: (dataUrl: string) => void): void;
  dispose(): void;
}

export interface ModelDef {
  id: string;
  name: string;
  stlUrl: string;
  color: number;
  /** Extra rotation (radians) baked into the geometry on load, e.g. to tilt a flat model into view. */
  rotation?: { x?: number; y?: number; z?: number };
}
