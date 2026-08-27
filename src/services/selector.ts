import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { MODELS } from "@/constants/models";
import {
  SELECTOR_BOX_COLOR,
  SELECTOR_BOX_MARGIN_X,
  SELECTOR_BOX_SIZE,
  SELECTOR_BOX_Y,
  SELECTOR_CHECK_COLOR,
  SELECTOR_COOLDOWN_MS,
  SELECTOR_HOVER_MS,
  SELECTOR_LOADER_COLOR,
  SELECTOR_LOADER_SPIN_RAD_PER_MS,
  SELECTOR_PREVIEW_SIZE,
  SELECTOR_PREVIEW_SPIN_RAD_PER_MS,
  SELECTOR_PROGRESS_COLOR,
  SELECTOR_SPIN_RAD_PER_MS,
  SELECTOR_STACK_GAP,
} from "@/constants/scene";
import type { HandFrame } from "@/types/hand";
import type { ModelDef } from "@/types/scene";

const RING_INNER = (SELECTOR_BOX_SIZE / 2) * 0.35;
const RING_OUTER = (SELECTOR_BOX_SIZE / 2) * 0.6;
const RING_SEGMENTS = 32;

type WorldPoint = { x: number; y: number };
type ToWorld = (lm: { x: number; y: number }) => WorldPoint;

type PreviewMesh = THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;

interface Box {
  center: WorldPoint;
  outline: THREE.LineLoop;
  ringGroup: THREE.Group;
  ringMesh: THREE.Mesh;
  progress: number;
  preview: PreviewMesh | null;
  check: THREE.Sprite;
  loader: THREE.Sprite;
  cooldown: boolean;
}

export interface ModelSelector {
  resize(width: number, height: number): void;
  /** Returns the index of a model that just finished loading via hover-hold, or null. */
  update(frames: HandFrame[], lmToWorld: ToWorld): number | null;
  setVisible(visible: boolean): void;
  dispose(): void;
}

function loadPreviewMesh(model: ModelDef, onLoad: (mesh: PreviewMesh) => void) {
  new STLLoader().load(model.stlUrl, (geometry) => {
    if (model.rotation?.x) geometry.rotateX(model.rotation.x);
    if (model.rotation?.y) geometry.rotateY(model.rotation.y);
    if (model.rotation?.z) geometry.rotateZ(model.rotation.z);
    geometry.computeBoundingBox();
    geometry.computeVertexNormals();
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    geometry.boundingBox?.getCenter(center);
    geometry.boundingBox?.getSize(size);
    geometry.translate(-center.x, -center.y, -center.z);
    const scale = SELECTOR_PREVIEW_SIZE / Math.max(size.x, size.y, size.z);

    const material = new THREE.MeshStandardMaterial({
      color: model.color,
      metalness: 0.25,
      roughness: 0.35,
      side: THREE.DoubleSide,
    });
    const mesh: PreviewMesh = new THREE.Mesh(geometry, material);
    mesh.scale.setScalar(scale);
    onLoad(mesh);
  });
}

function makeCheckSprite(): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.strokeStyle = SELECTOR_CHECK_COLOR;
    ctx.lineWidth = 14;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(28, 68);
    ctx.lineTo(54, 94);
    ctx.lineTo(100, 34);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(SELECTOR_PREVIEW_SIZE, SELECTOR_PREVIEW_SIZE, 1);
  sprite.visible = false;
  return sprite;
}

/** Spinning partial ring shown in a box while its STL preview is still loading. */
function makeLoaderSprite(): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.strokeStyle = SELECTOR_LOADER_COLOR;
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(64, 64, 48, 0, Math.PI * 1.5);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(SELECTOR_PREVIEW_SIZE * 0.7, SELECTOR_PREVIEW_SIZE * 0.7, 1);
  return sprite;
}

