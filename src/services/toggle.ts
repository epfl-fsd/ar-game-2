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
