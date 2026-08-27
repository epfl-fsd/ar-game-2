import type { HandFrame, HandLandmarks } from "@/types/hand";

const TEXT_INPUT_TAGS = new Set(["INPUT", "TEXTAREA"]);

/** Binds a key press to a callback. Ignored while a text field is focused. Returns a cleanup function. */
export function createKeyToggle(key: string, onToggle: () => void): () => void {
  function onKeyDown(event: KeyboardEvent) {
    const target = event.target as HTMLElement | null;
    if (target && TEXT_INPUT_TAGS.has(target.tagName)) return;
    if (event.key.toLowerCase() === key.toLowerCase()) onToggle();
  }
  window.addEventListener("keydown", onKeyDown);
  return () => window.removeEventListener("keydown", onKeyDown);
}

export interface HoldToggleOptions {
  maxHands: number;
  /** How long a hand must satisfy isHeld, continuously, before onToggle fires. */
  holdMs: number;
  /**
   * Whether the given hand currently satisfies the hold gesture.
   * `alreadyEngaged` is true once this slot has started holding, so callers
   * can apply hysteresis (e.g. a looser exit threshold) to avoid flicker.
   */
  isHeld: (landmarks: HandLandmarks, alreadyEngaged: boolean) => boolean;
  onToggle: () => void;
}

export interface HoldToggle {
  update(frames: HandFrame[]): void;
}

/**
 * Fires onToggle once a hand satisfies isHeld continuously for holdMs. Only
 * re-arms for that hand slot once the hold is released, so a single fired
 * toggle doesn't repeat while the gesture is still held.
 */
export function createHoldToggle(options: HoldToggleOptions): HoldToggle {
  const holdStart: (number | null)[] = Array(options.maxHands).fill(null);
  const armed: boolean[] = Array(options.maxHands).fill(true);

  function release(slot: number) {
    holdStart[slot] = null;
    armed[slot] = true;
  }

  function update(frames: HandFrame[]) {
    const now = performance.now();
    const activeSlots = new Set(frames.map((frame) => frame.slot));
    for (let slot = 0; slot < options.maxHands; slot++) {
      if (!activeSlots.has(slot)) release(slot);
    }

    for (const frame of frames) {
      const slot = frame.slot;
      const held = options.isHeld(frame.landmarks, holdStart[slot] !== null);

      if (!held) {
        release(slot);
        continue;
      }

      const start = holdStart[slot] ?? now;
      holdStart[slot] = start;

      if (armed[slot] && now - start >= options.holdMs) {
        armed[slot] = false;
        options.onToggle();
      }
    }
  }

  return { update };
}