export function createModelSelector(
  scene: THREE.Scene,
  frustumHalfHeight: number,
): ModelSelector {
  const outlineMaterial = new THREE.LineBasicMaterial({
    color: SELECTOR_BOX_COLOR,
    transparent: true,
    opacity: 0.6,
    depthTest: false,
  });
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: SELECTOR_PROGRESS_COLOR,
    transparent: true,
    opacity: 0.9,
    depthTest: false,
    side: THREE.DoubleSide,
  });

  const half = SELECTOR_BOX_SIZE / 2;
  const boxes: Box[] = MODELS.map((model) => {
    const corners = [
      new THREE.Vector3(-half, -half, 0),
      new THREE.Vector3(half, -half, 0),
      new THREE.Vector3(half, half, 0),
      new THREE.Vector3(-half, half, 0),
    ];
    const outlineGeometry = new THREE.BufferGeometry().setFromPoints(corners);
    const outline = new THREE.LineLoop(outlineGeometry, outlineMaterial);
    scene.add(outline);

    const ringGeometry = new THREE.RingGeometry(
      RING_INNER,
      RING_OUTER,
      RING_SEGMENTS,
      1,
      0,
      0.001,
    );
    const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
    const ringGroup = new THREE.Group();
    ringGroup.add(ringMesh);
    ringGroup.visible = false;
    outline.add(ringGroup);

    const check = makeCheckSprite();
    outline.add(check);

    const loader = makeLoaderSprite();
    outline.add(loader);

    const box: Box = {
      center: { x: 0, y: 0 },
      outline,
      ringGroup,
      ringMesh,
      progress: 0,
      preview: null,
      check,
      loader,
      cooldown: false,
    };
    loadPreviewMesh(model, (mesh) => {
      box.preview = mesh;
      box.loader.visible = false;
      outline.add(mesh);
    });
    return box;
  });

  function resize(width: number, height: number) {
    const halfWidth = frustumHalfHeight * (width / height);
    const x = halfWidth * SELECTOR_BOX_MARGIN_X;
    const baseY = -frustumHalfHeight * SELECTOR_BOX_Y;
    boxes.forEach((box, i) => {
      const y = baseY + i * (SELECTOR_BOX_SIZE + SELECTOR_STACK_GAP);
      box.center = { x, y };
      box.outline.position.set(x, y, 0);
    });
  }

  let lastTime: number | null = null;

  function update(frames: HandFrame[], lmToWorld: ToWorld): number | null {
    const now = performance.now();
    const dt = lastTime === null ? 16 : now - lastTime;
    lastTime = now;

    let selected: number | null = null;

    boxes.forEach((box, i) => {
      if (box.preview) {
        box.preview.rotation.y += SELECTOR_PREVIEW_SPIN_RAD_PER_MS * dt;
      } else {
        box.loader.material.rotation -= SELECTOR_LOADER_SPIN_RAD_PER_MS * dt;
      }

      if (box.cooldown) return;

      // Any landmark counts: a fingertip, a knuckle, the palm, the whole
      // hand passing through the box should all trigger the selector, not
      // just a precisely-aimed index fingertip.
      const hovering = frames.some((frame) =>
        frame.landmarks.some((lm) => {
          const p = lmToWorld(lm);
          return (
            Math.abs(p.x - box.center.x) < half &&
            Math.abs(p.y - box.center.y) < half
          );
        }),
      );

      box.progress = Math.max(
        0,
        Math.min(
          1,
          box.progress + (hovering ? 1 : -1) * (dt / SELECTOR_HOVER_MS),
        ),
      );

      box.ringGroup.visible = box.progress > 0;
      if (box.progress > 0) {
        box.ringGroup.rotation.z -= SELECTOR_SPIN_RAD_PER_MS * dt;
        box.ringMesh.geometry.dispose();
        box.ringMesh.geometry = new THREE.RingGeometry(
          RING_INNER,
          RING_OUTER,
          RING_SEGMENTS,
          1,
          0,
          Math.max(0.001, box.progress * Math.PI * 2),
        );
      }

      if (box.progress >= 1) {
        selected = i;
        box.progress = 0;
        box.ringGroup.visible = false;
        box.cooldown = true;
        box.check.visible = true;
        setTimeout(() => {
          box.cooldown = false;
          box.check.visible = false;
        }, SELECTOR_COOLDOWN_MS);
      }
    });

    return selected;
  }

  function setVisible(visible: boolean) {
    for (const box of boxes) box.outline.visible = visible;
  }

  function dispose() {
    for (const box of boxes) {
      scene.remove(box.outline);
      box.outline.geometry.dispose();
      box.ringMesh.geometry.dispose();
      box.preview?.geometry.dispose();
      box.preview?.material.dispose();
      for (const child of box.outline.children) {
        if (child instanceof THREE.Sprite) {
          child.material.map?.dispose();
          child.material.dispose();
        }
      }
    }
    outlineMaterial.dispose();
    ringMaterial.dispose();
  }

  return { resize, update, setVisible, dispose };
}
