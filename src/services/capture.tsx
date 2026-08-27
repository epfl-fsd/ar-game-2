import * as THREE from "three";
import {
  CAPTURE_TRIGGER_BOX_COLOR,
  CAPTURE_TRIGGER_BOX_MARGIN_X,
  CAPTURE_TRIGGER_BOX_SIZE,
  CAPTURE_TRIGGER_BOX_Y,
  CAPTURE_TRIGGER_COOLDOWN_MS,
  CAPTURE_TRIGGER_HOVER_MS,
  CAPTURE_TRIGGER_ICON_COLOR,
  CAPTURE_TRIGGER_PROGRESS_COLOR,
  CAPTURE_TRIGGER_SPIN_RAD_PER_MS,
} from "@/constants/scene";
import type { HandFrame } from "@/types/hand";

const RING_SEGMENTS = 32;

type WorldPoint = { x: number; y: number };
type ToWorld = (lm: { x: number; y: number }) => WorldPoint;

export interface CaptureTrigger {
  resize(width: number, height: number): void;
  /** Returns true the frame a hover-hold just completed. */
  update(frames: HandFrame[], lmToWorld: ToWorld): boolean;
  setVisible(visible: boolean): void;
  dispose(): void;
}

// Path data for lucide-react's "Camera" icon (24x24 viewBox), reused here so
// the world-space trigger box matches the icon set used everywhere else.
const CAMERA_ICON_PATH =
  "M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z";

function makeCameraIconSprite(size: number): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(size, size, 1);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" fill="none" stroke="${CAPTURE_TRIGGER_ICON_COLOR}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${CAMERA_ICON_PATH}"/><circle cx="12" cy="13" r="3"/></svg>`;
  const img = new Image();
  img.onload = () => {
    canvas.getContext("2d")?.drawImage(img, 0, 0, 128, 128);
    texture.needsUpdate = true;
  };
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  return sprite;
}

export function createCaptureTrigger(
  scene: THREE.Scene,
  frustumHalfHeight: number,
): CaptureTrigger {
  const half = CAPTURE_TRIGGER_BOX_SIZE / 2;
  const ringInner = half * 0.35;
  const ringOuter = half * 0.6;

  const outlineMaterial = new THREE.LineBasicMaterial({
    color: CAPTURE_TRIGGER_BOX_COLOR,
    transparent: true,
    opacity: 0.6,
    depthTest: false,
  });
  const corners = [
    new THREE.Vector3(-half, -half, 0),
    new THREE.Vector3(half, -half, 0),
    new THREE.Vector3(half, half, 0),
    new THREE.Vector3(-half, half, 0),
  ];
  const outlineGeometry = new THREE.BufferGeometry().setFromPoints(corners);
  const outline = new THREE.LineLoop(outlineGeometry, outlineMaterial);
  scene.add(outline);

  const icon = makeCameraIconSprite(CAPTURE_TRIGGER_BOX_SIZE * 0.5);
  outline.add(icon);

  const ringMaterial = new THREE.MeshBasicMaterial({
    color: CAPTURE_TRIGGER_PROGRESS_COLOR,
    transparent: true,
    opacity: 0.9,
    depthTest: false,
    side: THREE.DoubleSide,
  });
  const ringMesh = new THREE.Mesh(
    new THREE.RingGeometry(ringInner, ringOuter, RING_SEGMENTS, 1, 0, 0.001),
    ringMaterial,
  );
  const ringGroup = new THREE.Group();
  ringGroup.add(ringMesh);
  ringGroup.visible = false;
  outline.add(ringGroup);

  let center: WorldPoint = { x: 0, y: 0 };
  let progress = 0;
  let cooldown = false;
  let lastTime: number | null = null;

  function resize(width: number, height: number) {
    const halfWidth = frustumHalfHeight * (width / height);
    // Mirrored to the bottom-left: negative x/y vs. the selector's
    // bottom-right stack, same distances for visual symmetry.
    center = {
      x: -halfWidth * CAPTURE_TRIGGER_BOX_MARGIN_X,
      y: -frustumHalfHeight * CAPTURE_TRIGGER_BOX_Y,
    };
    outline.position.set(center.x, center.y, 0);
  }

  function update(frames: HandFrame[], lmToWorld: ToWorld): boolean {
    const now = performance.now();
    const dt = lastTime === null ? 16 : now - lastTime;
    lastTime = now;

    if (cooldown) return false;

    const hovering = frames.some((frame) =>
      frame.landmarks.some((lm) => {
        const p = lmToWorld(lm);
        return (
          Math.abs(p.x - center.x) < half && Math.abs(p.y - center.y) < half
        );
      }),
    );

    progress = Math.max(
      0,
      Math.min(
        1,
        progress + (hovering ? 1 : -1) * (dt / CAPTURE_TRIGGER_HOVER_MS),
      ),
    );

    ringGroup.visible = progress > 0;
    if (progress > 0) {
      ringGroup.rotation.z -= CAPTURE_TRIGGER_SPIN_RAD_PER_MS * dt;
      ringMesh.geometry.dispose();
      ringMesh.geometry = new THREE.RingGeometry(
        ringInner,
        ringOuter,
        RING_SEGMENTS,
        1,
        0,
        Math.max(0.001, progress * Math.PI * 2),
      );
    }

    if (progress >= 1) {
      progress = 0;
      ringGroup.visible = false;
      cooldown = true;
      setTimeout(() => {
        cooldown = false;
      }, CAPTURE_TRIGGER_COOLDOWN_MS);
      return true;
    }
    return false;
  }

  function setVisible(visible: boolean) {
    outline.visible = visible;
  }

  function dispose() {
    scene.remove(outline);
    outlineGeometry.dispose();
    outlineMaterial.dispose();
    ringMesh.geometry.dispose();
    ringMaterial.dispose();
    icon.material.map?.dispose();
    icon.material.dispose();
  }

  return { resize, update, setVisible, dispose };
}
