import * as THREE from "three";
import { FINGERTIPS, WRIST } from "@/constants/hand";
import {
  FINGERS_ENABLED,
  HUD_COLOR,
  HUD_LINE_OPACITY,
  HUD_SQUARE_SIZE,
} from "@/constants/scene";
import type { HandLandmarks } from "@/types/hand";

type WorldPoint = { x: number; y: number };
type ToWorld = (lm: { x: number; y: number }) => WorldPoint;

const SQUARE_VERTS = FINGERTIPS.length * 4 * 2; // 4 edges/square, 2 verts/edge
const CONNECTOR_VERTS = (FINGERTIPS.length - 1 + FINGERTIPS.length) * 2; // fingertip chain + spokes to wrist

interface HandHud {
  group: THREE.Group;
  squares: THREE.LineSegments;
  connectors: THREE.LineSegments;
}

export interface HandHudPool {
  update(slot: number, landmarks: HandLandmarks, lmToWorld: ToWorld): void;
  hide(slot: number): void;
  setEnabled(enabled: boolean): void;
  dispose(): void;
}

function makeLineSegments(
  vertCount: number,
  material: THREE.LineBasicMaterial,
) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(vertCount * 3), 3),
  );
  return new THREE.LineSegments(geometry, material);
}

export function createHandHudPool(
  scene: THREE.Scene,
  maxHands: number,
): HandHudPool {
  let enabled = FINGERS_ENABLED;

  const material = new THREE.LineBasicMaterial({
    color: HUD_COLOR,
    transparent: true,
    opacity: HUD_LINE_OPACITY,
    blending: THREE.AdditiveBlending,
    depthTest: false,
  });

  const huds: HandHud[] = [];
  for (let i = 0; i < maxHands; i++) {
    const squares = makeLineSegments(SQUARE_VERTS, material);
    const connectors = makeLineSegments(CONNECTOR_VERTS, material);
    const group = new THREE.Group();
    group.add(squares, connectors);
    group.visible = false;
    scene.add(group);
    huds.push({ group, squares, connectors });
  }

  function update(slot: number, landmarks: HandLandmarks, lmToWorld: ToWorld) {
    if (!enabled) {
      hide(slot);
      return;
    }
    const hud = huds[slot];
    if (!hud) return;
    hud.group.visible = true;

    const tips = FINGERTIPS.map((idx) => lmToWorld(landmarks[idx]));
    const half = HUD_SQUARE_SIZE / 2;

    const squarePos = hud.squares.geometry.attributes
      .position as THREE.BufferAttribute;
    let vi = 0;
    for (const tip of tips) {
      const corners: WorldPoint[] = [
        { x: tip.x - half, y: tip.y - half },
        { x: tip.x + half, y: tip.y - half },
        { x: tip.x + half, y: tip.y + half },
        { x: tip.x - half, y: tip.y + half },
      ];
      for (let i = 0; i < 4; i++) {
        const a = corners[i];
        const b = corners[(i + 1) % 4];
        squarePos.setXYZ(vi++, a.x, a.y, 0);
        squarePos.setXYZ(vi++, b.x, b.y, 0);
      }
    }
    squarePos.needsUpdate = true;

    const wrist = lmToWorld(landmarks[WRIST]);
    const connectorPos = hud.connectors.geometry.attributes
      .position as THREE.BufferAttribute;
    let ci = 0;
    for (let i = 0; i < tips.length - 1; i++) {
      connectorPos.setXYZ(ci++, tips[i].x, tips[i].y, 0);
      connectorPos.setXYZ(ci++, tips[i + 1].x, tips[i + 1].y, 0);
    }
    for (const tip of tips) {
      connectorPos.setXYZ(ci++, tip.x, tip.y, 0);
      connectorPos.setXYZ(ci++, wrist.x, wrist.y, 0);
    }
    connectorPos.needsUpdate = true;
  }

  function hide(slot: number) {
    const hud = huds[slot];
    if (hud) hud.group.visible = false;
  }

  function setEnabled(next: boolean) {
    enabled = next;
    if (!enabled) {
      for (let slot = 0; slot < maxHands; slot++) hide(slot);
    }
  }

  function dispose() {
    for (const hud of huds) {
      scene.remove(hud.group);
      hud.squares.geometry.dispose();
      hud.connectors.geometry.dispose();
    }
    material.dispose();
  }

  return { update, hide, setEnabled, dispose };
}
