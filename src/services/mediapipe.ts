import { MEDIAPIPE_SCRIPTS } from "@/constants/mediapipe";

let loadPromise: Promise<void> | null = null;

function loadScript(src: string): Promise<void> {
  const existing = document.querySelector<HTMLScriptElement>(
    `script[data-mediapipe-loader="${src}"]`,
  );
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error(`Failed to load ${src}`)),
      );
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.crossOrigin = "anonymous";
    script.dataset.mediapipeLoader = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

/** Idempotent, promise-cached lazy load of the MediaPipe Hands CDN script. */
export function loadMediaPipeScripts(): Promise<void> {
  if (typeof window !== "undefined" && window.Hands) {
    return Promise.resolve();
  }
  if (!loadPromise) {
    loadPromise = Promise.all(MEDIAPIPE_SCRIPTS.map(loadScript)).then(
      () => undefined,
    );
  }
  return loadPromise;
}
