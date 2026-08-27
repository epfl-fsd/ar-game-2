import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import {
  CULL_X,
  CULL_Y,
  GRAVITY,
  HAND_SCALE_MAX,
  HAND_SCALE_MIN,
  HAND_SCALE_REF_PX,
  LAUNCH_COOLDOWN_MS,
  LAUNCH_SPEED,
  LOGO_TARGET_SIZE,
  MAX_PROJECTILES,
} from "@/constants/scene";
import { normalizedDirection, pixelDistance } from "@/lib/gestures";
import { createHandHudPool } from "@/services/handHud";
import type { HandFrame, HandLandmarks } from "@/types/hand";
import type { ThreeSceneHandle } from "@/types/scene";

type LogoMesh = THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;

interface Projectile {
  mesh: LogoMesh;
  vx: number;
  vy: number;
}

export function createThreeScene(
  canvas: HTMLCanvasElement,
  options: { maxHands: number; stlUrl: string; logoColor: number },
): ThreeSceneHandle {
  let width = canvas.clientWidth || window.innerWidth;
  let height = canvas.clientHeight || window.innerHeight;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.z = 5;
  // Constant: fov/z never change, so the half-height of the view frustum at z=0 is fixed.
  const frustumHalfHeight =
    Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;

  scene.add(new THREE.AmbientLight(0xffffff, 0.45));
  const keyLight = new THREE.DirectionalLight(0xfff5ee, 2.2);
  keyLight.position.set(2, 4, 6);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xddeeff, 0.8);
  fillLight.position.set(-5, 2, 3);
  scene.add(fillLight);
  const rimLight = new THREE.DirectionalLight(0xff6688, 0.6);
  rimLight.position.set(4, -2, -5);
  scene.add(rimLight);

  let logoGeometry: THREE.BufferGeometry | null = null;
  let logoBaseScale = 1;

  new STLLoader().load(
    options.stlUrl,
    (geometry) => {
      geometry.computeBoundingBox();
      geometry.computeVertexNormals();
      const center = new THREE.Vector3();
      const size = new THREE.Vector3();
      geometry.boundingBox?.getCenter(center);
      geometry.boundingBox?.getSize(size);
      geometry.translate(-center.x, -center.y, -center.z);
      logoBaseScale = LOGO_TARGET_SIZE / Math.max(size.x, size.y, size.z);
      logoGeometry = geometry;
    },
    undefined,
    (error) => console.warn("EPFL.stl failed to load:", error),
  );

  function createLogoMesh(): LogoMesh | null {
    if (!logoGeometry) return null;
    const material = new THREE.MeshStandardMaterial({
      color: options.logoColor,
      metalness: 0.25,
      roughness: 0.35,
    });
    const mesh: LogoMesh = new THREE.Mesh(logoGeometry, material);
    scene.add(mesh);
    return mesh;
  }

  function lmToWorld(lm: { x: number; y: number }): { x: number; y: number } {
    const nx = (1 - lm.x) * 2 - 1;
    const ny = -(lm.y * 2 - 1);
    return {
      x: nx * frustumHalfHeight * (width / height),
      y: ny * frustumHalfHeight,
    };
  }

  const held: (LogoMesh | null)[] = Array(options.maxHands).fill(null);
  const launchCooldown: boolean[] = Array(options.maxHands).fill(false);
  const projectiles: Projectile[] = [];
  const hud = createHandHudPool(scene, options.maxHands);

  function launch(slot: number, landmarks: HandLandmarks) {
    const mesh = held[slot];
    if (!mesh) return;
    held[slot] = null;

    const direction = normalizedDirection(
      lmToWorld(landmarks[0]),
      lmToWorld(landmarks[12]),
    );

    if (projectiles.length >= MAX_PROJECTILES) {
      const oldest = projectiles.shift();
      if (oldest) {
        scene.remove(oldest.mesh);
        oldest.mesh.material.dispose();
      }
    }
    projectiles.push({
      mesh,
      vx: direction.x * LAUNCH_SPEED,
      vy: direction.y * LAUNCH_SPEED,
    });

    launchCooldown[slot] = true;
    setTimeout(() => {
      launchCooldown[slot] = false;
    }, LAUNCH_COOLDOWN_MS);
  }

  function follow(slot: number, landmarks: HandLandmarks) {
    if (launchCooldown[slot]) return;
    if (!held[slot]) held[slot] = createLogoMesh();
    const mesh = held[slot];
    if (!mesh) return; // STL not loaded yet

    const palmWorld = lmToWorld(landmarks[9]);
    const handLenPx = pixelDistance(landmarks[0], landmarks[12], width, height);
    const scale = Math.max(
      HAND_SCALE_MIN,
      Math.min(HAND_SCALE_MAX, handLenPx / HAND_SCALE_REF_PX),
    );

    mesh.visible = true;
    mesh.position.set(palmWorld.x, palmWorld.y, 0);
    mesh.scale.setScalar(scale * logoBaseScale);
  }

  function updateHands(frames: HandFrame[]) {
    const activeSlots = new Set(frames.map((frame) => frame.slot));
    for (let slot = 0; slot < options.maxHands; slot++) {
      const mesh = held[slot];
      if (!activeSlots.has(slot) && mesh) mesh.visible = false;
      if (!activeSlots.has(slot)) hud.hide(slot);
    }

    for (const frame of frames) {
      if (
        frame.justPinched &&
        held[frame.slot] &&
        !launchCooldown[frame.slot]
      ) {
        launch(frame.slot, frame.landmarks);
      } else {
        follow(frame.slot, frame.landmarks);
      }
      hud.update(frame.slot, frame.landmarks, lmToWorld);
    }
  }

  function resize(nextWidth: number, nextHeight: number) {
    width = nextWidth;
    height = nextHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  let rafId: number;
  function animate() {
    rafId = requestAnimationFrame(animate);
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      p.vy -= GRAVITY;
      p.mesh.position.x += p.vx;
      p.mesh.position.y += p.vy;
      p.mesh.rotation.x += 0.04;
      p.mesh.rotation.y += 0.06;
      if (Math.abs(p.mesh.position.x) > CULL_X || p.mesh.position.y < CULL_Y) {
        scene.remove(p.mesh);
        p.mesh.material.dispose();
        projectiles.splice(i, 1);
      }
    }
    renderer.render(scene, camera);
  }
  animate();

  function dispose() {
    cancelAnimationFrame(rafId);
    for (const mesh of held) {
      if (mesh) {
        scene.remove(mesh);
        mesh.material.dispose();
      }
    }
    for (const p of projectiles) {
      scene.remove(p.mesh);
      p.mesh.material.dispose();
    }
    projectiles.length = 0;
    hud.dispose();
    logoGeometry?.dispose();
    renderer.dispose();
  }

  return { updateHands, resize, dispose };
}
