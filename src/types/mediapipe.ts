import type { Landmark } from "@/types/hand";

export interface MediaPipeHandsResults {
  multiHandLandmarks?: Landmark[][];
}

export interface MediaPipeHandsInstance {
  setOptions(options: {
    maxNumHands: number;
    modelComplexity: 0 | 1;
    minDetectionConfidence: number;
    minTrackingConfidence: number;
  }): void;
  onResults(callback: (results: MediaPipeHandsResults) => void): void;
  send(input: { image: HTMLVideoElement }): Promise<void>;
  close?(): void;
}

export interface MediaPipeCameraInstance {
  start(): Promise<void>;
  stop?(): void;
}

declare global {
  interface Window {
    Hands: new (config: {
      locateFile: (file: string) => string;
    }) => MediaPipeHandsInstance;
    Camera: new (
      video: HTMLVideoElement,
      config: { onFrame: () => Promise<void>; width: number; height: number },
    ) => MediaPipeCameraInstance;
  }
}
