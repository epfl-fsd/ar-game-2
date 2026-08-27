import type { HandFrame } from "@/types/hand";

export interface ThreeSceneHandle {
  updateHands(frames: HandFrame[]): void;
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
}
