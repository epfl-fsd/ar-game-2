import type { HandFrame } from "@/types/hand";

export interface ThreeSceneHandle {
  updateHands(frames: HandFrame[]): void;
  resize(width: number, height: number): void;
  toggleFingersHud(): void;
  dispose(): void;
}
