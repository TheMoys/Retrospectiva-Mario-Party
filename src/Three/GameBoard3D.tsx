import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RotateCcw, Crosshair, Eye, Video, VideoOff } from 'lucide-react';
import { GameState, Player } from '@/types/game';
import { BOARD_SPACES } from '@/constants/boardSpaces';
import { CHARACTERS } from '@/constants/characters';
import { sounds } from '@/audio/soundEffects';
import {
  getTrackPoint,
  getSpacePosition,
  getSpaceTrackParameter,
  getClusterOffset,
  getPlayerPositionOnSpace,
  TRACK_SPECS,
} from './trackMath';
import { createCharacterPawn } from './pawnGeometries';

interface GameBoard3DProps {
  gameState: GameState;
}

type CameraPreset = 'default' | 'character' | 'top' | 'custom';

interface PawnAnimState {
  pos: THREE.Vector3;
  yaw: number;
  roll: number;
  scaleY: number;
  scaleXZ: number;
  spawnProgress: number;
  targetPos: THREE.Vector3;
  targetYaw: number;
  isMovingActive: boolean;
  moveStartOffset: THREE.Vector3;
  moveEndOffset: THREE.Vector3;
  lastMovementKey: string;
}

interface ShockwaveEntry {
  mesh: THREE.Mesh;
  active: boolean;
  life: number;
}

interface BurstParticleSystem {
  mesh: THREE.Points;
  pos: Float32Array;
  vel: Float32Array;
  life: Float32Array;
  colors: Float32Array;
}

// 6 Authentic Mario Kart Rainbow Road Neon Lanes
const RAINBOW_LANES = [
  { id: 'red', color: 0xff0044, emissive: 0xff0033, name: 'Boo Lane' },
  { id: 'orange', color: 0xff6600, emissive: 0xff5500, name: 'Huesitos Lane' },
  { id: 'yellow', color: 0xffea00, emissive: 0xffcc00, name: 'ShyGuy Lane' },
  { id: 'green', color: 0x00ff66, emissive: 0x00dd44, name: 'Luigi Lane' },
  { id: 'cyan', color: 0x00d4ff, emissive: 0x00aaff, name: 'Yoshi Lane' },
  { id: 'purple', color: 0xaa00ff, emissive: 0x8800ff, name: 'Rosalina Lane' },
];

const DEFAULT_CAMERA_POS = new THREE.Vector3(0, 15.2, 13.6);
const DEFAULT_CAMERA_TARGET = new THREE.Vector3(0, 0.3, -0.3);

function shortestAngleDiff(from: number, to: number): number {
  let diff = to - from;
  while (diff < -Math.PI) diff += Math.PI * 2;
  while (diff > Math.PI) diff -= Math.PI * 2;
  return diff;
}

function smoothstep01(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const x = Math.max(0, Math.min(1, t)) - 1;
  return 1 + c3 * x * x * x + c1 * x * x;
}

// Soft radial Gaussian star/particle glow sprite (eliminates square Points quads)
function createSoftGlowSpriteTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.28, 'rgba(255, 255, 255, 0.85)');
  grad.addColorStop(0.62, 'rgba(255, 255, 255, 0.25)');
  grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

// High-detail 512x512 Mario Kart 8 beveled crystal diamond grid texture
function createCrystalGridTexture(anisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.fillRect(0, 0, 512, 512);

  // Diagonal crystal facets
  const sheen = ctx.createLinearGradient(0, 0, 512, 512);
  sheen.addColorStop(0.0, 'rgba(255, 255, 255, 0.48)');
  sheen.addColorStop(0.35, 'rgba(255, 255, 255, 0.10)');
  sheen.addColorStop(0.68, 'rgba(255, 255, 255, 0.28)');
  sheen.addColorStop(1.0, 'rgba(255, 255, 255, 0.42)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, 512, 512);

  // Outer crystal tile frame
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, 504, 504);

  // Inner beveled facet border + crosshairs
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.36)';
  ctx.lineWidth = 3;
  ctx.strokeRect(24, 24, 464, 464);

  ctx.beginPath();
  ctx.moveTo(256, 24);
  ctx.lineTo(488, 256);
  ctx.lineTo(256, 488);
  ctx.lineTo(24, 256);
  ctx.closePath();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.30)';
  ctx.lineWidth = 3;
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 44);
  texture.anisotropy = anisotropy;
  return texture;
}

// Seamless 1024x512 3D Cosmic Aurora Sky Dome texture
function createSkyDomeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const baseGrad = ctx.createLinearGradient(0, 0, 0, 512);
  baseGrad.addColorStop(0.0, '#04071a');
  baseGrad.addColorStop(0.28, '#0b1038');
  baseGrad.addColorStop(0.54, '#21104d');
  baseGrad.addColorStop(0.78, '#170a36');
  baseGrad.addColorStop(1.0, '#09061a');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, 1024, 512);

  // Seamless aurora ribbons wrapping around X = 0 and X = 1024
  const addWrapGlow = (cx: number, cy: number, r: number, inner: string, mid: string) => {
    [cx - 1024, cx, cx + 1024].forEach((xPos) => {
      const g = ctx.createRadialGradient(xPos, cy, 10, xPos, cy, r);
      g.addColorStop(0, inner);
      g.addColorStop(0.5, mid);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 1024, 512);
    });
  };

  addWrapGlow(220, 250, 220, 'rgba(147, 51, 234, 0.28)', 'rgba(59, 130, 246, 0.12)');
  addWrapGlow(680, 210, 240, 'rgba(6, 182, 212, 0.24)', 'rgba(99, 102, 241, 0.10)');
  addWrapGlow(930, 280, 190, 'rgba(236, 72, 153, 0.22)', 'rgba(168, 85, 247, 0.08)');

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createRadialNebulaTexture(innerColor: string, outerColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
  gradient.addColorStop(0, innerColor);
  gradient.addColorStop(0.45, outerColor);
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(canvas);
}

// Crisp 256x256 top decal for board tiles (WCAG-safe icon contrast on bright yellow/green tiles)
function createSpaceIconTexture(type: string, colorHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const isYellow = type === 'yellow';
  const grad = ctx.createRadialGradient(112, 100, 12, 128, 128, 118);
  if (isYellow) {
    grad.addColorStop(0, '#fde047');
    grad.addColorStop(0.65, '#eab308');
    grad.addColorStop(1, '#ca8a04');
  } else {
    grad.addColorStop(0, colorHex);
    grad.addColorStop(0.75, colorHex);
    grad.addColorStop(1, '#0f172a');
  }

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(128, 128, 114, 0, Math.PI * 2);
  ctx.fill();

  // Inner subtle top crescent sheen (muted on yellow to preserve contrast)
  ctx.fillStyle = isYellow ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.18)';
  ctx.beginPath();
  ctx.ellipse(128, 76, 76, 36, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = isYellow ? '#fef08a' : '#ffffff';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(128, 128, 112, 0, Math.PI * 2);
  ctx.stroke();

  if (isYellow) {
    // Draw crisp geometric vector bolt (avoids Linux/Chromium color-emoji bitmap ignoring fillStyle)
    ctx.beginPath();
    ctx.moveTo(142, 56);
    ctx.lineTo(84, 134);
    ctx.lineTo(124, 134);
    ctx.lineTo(110, 200);
    ctx.lineTo(172, 118);
    ctx.lineTo(132, 118);
    ctx.closePath();
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 10;
    ctx.stroke();
    ctx.fillStyle = '#0f172a';
    ctx.fill();
  } else {
    let symbol = '?';
    if (type === 'start' || type === 'green') symbol = '★';
    else if (type === 'red') symbol = '✕';

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 116px "Fredoka", "Arial Black", sans-serif';
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.lineWidth = 16;
    ctx.strokeText(symbol, 128, 132);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(symbol, 128, 132);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function drawQuestionBlockFrame(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#F59E0B';
  ctx.fillRect(0, 0, 128, 128);

  ctx.strokeStyle = '#78350F';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, 120, 120);

  ctx.fillStyle = '#78350F';
  const bolt = (x: number, y: number) => {
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
  };
  bolt(16, 16);
  bolt(112, 16);
  bolt(16, 112);
  bolt(112, 112);
}

function createQuestionBlockTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  drawQuestionBlockFrame(ctx);

  ctx.font = 'bold 80px "Fredoka", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 12;
  ctx.strokeText('?', 64, 68);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('?', 64, 68);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createQuestionBlockCapTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  drawQuestionBlockFrame(ctx);
  ctx.strokeStyle = 'rgba(120, 53, 15, 0.35)';
  ctx.lineWidth = 4;
  ctx.strokeRect(24, 24, 80, 80);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createCheckeredBannerTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 512, 128);

  const cell = 16;
  for (let col = 0; col < 512 / cell; col++) {
    ctx.fillStyle = col % 2 === 0 ? '#ffffff' : '#0f172a';
    ctx.fillRect(col * cell, 0, cell, 20);
    ctx.fillRect(col * cell, 108, cell, 20);
  }

  // Deep navy plaque bordered in gold for high-contrast crisp typography (> 14:1)
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 22, 512, 84);
  ctx.fillStyle = '#facc15';
  ctx.fillRect(0, 20, 512, 4);
  ctx.fillRect(0, 104, 512, 4);

  ctx.font = '900 40px "Fredoka", "Arial Black", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 8;
  ctx.strokeText('★ META • SALIDA ★', 256, 65);
  ctx.fillStyle = '#fef08a';
  ctx.fillText('★ META • SALIDA ★', 256, 65);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createLightBeamTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.0)');
  grad.addColorStop(0.35, 'rgba(254, 240, 138, 0.24)');
  grad.addColorStop(0.85, 'rgba(250, 204, 21, 0.58)');
  grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.75)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 256);
  return new THREE.CanvasTexture(canvas);
}

function createMarioSuperStar(): THREE.Group {
  const starGroup = new THREE.Group();
  starGroup.name = 'mario_super_star';

  const starShape = new THREE.Shape();
  const points = 5;
  const outerRadius = 1.35;
  const innerRadius = 0.62;

  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i * Math.PI) / points + Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) starShape.moveTo(x, y);
    else starShape.lineTo(x, y);
  }
  starShape.closePath();

  const starGeo = new THREE.ExtrudeGeometry(starShape, {
    depth: 0.44,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 1,
    bevelSize: 0.12,
    bevelThickness: 0.12,
  });
  starGeo.center();

  const starMat = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.68,
    metalness: 0.88,
    roughness: 0.16,
    envMapIntensity: 1.35,
    toneMapped: false,
  });
  const starMesh = new THREE.Mesh(starGeo, starMat);
  starMesh.castShadow = true;
  starGroup.add(starMesh);

  const createEyesGroup = (zPos: number) => {
    const eyesGroup = new THREE.Group();
    const eyeGeo = new THREE.CapsuleGeometry(0.065, 0.22, 12, 16);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0a });

    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.25, 0.05, zPos);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.25, 0.05, zPos);

    const glintGeo = new THREE.SphereGeometry(0.035, 8, 8);
    const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const leftGlint = new THREE.Mesh(glintGeo, glintMat);
    leftGlint.position.set(-0.23, 0.12, zPos + (zPos > 0 ? 0.04 : -0.04));

    const rightGlint = new THREE.Mesh(glintGeo, glintMat);
    rightGlint.position.set(0.27, 0.12, zPos + (zPos > 0 ? 0.04 : -0.04));

    eyesGroup.add(leftEye, rightEye, leftGlint, rightGlint);
    return eyesGroup;
  };

  starGroup.add(createEyesGroup(0.34));
  starGroup.add(createEyesGroup(-0.34));

  const torusGeo = new THREE.TorusGeometry(2.2, 0.042, 16, 64);
  const torusMat = new THREE.MeshBasicMaterial({
    color: 0xfde047,
    transparent: true,
    opacity: 0.85,
  });
  const torusMesh = new THREE.Mesh(torusGeo, torusMat);
  torusMesh.rotation.x = Math.PI / 2;
  starGroup.add(torusMesh);

  const torus2Geo = new THREE.TorusGeometry(2.5, 0.036, 16, 64);
  const torus2Mat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.8,
  });
  const torus2Mesh = new THREE.Mesh(torus2Geo, torus2Mat);
  torus2Mesh.rotation.x = Math.PI / 3;
  torus2Mesh.rotation.y = Math.PI / 6;
  torus2Mesh.name = 'star_tilted_ring';
  starGroup.add(torus2Mesh);

  starGroup.position.set(0, 1.35, 0);
  return starGroup;
}

function createAuthenticWarpPipe(colorHex: number, rimHex: number): THREE.Group {
  const pipeGroup = new THREE.Group();

  const bodyGeo = new THREE.CylinderGeometry(0.72, 0.72, 1.2, 32);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: 0.18,
    metalness: 0.38,
    envMapIntensity: 1.25,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.6;
  body.castShadow = true;
  body.receiveShadow = true;
  pipeGroup.add(body);

  const lipGeo = new THREE.CylinderGeometry(0.84, 0.84, 0.38, 32);
  const lipMat = new THREE.MeshStandardMaterial({
    color: rimHex,
    roughness: 0.15,
    metalness: 0.42,
    envMapIntensity: 1.3,
  });
  const lip = new THREE.Mesh(lipGeo, lipMat);
  lip.position.y = 1.3;
  lip.castShadow = true;
  pipeGroup.add(lip);

  const holeGeo = new THREE.CircleGeometry(0.68, 32);
  const holeMat = new THREE.MeshBasicMaterial({ color: 0x051308 });
  const hole = new THREE.Mesh(holeGeo, holeMat);
  hole.rotation.x = -Math.PI / 2;
  hole.position.y = 1.495;
  pipeGroup.add(hole);

  const piranha = new THREE.Group();
  piranha.name = 'piranha_head';

  const stemGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.8, 16);
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.3 });
  const stem = new THREE.Mesh(stemGeo, stemMat);
  stem.position.y = 0.4;
  piranha.add(stem);

  const headGroup = new THREE.Group();
  headGroup.position.y = 0.85;

  const headGeo = new THREE.SphereGeometry(0.38, 20, 20);
  const headMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.25 });
  headGroup.add(new THREE.Mesh(headGeo, headMat));

  const lipTorusGeo = new THREE.TorusGeometry(0.32, 0.08, 12, 24, Math.PI);
  const lipWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
  const upperLip = new THREE.Mesh(lipTorusGeo, lipWhiteMat);
  upperLip.position.set(0, 0.1, 0.22);
  upperLip.rotation.x = 0.3;
  headGroup.add(upperLip);

  const toothGeo = new THREE.ConeGeometry(0.04, 0.1, 6);
  for (let i = -2; i <= 2; i++) {
    const tooth = new THREE.Mesh(toothGeo, lipWhiteMat);
    tooth.position.set(i * 0.09, 0.06, 0.28);
    tooth.rotation.x = Math.PI;
    headGroup.add(tooth);
  }

  const spotGeo = new THREE.CircleGeometry(0.065, 12);
  const spotMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  const spot1 = new THREE.Mesh(spotGeo, spotMat);
  spot1.position.set(0.18, 0.24, 0.2);
  spot1.lookAt(0.36, 0.48, 0.4);
  const spot2 = spot1.clone();
  spot2.position.set(-0.18, 0.24, 0.2);
  spot2.lookAt(-0.36, 0.48, 0.4);
  headGroup.add(spot1, spot2);

  piranha.add(headGroup);
  piranha.position.y = 0.35;
  pipeGroup.add(piranha);

  return pipeGroup;
}

// 3D Rainbow Start / Finish Gate Arch framing the threshold right before Space 0
function createStartFinishArch(halfTotalWidth: number): THREE.Group {
  const gatePt = getTrackPoint(0.975, 0);
  const gateGroup = new THREE.Group();
  gateGroup.name = 'start_finish_arch';
  gateGroup.position.copy(gatePt.position);

  // Orient local X perpendicular across lanes and local Z along track flow (right-handed basis)
  const up = new THREE.Vector3(0, 1, 0);
  const forward = gatePt.tangent.clone().normalize();
  const right = new THREE.Vector3().crossVectors(up, forward).normalize();
  const basis = new THREE.Matrix4().makeBasis(right, up, forward);
  gateGroup.quaternion.setFromRotationMatrix(basis);

  const pillarSpanX = halfTotalWidth + 0.56; // +/- 2.21, completely outside curbs
  const pillarHeight = 2.0;

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    metalness: 0.88,
    roughness: 0.22,
    emissive: 0xd97706,
    emissiveIntensity: 0.22,
    envMapIntensity: 1.15,
  });

  const pillarGeo = new THREE.CylinderGeometry(0.10, 0.13, pillarHeight, 20);
  const baseGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.16, 20);
  const finialGeo = new THREE.OctahedronGeometry(0.16, 0);
  const finialMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.82,
    roughness: 0.15,
  });

  [-pillarSpanX, pillarSpanX].forEach((xPos) => {
    const base = new THREE.Mesh(baseGeo, goldMat);
    base.position.set(xPos, 0.08, 0);
    base.castShadow = true;
    gateGroup.add(base);

    const pillar = new THREE.Mesh(pillarGeo, goldMat);
    pillar.position.set(xPos, pillarHeight / 2, 0);
    pillar.castShadow = true;
    gateGroup.add(pillar);

    const finial = new THREE.Mesh(finialGeo, finialMat);
    finial.position.set(xPos, pillarHeight + 0.14, 0);
    gateGroup.add(finial);
  });

  // Overhead half-torus rainbow span cleanly within top-down viewport bounds (apex ~ 2.90)
  const archGeo = new THREE.TorusGeometry(pillarSpanX, 0.085, 14, 48, Math.PI);
  const archMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.62,
    metalness: 0.72,
    roughness: 0.22,
  });
  const archMesh = new THREE.Mesh(archGeo, archMat);
  archMesh.position.set(0, pillarHeight - 0.10, 0);
  archMesh.scale.set(1, 0.45, 1);
  gateGroup.add(archMesh);

  // Solid golden saddle bracket physically anchoring the signboard onto the arch apex
  const saddleMesh = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.24, 0.24), goldMat);
  saddleMesh.position.set(0, pillarHeight + 0.88, 0);
  gateGroup.add(saddleMesh);

  // Double-sided Meta/Salida marquee tilted cleanly toward isometric viewer (dotToCam > 0.93)
  const bannerPivot = new THREE.Group();
  bannerPivot.position.set(0, pillarHeight + 1.06, 0);
  bannerPivot.rotation.y = -1.25;

  const bannerTex = createCheckeredBannerTexture();
  const faceMat = new THREE.MeshStandardMaterial({
    map: bannerTex,
    emissive: 0xffffff,
    emissiveMap: bannerTex,
    emissiveIntensity: 0.42,
    roughness: 0.72,
    metalness: 0.05,
    toneMapped: true,
  });
  const bannerMesh = new THREE.Mesh(
    new THREE.BoxGeometry(2.45, 0.48, 0.10),
    [goldMat, goldMat, goldMat, goldMat, faceMat, faceMat]
  );
  bannerMesh.rotation.x = -0.22;
  bannerMesh.castShadow = true;
  bannerPivot.add(bannerMesh);
  gateGroup.add(bannerPivot);

  return gateGroup;
}

// Curvy 3-petal Mario Kart style Banana Peel trap
function createBananaPeelTrap(): THREE.Group {
  const bananaGroup = new THREE.Group();
  const yellowMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xca8a04,
    emissiveIntensity: 0.32,
    roughness: 0.28,
    metalness: 0.1,
  });
  const brownMat = new THREE.MeshStandardMaterial({
    color: 0x5c3818,
    roughness: 0.6,
  });

  // Central brown top stem
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.055, 0.14, 10), brownMat);
  stem.position.y = 0.26;
  bananaGroup.add(stem);

  // 3 Splayed curved petals
  const petalGeo = new THREE.CapsuleGeometry(0.055, 0.22, 6, 10);
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const petalWrap = new THREE.Group();
    petalWrap.rotation.y = angle;

    const petal = new THREE.Mesh(petalGeo, yellowMat);
    petal.position.set(0, 0.14, 0.11);
    petal.rotation.x = 0.85;
    petal.castShadow = true;
    petalWrap.add(petal);

    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), brownMat);
    tip.position.set(0, 0.04, 0.22);
    petalWrap.add(tip);

    bananaGroup.add(petalWrap);
  }

  return bananaGroup;
}

export const GameBoard3D: React.FC<GameBoard3DProps> = ({ gameState }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const gameStateRef = useRef<GameState>(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const [autoFollow, setAutoFollow] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return true;
  });
  const [activePreset, setActivePreset] = useState<CameraPreset>('default');
  const [isWideStage, setIsWideStage] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1220 : true
  );

  const autoFollowRef = useRef<boolean>(autoFollow);
  const activePresetRef = useRef<CameraPreset>('default');
  const reducedMotionRef = useRef<boolean>(false);

  useEffect(() => {
    autoFollowRef.current = autoFollow;
  }, [autoFollow]);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animFrameId = useRef<number | null>(null);

  // Smooth camera glide target + drag awareness
  const cameraGoalRef = useRef<{
    pos: THREE.Vector3;
    target: THREE.Vector3;
    active: boolean;
  }>({
    pos: DEFAULT_CAMERA_POS.clone(),
    target: DEFAULT_CAMERA_TARGET.clone(),
    active: false,
  });
  const isUserDraggingRef = useRef<boolean>(false);

  // Direct-DOM refs for zero-re-render 60fps floating name labels
  const labelElsRef = useRef<Map<string, HTMLDivElement>>(new Map());

  // 3D Objects References
  const starMeshRef = useRef<THREE.Group | null>(null);
  const orbitalRingRef = useRef<THREE.Mesh | null>(null);
  const pawnsMapRef = useRef<Map<string, THREE.Group>>(new Map());
  const pawnAnimRef = useRef<Map<string, PawnAnimState>>(new Map());
  const activeSpotlightRef = useRef<THREE.Mesh | null>(null);
  const activeLightBeamRef = useRef<THREE.Mesh | null>(null);
  const destinationRingRef = useRef<THREE.Group | null>(null);
  const bananaMeshesRef = useRef<THREE.Group[]>([]);
  const questionBlocksRef = useRef<THREE.Mesh[]>([]);
  const piranhasRef = useRef<THREE.Group[]>([]);
  const starBitsRef = useRef<THREE.Points | null>(null);
  const laneMaterialsRef = useRef<THREE.MeshStandardMaterial[]>([]);
  const spaceMaterialsRef = useRef<THREE.MeshStandardMaterial[]>([]);
  const spaceGroupsRef = useRef<THREE.Group[]>([]);
  const spaceOffsetYRef = useRef<Float32Array>(new Float32Array(TRACK_SPECS.totalSpaces));
  const spaceVelYRef = useRef<Float32Array>(new Float32Array(TRACK_SPECS.totalSpaces));
  const crystalTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const nebulaeMeshesRef = useRef<THREE.Mesh[]>([]);
  const planetGroupRef = useRef<THREE.Group | null>(null);
  const planet2GroupRef = useRef<THREE.Group | null>(null);
  const curbBeaconsRef = useRef<THREE.Mesh[]>([]);
  const shockwavesRef = useRef<ShockwaveEntry[]>([]);
  const burstPoolRef = useRef<BurstParticleSystem | null>(null);
  const shootingStarRef = useRef<{
    line: THREE.Line;
    active: boolean;
    progress: number;
    startX: number;
    startY: number;
    startZ: number;
    dirX: number;
    dirY: number;
    dirZ: number;
    speed: number;
  } | null>(null);
  const dustTrailRef = useRef<{
    mesh: THREE.Points;
    pos: Float32Array;
    life: Float32Array;
  } | null>(null);
  const lastStepSoundTileRef = useRef<number>(-1);
  const landingTriggeredKeyRef = useRef<string>('');
  const wasMovingRef = useRef<boolean>(false);

  // Camera Preset Controls (Smooth Damped Glides)
  const resetCamera = () => {
    activePresetRef.current = 'default';
    setActivePreset('default');
    cameraGoalRef.current = {
      pos: DEFAULT_CAMERA_POS.clone(),
      target: DEFAULT_CAMERA_TARGET.clone(),
      active: true,
    };
  };

  const focusActivePlayer = () => {
    const activePlayer = gameStateRef.current.players[gameStateRef.current.activePlayerIndex];
    if (!activePlayer) return;
    const pawn = pawnsMapRef.current.get(activePlayer.id);
    if (!pawn) return;

    const pawnPos = new THREE.Vector3();
    pawn.getWorldPosition(pawnPos);

    activePresetRef.current = 'character';
    setActivePreset('character');
    cameraGoalRef.current = {
      pos: new THREE.Vector3(pawnPos.x, pawnPos.y + 3.6, pawnPos.z + 5.2),
      target: new THREE.Vector3(pawnPos.x, pawnPos.y + 0.55, pawnPos.z),
      active: true,
    };
  };

  const topDownView = () => {
    activePresetRef.current = 'top';
    setActivePreset('top');
    cameraGoalRef.current = {
      pos: new THREE.Vector3(0, 25.5, 0.01),
      target: new THREE.Vector3(0, 0, 0),
      active: true,
    };
  };

  // Trigger tile depression spring + expanding shockwave ring + 3D sparkle burst
  const triggerTileImpact = (spaceIndex: number, hexColor: string, isLanding: boolean) => {
    const idx = ((spaceIndex % TRACK_SPECS.totalSpaces) + TRACK_SPECS.totalSpaces) % TRACK_SPECS.totalSpaces;

    // 1. Tile physical spring dip
    spaceOffsetYRef.current[idx] = Math.min(spaceOffsetYRef.current[idx], isLanding ? -0.14 : -0.09);
    spaceVelYRef.current[idx] = isLanding ? -1.4 : -0.8;

    if (reducedMotionRef.current) return;

    const tilePos = getSpacePosition(idx, 0.095);
    const color = new THREE.Color(hexColor);

    // 2. Shockwave ring(s)
    const ringsCount = isLanding ? 2 : 1;
    let spawnedRings = 0;
    for (const sw of shockwavesRef.current) {
      if (!sw.active) {
        sw.active = true;
        sw.life = 1.0 - spawnedRings * 0.18;
        sw.mesh.position.set(tilePos.x, 0.095 + spawnedRings * 0.04, tilePos.z);
        sw.mesh.scale.setScalar(1.0);
        const mat = sw.mesh.material as THREE.MeshBasicMaterial;
        mat.color.copy(isLanding && spawnedRings === 1 ? new THREE.Color(0xfef08a) : color);
        mat.opacity = isLanding ? 0.92 : 0.72;
        sw.mesh.visible = true;
        spawnedRings++;
        if (spawnedRings >= ringsCount) break;
      }
    }

    // 3. Sparkle burst particles
    if (burstPoolRef.current) {
      const { pos, vel, life, colors, mesh } = burstPoolRef.current;
      const toEmit = isLanding ? 24 : 8;
      let emitted = 0;
      const totalParticles = life.length;

      for (let i = 0; i < totalParticles && emitted < toEmit; i++) {
        if (life[i] <= 0) {
          const angle = Math.random() * Math.PI * 2;
          const speed = (isLanding ? 1.8 : 1.0) + Math.random() * 1.9;
          pos[i * 3] = tilePos.x + (Math.random() - 0.5) * 0.35;
          pos[i * 3 + 1] = 0.15;
          pos[i * 3 + 2] = tilePos.z + (Math.random() - 0.5) * 0.35;

          vel[i * 3] = Math.cos(angle) * speed;
          vel[i * 3 + 1] = (isLanding ? 2.4 : 1.5) + Math.random() * 1.8;
          vel[i * 3 + 2] = Math.sin(angle) * speed;

          const sparkleColor = Math.random() < 0.35 ? new THREE.Color(0xffffff) : color;
          colors[i * 3] = sparkleColor.r;
          colors[i * 3 + 1] = sparkleColor.g;
          colors[i * 3 + 2] = sparkleColor.b;

          life[i] = 1.0;
          emitted++;
        }
      }
      mesh.geometry.attributes.position.needsUpdate = true;
      mesh.geometry.attributes.color.needsUpdate = true;
    }
  };

  // INITIALIZE THREE.JS SCENE
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = Boolean(motionQuery?.matches);
    const handleMotionChange = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
      setAutoFollow(!e.matches);
    };
    motionQuery?.addEventListener?.('change', handleMotionChange);

    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);

    // 1. Scene with Deep Cosmic Fog & Fallback Background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090b24);
    scene.fog = new THREE.FogExp2(0x0b0e2a, 0.0055);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 300);
    camera.position.copy(DEFAULT_CAMERA_POS);
    camera.lookAt(DEFAULT_CAMERA_TARGET);
    cameraRef.current = camera;

    // 3. High-Quality WebGLRenderer + ACES Filmic Tone Mapping
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3B. Procedural Studio IBL Reflections (makes metallic rims & GLB characters gleam!)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envRT = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envRT.texture;
    scene.environmentIntensity = 0.85;
    pmremGenerator.dispose();

    // 3C. Selective Post-Processing (RenderPass -> UnrealBloomPass -> OutputPass)
    const composer = new EffectComposer(renderer);
    composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    composer.setSize(width, height);
    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.24, // crisp selective Mario Kart 8 neon halo
      0.45,
      0.90 // preserves GLB characters & matte typography
    );
    const outputPass = new OutputPass();
    composer.addPass(renderPass);
    composer.addPass(bloomPass);
    composer.addPass(outputPass);
    composerRef.current = composer;

    // 3D. Interactive OrbitControls with Drag Awareness
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 3.2;
    controls.maxDistance = 42.0;
    controls.maxPolarAngle = Math.PI / 2 - 0.04;
    controls.minPolarAngle = 0.1;
    controls.target.copy(DEFAULT_CAMERA_TARGET);
    controls.update();

    const onControlStart = () => {
      isUserDraggingRef.current = true;
      cameraGoalRef.current.active = false;
      activePresetRef.current = 'custom';
      setActivePreset('custom');
    };
    const onControlEnd = () => {
      isUserDraggingRef.current = false;
    };
    controls.addEventListener('start', onControlStart);
    controls.addEventListener('end', onControlEnd);
    controlsRef.current = controls;

    // 4. Studio Lighting + Chromatic Rim Accents
    const ambientLight = new THREE.AmbientLight(0xfff3e0, 0.95);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x3b1d7a, 0.95);
    scene.add(hemiLight);

    const mainSun = new THREE.DirectionalLight(0xffffff, 2.35);
    mainSun.position.set(10, 26, 14);
    mainSun.castShadow = true;
    mainSun.shadow.mapSize.width = 2048;
    mainSun.shadow.mapSize.height = 2048;
    mainSun.shadow.bias = -0.0003;
    mainSun.shadow.camera.near = 0.5;
    mainSun.shadow.camera.far = 60;
    mainSun.shadow.camera.left = -16;
    mainSun.shadow.camera.right = 16;
    mainSun.shadow.camera.top = 16;
    mainSun.shadow.camera.bottom = -16;
    scene.add(mainSun);

    const frontFill = new THREE.DirectionalLight(0xfff7ed, 1.15);
    frontFill.position.set(0, 14, 18);
    scene.add(frontFill);

    const magentaRim = new THREE.PointLight(0xf43f5e, 4.2, 60);
    magentaRim.position.set(-18, 9, -12);
    scene.add(magentaRim);

    const cyanRim = new THREE.PointLight(0x06b6d4, 4.2, 60);
    cyanRim.position.set(18, 9, 12);
    scene.add(cyanRim);

    const starCenterLight = new THREE.PointLight(0xfbbf24, 4.2, 24);
    starCenterLight.position.set(0, 2.6, 0);
    scene.add(starCenterLight);

    const pipeGreenLight = new THREE.PointLight(0x22c55e, 2.4, 10);
    pipeGreenLight.position.set(-5.6, 1.4, 0.4);
    scene.add(pipeGreenLight);

    const pipeCyanLight = new THREE.PointLight(0x06b6d4, 2.4, 10);
    pipeCyanLight.position.set(5.6, 1.4, -0.4);
    scene.add(pipeCyanLight);

    // 5. SUPER MARIO GALAXY 3D COSMIC BACKGROUND
    const glowSpriteTex = createSoftGlowSpriteTexture();

    // 5A-0. 3D Cosmic Aurora Sky Dome
    const skyDomeGeo = new THREE.SphereGeometry(140, 32, 24);
    const skyDomeTex = createSkyDomeTexture();
    const skyDomeMat = new THREE.MeshBasicMaterial({
      map: skyDomeTex,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });
    scene.add(new THREE.Mesh(skyDomeGeo, skyDomeMat));

    // 5A. 2,500 Soft Radial Glow Stars
    const starCount = 2500;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    const starPalette = [
      new THREE.Color(0xffffff),
      new THREE.Color(0x93c5fd),
      new THREE.Color(0xfde047),
      new THREE.Color(0xf472b6),
      new THREE.Color(0x67e8f9),
    ];

    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const dist = 46 + Math.random() * 38;
      starPositions[i * 3] = dist * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = Math.abs(dist * Math.cos(phi)) + 3;
      starPositions[i * 3 + 2] = dist * Math.sin(phi) * Math.sin(theta);

      const c = starPalette[Math.floor(Math.random() * starPalette.length)];
      starColors[i * 3] = c.r;
      starColors[i * 3 + 1] = c.g;
      starColors[i * 3 + 2] = c.b;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const starMat = new THREE.PointsMaterial({
      size: 0.78,
      map: glowSpriteTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      alphaTest: 0.01,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    scene.add(new THREE.Points(starGeo, starMat));

    // 5B. Primary Ringed Saturn Planet (Left Cosmic Horizon — clear of Start Arch silhouette)
    const planetGroup = new THREE.Group();
    planetGroup.position.set(-21.5, -7.2, -25);
    const planetMesh = new THREE.Mesh(
      new THREE.SphereGeometry(2.2, 32, 32),
      new THREE.MeshStandardMaterial({
        color: 0x4338ca,
        emissive: 0x312e81,
        emissiveIntensity: 0.34,
        roughness: 0.55,
        metalness: 0.15,
      })
    );
    planetGroup.add(planetMesh);
    const ringMesh = new THREE.Mesh(
      new THREE.RingGeometry(2.9, 4.9, 64),
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.45,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75,
      })
    );
    ringMesh.rotation.x = Math.PI / 3.2;
    ringMesh.rotation.y = Math.PI / 6;
    planetGroup.add(ringMesh);
    scene.add(planetGroup);
    planetGroupRef.current = planetGroup;

    // 5B-2. Opposite Pastel Ringed Planet (Right Cosmic Horizon — ring tilted cleanly toward camera)
    const planet2Group = new THREE.Group();
    planet2Group.position.set(20.5, -7.8, -26);
    planet2Group.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(1.7, 28, 28),
        new THREE.MeshStandardMaterial({
          color: 0xdb2777,
          emissive: 0x831843,
          emissiveIntensity: 0.18,
          roughness: 0.65,
          metalness: 0.08,
        })
      )
    );
    const ring2Mesh = new THREE.Mesh(
      new THREE.RingGeometry(2.35, 3.85, 48),
      new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        emissive: 0xd97706,
        emissiveIntensity: 0.32,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.72,
      })
    );
    ring2Mesh.rotation.x = Math.PI / 3.2;
    ring2Mesh.rotation.y = -0.25;
    ring2Mesh.rotation.z = 0.35;
    planet2Group.add(ring2Mesh);
    scene.add(planet2Group);
    planet2GroupRef.current = planet2Group;

    // 5C. Glowing Radial Nebulae Clouds in deep horizon space
    nebulaeMeshesRef.current = [];
    const nebulae = [
      { x: -18, y: -7, z: -28, scale: 26, inner: 'rgba(168, 85, 247, 0.34)', outer: 'rgba(126, 34, 206, 0.10)' },
      { x: 18, y: -7, z: -28, scale: 28, inner: 'rgba(6, 182, 212, 0.32)', outer: 'rgba(2, 132, 199, 0.10)' },
      { x: 0, y: -11, z: -34, scale: 32, inner: 'rgba(244, 63, 94, 0.24)', outer: 'rgba(236, 72, 153, 0.08)' },
      { x: -26, y: -4, z: -22, scale: 24, inner: 'rgba(251, 191, 36, 0.22)', outer: 'rgba(245, 158, 11, 0.06)' },
      { x: 26, y: -4, z: -22, scale: 24, inner: 'rgba(99, 102, 241, 0.28)', outer: 'rgba(79, 70, 229, 0.08)' },
    ];
    nebulae.forEach((neb) => {
      const cloudMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(neb.scale, neb.scale),
        new THREE.MeshBasicMaterial({
          map: createRadialNebulaTexture(neb.inner, neb.outer),
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
        })
      );
      cloudMesh.position.set(neb.x, neb.y, neb.z);
      scene.add(cloudMesh);
      nebulaeMeshesRef.current.push(cloudMesh);
    });

    // 5D. Soft Radial Floating Star Bits Dust
    const starBitsCount = 90;
    const starBitsGeo = new THREE.BufferGeometry();
    const starBitsPos = new Float32Array(starBitsCount * 3);
    for (let i = 0; i < starBitsCount; i++) {
      starBitsPos[i * 3] = (Math.random() - 0.5) * 26;
      starBitsPos[i * 3 + 1] = 0.5 + Math.random() * 4.5;
      starBitsPos[i * 3 + 2] = (Math.random() - 0.5) * 18;
    }
    starBitsGeo.setAttribute('position', new THREE.BufferAttribute(starBitsPos, 3));
    const starBitsMesh = new THREE.Points(
      starBitsGeo,
      new THREE.PointsMaterial({
        size: 0.48,
        map: glowSpriteTex,
        color: 0xfacc15,
        transparent: true,
        opacity: 0.8,
        alphaTest: 0.01,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    scene.add(starBitsMesh);
    starBitsRef.current = starBitsMesh;

    // 5E. Animated Cosmic Shooting Star / Comet
    const cometGeo = new THREE.BufferGeometry();
    cometGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(24 * 3), 3));
    const cometLine = new THREE.Line(
      cometGeo,
      new THREE.LineBasicMaterial({
        color: 0x67e8f9,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
      })
    );
    scene.add(cometLine);
    shootingStarRef.current = {
      line: cometLine,
      active: false,
      progress: 0,
      startX: -30,
      startY: 22,
      startZ: -35,
      dirX: 1.4,
      dirY: -0.6,
      dirZ: 0.8,
      speed: 1.35, // progress per second (frame-rate independent)
    };

    // 6. AUTHENTIC 6-LANE RAINBOW ROAD (SENDA ARCOÍRIS)
    const samples = 480;
    const laneCount = 6;
    const laneWidth = 0.55;
    const halfTotalWidth = (laneCount * laneWidth) / 2;
    const maxAnisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const crystalTex = createCrystalGridTexture(maxAnisotropy);
    crystalTextureRef.current = crystalTex;
    laneMaterialsRef.current = [];

    const rainbowGroup = new THREE.Group();
    rainbowGroup.name = 'rainbow_road';

    // 6A. 6 Vibrant Neon Ribbon Lanes with 512x512 Crystal Texture
    for (let laneIdx = 0; laneIdx < laneCount; laneIdx++) {
      const laneConfig = RAINBOW_LANES[laneIdx];
      const innerOffset = -halfTotalWidth + laneIdx * laneWidth;
      const outerOffset = innerOffset + laneWidth;

      const geo = new THREE.BufferGeometry();
      const verts: number[] = [];
      const norms: number[] = [];
      const uvs: number[] = [];
      const indices: number[] = [];

      for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        const ptIn = getTrackPoint(t, innerOffset);
        const ptOut = getTrackPoint(t, outerOffset);

        verts.push(ptIn.position.x, 0.02, ptIn.position.z);
        verts.push(ptOut.position.x, 0.02, ptOut.position.z);

        norms.push(0, 1, 0, 0, 1, 0);
        uvs.push(0, t * 55, 1, t * 55);

        if (i < samples) {
          const r1 = i * 2;
          const r2 = (i + 1) * 2;
          indices.push(r1, r1 + 1, r2);
          indices.push(r1 + 1, r2 + 1, r2);
        }
      }

      geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(norms, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geo.setIndex(indices);

      const laneMat = new THREE.MeshStandardMaterial({
        color: laneConfig.color,
        emissive: laneConfig.emissive,
        emissiveIntensity: 0.88,
        map: crystalTex,
        roughness: 0.1,
        metalness: 0.25,
        envMapIntensity: 1.15,
        transparent: true,
        opacity: 0.96,
        toneMapped: false,
      });

      const laneMesh = new THREE.Mesh(geo, laneMat);
      laneMesh.receiveShadow = true;
      rainbowGroup.add(laneMesh);
      laneMaterialsRef.current.push(laneMat);
    }

    // 6B. Luminous White Fiber-Optic Lane Dividers (5 lines)
    for (let divIdx = 1; divIdx < laneCount; divIdx++) {
      const offset = -halfTotalWidth + divIdx * laneWidth;
      const lineGeo = new THREE.BufferGeometry();
      const lineVerts: number[] = [];

      for (let i = 0; i <= samples; i++) {
        const pt = getTrackPoint(i / samples, offset);
        lineVerts.push(pt.position.x, 0.03, pt.position.z);
      }
      lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(lineVerts, 3));
      rainbowGroup.add(
        new THREE.Line(
          lineGeo,
          new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.82 })
        )
      );
    }

    // 6C. Metallic Gold Chrome Curbs with Neon Glow Rails
    const rails = [-halfTotalWidth - 0.08, halfTotalWidth + 0.08];
    rails.forEach((railOffset, idx) => {
      const railGeo = new THREE.BufferGeometry();
      const railVerts: number[] = [];
      const railIndices: number[] = [];

      for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        const pt = getTrackPoint(t, railOffset);
        const outerPt = getTrackPoint(t, railOffset + (idx === 0 ? -0.18 : 0.18));

        railVerts.push(pt.position.x, 0.12, pt.position.z);
        railVerts.push(outerPt.position.x, 0.01, outerPt.position.z);

        if (i < samples) {
          const r1 = i * 2;
          const r2 = (i + 1) * 2;
          if (idx === 0) {
            railIndices.push(r1, r2, r1 + 1);
            railIndices.push(r1 + 1, r2, r2 + 1);
          } else {
            railIndices.push(r1, r1 + 1, r2);
            railIndices.push(r1 + 1, r2 + 1, r2);
          }
        }
      }

      railGeo.setAttribute('position', new THREE.Float32BufferAttribute(railVerts, 3));
      railGeo.setIndex(railIndices);
      railGeo.computeVertexNormals();

      const railMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.85,
        roughness: 0.24,
        envMapIntensity: 1.0,
        emissive: idx === 0 ? 0xff0044 : 0xaa00ff,
        emissiveIntensity: 0.28,
        toneMapped: true,
      });
      rainbowGroup.add(new THREE.Mesh(railGeo, railMat));
    });

    // 6D. Underside Cosmic Halo (Floating Underglow)
    const underglowGeo = new THREE.BufferGeometry();
    const ugVerts: number[] = [];
    const ugIndices: number[] = [];
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const ptIn = getTrackPoint(t, -halfTotalWidth - 0.25);
      const ptOut = getTrackPoint(t, halfTotalWidth + 0.25);
      ugVerts.push(ptIn.position.x, -0.05, ptIn.position.z);
      ugVerts.push(ptOut.position.x, -0.05, ptOut.position.z);
      if (i < samples) {
        const r1 = i * 2;
        const r2 = (i + 1) * 2;
        ugIndices.push(r1, r1 + 1, r2);
        ugIndices.push(r1 + 1, r2 + 1, r2);
      }
    }
    underglowGeo.setAttribute('position', new THREE.Float32BufferAttribute(ugVerts, 3));
    underglowGeo.setIndex(ugIndices);
    rainbowGroup.add(
      new THREE.Mesh(
        underglowGeo,
        new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.45,
          blending: THREE.AdditiveBlending,
          side: THREE.BackSide,
        })
      )
    );

    // 6E. 20 Luminous Outer Curb Star Beacons evenly between spaces
    curbBeaconsRef.current = [];
    const beaconPostGeo = new THREE.CylinderGeometry(0.035, 0.045, 0.22, 10);
    const beaconOrbGeo = new THREE.SphereGeometry(0.085, 12, 12);
    const beaconPostMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      metalness: 0.9,
      roughness: 0.2,
    });
    for (let i = 0; i < 20; i++) {
      const t = (i + 0.5) / 20;
      const pt = getTrackPoint(t, -(halfTotalWidth + 0.34));
      const beaconGroup = new THREE.Group();
      beaconGroup.position.set(pt.position.x, 0.02, pt.position.z);

      const post = new THREE.Mesh(beaconPostGeo, beaconPostMat);
      post.position.y = 0.11;
      beaconGroup.add(post);

      const laneCfg = RAINBOW_LANES[i % RAINBOW_LANES.length];
      const orbMat = new THREE.MeshStandardMaterial({
        color: laneCfg.color,
        emissive: laneCfg.emissive,
        emissiveIntensity: 1.05,
        roughness: 0.12,
        toneMapped: false,
      });
      const orb = new THREE.Mesh(beaconOrbGeo, orbMat);
      orb.position.y = 0.25;
      beaconGroup.add(orb);
      curbBeaconsRef.current.push(orb);
      rainbowGroup.add(beaconGroup);
    }

    // 6F. 3D Rainbow Start/Finish Gate Arch at Space 0
    rainbowGroup.add(createStartFinishArch(halfTotalWidth));

    scene.add(rainbowGroup);

    // 7. BOARD SPACES (20 Circular Stepping Discs with Spring Dip + Crisp Decals)
    spaceMaterialsRef.current = [];
    spaceGroupsRef.current = [];
    spaceOffsetYRef.current.fill(0);
    spaceVelYRef.current.fill(0);

    BOARD_SPACES.forEach((space) => {
      const pos = getSpacePosition(space.index, 0.04);
      const spaceGroup = new THREE.Group();
      spaceGroup.position.copy(pos);

      const cylGeo = new THREE.CylinderGeometry(0.66, 0.72, 0.08, 32);
      const cylMat = new THREE.MeshStandardMaterial({
        color: space.colorHex,
        emissive: space.neonHex,
        emissiveIntensity: 0.42,
        roughness: 0.24,
        metalness: 0.32,
        envMapIntensity: 0.95,
        toneMapped: true,
      });
      const cylMesh = new THREE.Mesh(cylGeo, cylMat);
      cylMesh.receiveShadow = true;
      spaceGroup.add(cylMesh);
      spaceMaterialsRef.current.push(cylMat);

      const iconTex = createSpaceIconTexture(space.type, space.colorHex);
      const topPlateMesh = new THREE.Mesh(
        new THREE.CircleGeometry(0.61, 32),
        new THREE.MeshBasicMaterial({ map: iconTex, transparent: true, toneMapped: true })
      );
      topPlateMesh.rotation.x = -Math.PI / 2;
      topPlateMesh.position.y = 0.043;
      spaceGroup.add(topPlateMesh);

      const ringMesh = new THREE.Mesh(
        new THREE.RingGeometry(0.61, 0.70, 32),
        new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, toneMapped: true })
      );
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.y = 0.046;
      spaceGroup.add(ringMesh);

      scene.add(spaceGroup);
      spaceGroupsRef.current.push(spaceGroup);
    });

    // 7B. Shockwave Ring Pool (8 reusable impact rings)
    shockwavesRef.current = [];
    const swGeo = new THREE.RingGeometry(0.45, 0.62, 32);
    for (let i = 0; i < 8; i++) {
      const swMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const swMesh = new THREE.Mesh(swGeo, swMat);
      swMesh.rotation.x = -Math.PI / 2;
      swMesh.visible = false;
      scene.add(swMesh);
      shockwavesRef.current.push({ mesh: swMesh, active: false, life: 0 });
    }

    // 7C. Step & Landing Sparkle Burst Particle Pool (60 particles)
    const burstCount = 60;
    const burstGeo = new THREE.BufferGeometry();
    const burstPos = new Float32Array(burstCount * 3);
    const burstVel = new Float32Array(burstCount * 3);
    const burstLife = new Float32Array(burstCount);
    const burstColors = new Float32Array(burstCount * 3);
    for (let i = 0; i < burstCount; i++) {
      burstPos[i * 3 + 1] = -100;
      burstColors[i * 3] = 1;
      burstColors[i * 3 + 1] = 1;
      burstColors[i * 3 + 2] = 1;
    }
    burstGeo.setAttribute('position', new THREE.BufferAttribute(burstPos, 3));
    burstGeo.setAttribute('color', new THREE.BufferAttribute(burstColors, 3));
    const burstMesh = new THREE.Points(
      burstGeo,
      new THREE.PointsMaterial({
        size: 0.42,
        map: glowSpriteTex,
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        alphaTest: 0.01,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    burstMesh.visible = false;
    scene.add(burstMesh);
    burstPoolRef.current = {
      mesh: burstMesh,
      pos: burstPos,
      vel: burstVel,
      life: burstLife,
      colors: burstColors,
    };

    // 7D. Destination Preview Target Reticle (Shown while moving)
    const destGroup = new THREE.Group();
    const destOuter = new THREE.Mesh(
      new THREE.RingGeometry(0.72, 0.84, 32),
      new THREE.MeshBasicMaterial({
        color: 0xfacc15,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    destOuter.rotation.x = -Math.PI / 2;
    destGroup.add(destOuter);

    const destInner = new THREE.Mesh(
      new THREE.TorusGeometry(0.45, 0.035, 10, 28),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.88,
        blending: THREE.AdditiveBlending,
      })
    );
    destInner.rotation.x = Math.PI / 2;
    destInner.position.y = 0.14;
    destGroup.add(destInner);
    destGroup.visible = false;
    scene.add(destGroup);
    destinationRingRef.current = destGroup;

    // 8. AUTHENTIC 3D SUPER STAR IN CENTER
    const superStar = createMarioSuperStar();
    scene.add(superStar);
    starMeshRef.current = superStar;

    const goldenPoolMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(6.6, 6.6),
      new THREE.MeshBasicMaterial({
        map: createRadialNebulaTexture('rgba(250, 204, 21, 0.46)', 'rgba(234, 88, 12, 0.10)'),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    goldenPoolMesh.rotation.x = -Math.PI / 2;
    goldenPoolMesh.position.y = 0.015;
    scene.add(goldenPoolMesh);

    const floorRingMesh = new THREE.Mesh(
      new THREE.RingGeometry(2.6, 2.82, 64),
      new THREE.MeshBasicMaterial({
        color: 0x93c5fd,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.82,
      })
    );
    floorRingMesh.rotation.x = -Math.PI / 2;
    floorRingMesh.position.y = 0.02;
    scene.add(floorRingMesh);
    orbitalRingRef.current = floorRingMesh;

    // 9. TWO AUTHENTIC WARP PIPES WITH ANIMATED PIRANHA PLANTS
    const pipeConfigs = [
      { x: -5.6, z: 0.4, color: 0x22c55e, rimColor: 0x16a34a },
      { x: 5.6, z: -0.4, color: 0x06b6d4, rimColor: 0x0891b2 },
    ];
    piranhasRef.current = [];
    pipeConfigs.forEach((p) => {
      const pipe = createAuthenticWarpPipe(p.color, p.rimColor);
      pipe.position.set(p.x, 0, p.z);
      scene.add(pipe);
      const piranhaHead = pipe.getObjectByName('piranha_head') as THREE.Group;
      if (piranhaHead) piranhasRef.current.push(piranhaHead);
    });

    // 10. SIX FLOATING GOLDEN '?' BLOCKS (Safely inside track interior; riveted +Y/-Y caps)
    const qSideTex = createQuestionBlockTexture();
    const qCapTex = createQuestionBlockCapTexture();
    const qSideMat = new THREE.MeshStandardMaterial({
      map: qSideTex,
      roughness: 0.24,
      metalness: 0.45,
      envMapIntensity: 1.0,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.18,
    });
    const qCapMat = new THREE.MeshStandardMaterial({
      map: qCapTex,
      roughness: 0.24,
      metalness: 0.45,
      envMapIntensity: 1.0,
      emissive: 0xd97706,
      emissiveIntensity: 0.14,
    });
    const qMaterials = [qSideMat, qSideMat, qCapMat, qCapMat, qSideMat, qSideMat];
    const qBlockGeo = new THREE.BoxGeometry(0.68, 0.68, 0.68);
    const qBlockPositions = [
      { x: -3.8, y: 1.65, z: -2.0 },
      { x: 0, y: 1.85, z: -2.6 },
      { x: 3.8, y: 1.65, z: -2.0 },
      { x: -3.8, y: 1.65, z: 2.0 },
      { x: 0, y: 1.85, z: 2.6 },
      { x: 3.8, y: 1.65, z: 2.0 },
    ];
    questionBlocksRef.current = [];
    qBlockPositions.forEach((pos) => {
      const block = new THREE.Mesh(qBlockGeo, qMaterials);
      block.position.set(pos.x, pos.y, pos.z);
      block.castShadow = true;
      scene.add(block);
      questionBlocksRef.current.push(block);
    });

    // 11. ACTIVE TURN VOLUMETRIC SPOTLIGHT + GROUND RING
    const activeSpotlight = new THREE.Mesh(
      new THREE.RingGeometry(0.40, 0.54, 32),
      new THREE.MeshBasicMaterial({
        color: 0xfacc15,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.92,
      })
    );
    activeSpotlight.rotation.x = -Math.PI / 2;
    activeSpotlight.position.y = 0.055;
    activeSpotlight.visible = false;
    scene.add(activeSpotlight);
    activeSpotlightRef.current = activeSpotlight;

    const beamTex = createLightBeamTexture();
    const activeLightBeam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.52, 2.8, 24, 1, true),
      new THREE.MeshBasicMaterial({
        map: beamTex,
        color: 0xfde047,
        transparent: true,
        opacity: 0.16,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    activeLightBeam.position.y = 1.45;
    activeLightBeam.visible = false;
    scene.add(activeLightBeam);
    activeLightBeamRef.current = activeLightBeam;

    // 12. RUNNING STAR DUST PARTICLES (Soft radial star sprites)
    const dustCount = 45;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    const dustLife = new Float32Array(dustCount);
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3 + 1] = -100;
      dustLife[i] = 0;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMesh = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({
        size: 0.52,
        map: glowSpriteTex,
        color: 0xfde047,
        transparent: true,
        opacity: 0.9,
        alphaTest: 0.01,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    dustMesh.visible = false;
    scene.add(dustMesh);
    dustTrailRef.current = { mesh: dustMesh, pos: dustPos, life: dustLife };

    // Responsive Resize Handler + ResizeObserver for Demo split-screen pane widths
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = Math.max(container.clientWidth, 1);
      const h = Math.max(container.clientHeight, 1);
      setIsWideStage(w >= 1220);
      const dpr = Math.min(window.devicePixelRatio, 2);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h);
      if (composerRef.current) {
        composerRef.current.setPixelRatio(dpr);
        composerRef.current.setSize(w, h);
      }
      bloomPass.resolution.set(w, h);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    let stageObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      stageObserver = new ResizeObserver(handleResize);
      stageObserver.observe(container);
    }

    // ANIMATION LOOP (60 FPS Frame-Rate Independent dt Physics)
    const clock = new THREE.Clock();
    const projVec = new THREE.Vector3();
    const desiredCamPos = new THREE.Vector3();
    const desiredCamTarget = new THREE.Vector3();

    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsedTime = clock.elapsedTime;
      const damp = (lambda: number) => 1 - Math.exp(-lambda * dt);
      const motionMult = reducedMotionRef.current ? 0.0 : 1.0;

      const currentGameState = gameStateRef.current;
      const movement = currentGameState.movement;
      const isMovingPhase = currentGameState.phase === 'moving' && movement != null;
      const activePlayer = currentGameState.players[currentGameState.activePlayerIndex];

      // 1. Super Star & Orbital Rings
      if (starMeshRef.current) {
        starMeshRef.current.position.y = 1.45 + Math.sin(elapsedTime * 2.2) * 0.16 * motionMult;
        starMeshRef.current.rotation.y += dt * 0.85 * motionMult;
        const tiltedRing = starMeshRef.current.getObjectByName('star_tilted_ring');
        if (tiltedRing) {
          tiltedRing.rotation.z += dt * 1.1 * motionMult;
        }
      }

      if (crystalTextureRef.current) {
        crystalTextureRef.current.offset.y -= dt * 0.22 * motionMult;
      }

      laneMaterialsRef.current.forEach((mat, idx) => {
        mat.emissiveIntensity = 0.88 + Math.sin(elapsedTime * 2.4 + idx * 0.75) * 0.17 * motionMult;
      });

      spaceMaterialsRef.current.forEach((mat, idx) => {
        mat.emissiveIntensity = 0.42 + Math.sin(elapsedTime * 2.8 + idx * 0.35) * 0.14 * motionMult;
      });

      // Curb star beacons subtle wave shimmer
      curbBeaconsRef.current.forEach((orb, idx) => {
        const mat = orb.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = 0.78 + Math.sin(elapsedTime * 3.5 + idx * 0.5) * 0.24 * motionMult;
      });

      // Space Tile Spring Dip Physics
      for (let i = 0; i < TRACK_SPECS.totalSpaces; i++) {
        const off = spaceOffsetYRef.current[i];
        let vel = spaceVelYRef.current[i];
        if (Math.abs(off) > 0.0005 || Math.abs(vel) > 0.0005) {
          vel += -180 * off * dt;
          vel *= Math.exp(-12 * dt);
          const nextOff = off + vel * dt;
          spaceOffsetYRef.current[i] = nextOff;
          spaceVelYRef.current[i] = vel;
          if (spaceGroupsRef.current[i]) {
            spaceGroupsRef.current[i].position.y = 0.04 + nextOff;
          }
        }
      }

      // Cosmic Horizon Planets & Nebulae
      if (planetGroupRef.current) {
        planetGroupRef.current.rotation.y += dt * 0.06 * motionMult;
      }
      if (planet2GroupRef.current) {
        planet2GroupRef.current.rotation.y -= dt * 0.08 * motionMult;
      }
      nebulaeMeshesRef.current.forEach((mesh, idx) => {
        const mat = mesh.material as THREE.MeshBasicMaterial;
        if (mat) {
          mat.opacity = 0.38 + Math.sin(elapsedTime * 1.1 + idx * 1.5) * 0.1 * motionMult;
        }
      });

      // Shooting Star Comet (dt-driven)
      if (shootingStarRef.current && !reducedMotionRef.current) {
        const comet = shootingStarRef.current;
        if (!comet.active && Math.random() < dt * 0.45) {
          comet.active = true;
          comet.progress = 0;
          comet.startX = -28 + (Math.random() - 0.5) * 15;
          comet.startY = 18 + Math.random() * 8;
          comet.startZ = -32 + (Math.random() - 0.5) * 10;
        }
        if (comet.active) {
          comet.progress += comet.speed * dt;
          const mat = comet.line.material as THREE.LineBasicMaterial;
          const posAttr = comet.line.geometry.attributes.position;
          const pArr = posAttr.array as Float32Array;
          if (comet.progress < 1.0) {
            mat.opacity = Math.sin(comet.progress * Math.PI) * 0.95;
            const headX = comet.startX + comet.progress * 35 * comet.dirX;
            const headY = comet.startY + comet.progress * 35 * comet.dirY;
            const headZ = comet.startZ + comet.progress * 35 * comet.dirZ;
            for (let i = 0; i < 24; i++) {
              const tailRatio = i / 24;
              pArr[i * 3] = headX - tailRatio * 4.5 * comet.dirX;
              pArr[i * 3 + 1] = headY - tailRatio * 4.5 * comet.dirY;
              pArr[i * 3 + 2] = headZ - tailRatio * 4.5 * comet.dirZ;
            }
            posAttr.needsUpdate = true;
          } else {
            comet.active = false;
            mat.opacity = 0;
          }
        }
      }

      if (orbitalRingRef.current) {
        const s = 1 + Math.sin(elapsedTime * 2.8) * 0.045 * motionMult;
        orbitalRingRef.current.scale.set(s, s, 1);
      }

      questionBlocksRef.current.forEach((block, idx) => {
        block.rotation.y += dt * 1.15 * motionMult;
        block.position.y = (idx === 1 || idx === 4 ? 1.85 : 1.65) + Math.sin(elapsedTime * 2.4 + idx) * 0.12 * motionMult;
      });

      piranhasRef.current.forEach((piranha, idx) => {
        const peek = Math.sin(elapsedTime * 2.0 + idx * Math.PI);
        piranha.position.y = 0.72 + Math.max(0, peek) * 0.52 * motionMult;
        piranha.rotation.y = Math.sin(elapsedTime * 1.5 + idx) * 0.28 * motionMult;
      });

      if (starBitsRef.current) {
        starBitsRef.current.rotation.y += dt * 0.045 * motionMult;
      }

      // Banana Traps Gentle Bobbing & Rotation
      bananaMeshesRef.current.forEach((b, idx) => {
        b.rotation.y += dt * 1.4 * motionMult;
        b.position.y = 0.09 + Math.sin(elapsedTime * 3.0 + idx) * 0.03 * motionMult;
      });

      // Shockwaves Update
      shockwavesRef.current.forEach((sw) => {
        if (!sw.active) return;
        sw.life -= dt * 2.1;
        if (sw.life <= 0) {
          sw.active = false;
          sw.mesh.visible = false;
          return;
        }
        const progress = 1 - sw.life;
        const scale = 1.0 + progress * 1.85;
        sw.mesh.scale.setScalar(scale);
        (sw.mesh.material as THREE.MeshBasicMaterial).opacity = sw.life * 0.85;
      });

      // Sparkle Burst Particle Update
      if (burstPoolRef.current) {
        const { pos, vel, life, mesh } = burstPoolRef.current;
        let anyBurst = false;
        for (let i = 0; i < life.length; i++) {
          if (life[i] > 0) {
            life[i] -= dt * 1.45;
            if (life[i] > 0) {
              vel[i * 3 + 1] -= 5.4 * dt; // gentle gravity
              pos[i * 3] += vel[i * 3] * dt;
              pos[i * 3 + 1] = Math.max(0.05, pos[i * 3 + 1] + vel[i * 3 + 1] * dt);
              pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
              anyBurst = true;
            } else {
              pos[i * 3 + 1] = -100;
            }
          }
        }
        mesh.visible = anyBurst;
        if (anyBurst) mesh.geometry.attributes.position.needsUpdate = true;
      }

      // Destination Target Reticle Update
      if (destinationRingRef.current) {
        if (isMovingPhase && movement) {
          const destIdx = ((movement.fromSpace + movement.totalSteps) % TRACK_SPECS.totalSpaces + TRACK_SPECS.totalSpaces) % TRACK_SPECS.totalSpaces;
          const destPos = getSpacePosition(destIdx, 0.095);
          destinationRingRef.current.position.copy(destPos);
          destinationRingRef.current.rotation.y += dt * 2.2 * motionMult;
          const pulse = 1 + Math.sin(elapsedTime * 6) * 0.07 * motionMult;
          destinationRingRef.current.scale.setScalar(pulse);
          destinationRingRef.current.visible = true;
        } else {
          destinationRingRef.current.visible = false;
        }
      }

      // Dynamic Continuous Spline Pawn Movement & Smooth Idle Physics
      pawnsMapRef.current.forEach((pawn, playerId) => {
        let anim = pawnAnimRef.current.get(playerId);
        if (!anim) {
          anim = {
            pos: pawn.position.clone(),
            yaw: pawn.rotation.y,
            roll: pawn.rotation.z,
            scaleY: 1,
            scaleXZ: 1,
            spawnProgress: 1,
            targetPos: pawn.position.clone(),
            targetYaw: pawn.rotation.y,
            isMovingActive: false,
            moveStartOffset: new THREE.Vector3(),
            moveEndOffset: new THREE.Vector3(),
            lastMovementKey: '',
          };
          pawnAnimRef.current.set(playerId, anim);
        }

        if (anim.spawnProgress < 1) {
          anim.spawnProgress = Math.min(1, anim.spawnProgress + dt * 2.6);
        }
        const spawnScale = anim.spawnProgress < 1 ? easeOutBack(anim.spawnProgress) : 1;

        const isThisPawnMoving = isMovingPhase && movement!.playerId === playerId;
        const isTurnPlayer = activePlayer?.id === playerId && currentGameState.phase !== 'lobby';

        if (isThisPawnMoving && movement) {
          const moveKey = `${movement.playerId}-${movement.startTime}-${movement.fromSpace}-${movement.totalSteps}`;
          if (!anim.isMovingActive || anim.lastMovementKey !== moveKey) {
            anim.isMovingActive = true;
            anim.lastMovementKey = moveKey;
            lastStepSoundTileRef.current = -1;

            const startPt = getTrackPoint(getSpaceTrackParameter(movement.fromSpace), 0);
            anim.moveStartOffset.set(
              anim.pos.x - startPt.position.x,
              0,
              anim.pos.z - startPt.position.z
            );

            const finalSpace =
              ((movement.fromSpace + movement.totalSteps) % TRACK_SPECS.totalSpaces +
                TRACK_SPECS.totalSpaces) %
              TRACK_SPECS.totalSpaces;
            const occupantsOnFinal = currentGameState.players.filter(
              (p) => p.id !== playerId && p.spaceIndex === finalSpace
            );
            anim.moveEndOffset.copy(
              getClusterOffset(occupantsOnFinal.length, occupantsOnFinal.length + 1, finalSpace)
            );
          }

          const startTime = movement.startTime || Date.now();
          const duration = movement.durationMs || movement.totalSteps * 450;
          const elapsed = Date.now() - startTime;
          const tau = Math.min(1.0, Math.max(0.0, elapsed / duration));

          const eased = tau * tau * tau * (tau * (tau * 6 - 15) + 10);
          const continuousK = movement.fromSpace + eased * movement.totalSteps;
          const u = ((continuousK / TRACK_SPECS.totalSpaces) % 1 + 1) % 1;
          const pt = getTrackPoint(u, 0);

          // Blend lateral cluster offset smoothly at takeoff & landing (zero snap!)
          const startWeight = 1 - smoothstep01(0.0, 0.22, tau);
          const endWeight = smoothstep01(0.72, 1.0, tau);
          const offX = anim.moveStartOffset.x * startWeight + anim.moveEndOffset.x * endWeight;
          const offZ = anim.moveStartOffset.z * startWeight + anim.moveEndOffset.z * endWeight;

          const fractionalStep = continuousK % 1;
          const hopY =
            tau < 0.995 && !reducedMotionRef.current
              ? Math.sin(Math.PI * Math.pow(fractionalStep, 0.88)) * 0.56
              : 0;

          anim.pos.set(pt.position.x + offX, 0.10 + hopY, pt.position.z + offZ);
          pawn.position.copy(anim.pos);

          const targetYaw = Math.atan2(pt.tangent.x, pt.tangent.z);
          anim.yaw += shortestAngleDiff(anim.yaw, targetYaw) * damp(14);
          pawn.rotation.y = anim.yaw;

          const bankingRoll =
            !reducedMotionRef.current && Math.abs(pt.tangent.z) > 0.05
              ? pt.tangent.z > 0
                ? 0.12
                : -0.12
              : 0;
          anim.roll += (bankingRoll - anim.roll) * damp(12);
          pawn.rotation.z = anim.roll;

          // Analytic squash & stretch curve (respects prefers-reduced-motion)
          const desiredY = reducedMotionRef.current
            ? 1.0
            : 1.0 +
              Math.sin(fractionalStep * Math.PI) * 0.16 -
              Math.exp(-fractionalStep * 14) * 0.14 -
              Math.exp(-(1 - fractionalStep) * 14) * 0.11;
          const desiredXZ = 1 / Math.sqrt(Math.max(0.75, desiredY));
          anim.scaleY += (desiredY - anim.scaleY) * damp(18);
          anim.scaleXZ += (desiredXZ - anim.scaleXZ) * damp(18);

          const charBody = pawn.getObjectByName('char_body_group');
          if (charBody) {
            const finalSpawnScale = reducedMotionRef.current ? 1 : spawnScale;
            charBody.scale.set(
              0.62 * anim.scaleXZ * finalSpawnScale,
              0.62 * anim.scaleY * finalSpawnScale,
              0.62 * anim.scaleXZ * finalSpawnScale
            );
            charBody.position.y = 0.09;
          }

          // Tile step impact, sound & lap fanfare
          const currentStepFloor = Math.floor(continuousK);
          if (currentStepFloor !== lastStepSoundTileRef.current) {
            lastStepSoundTileRef.current = currentStepFloor;
            sounds.playJump();
            const tileIdx = ((currentStepFloor % 20) + 20) % 20;
            const spaceInfo = BOARD_SPACES[tileIdx];
            triggerTileImpact(tileIdx, spaceInfo?.neonHex || '#facc15', false);

            if (currentStepFloor > movement.fromSpace && currentStepFloor % 20 === 0) {
              sounds.playStarFanfare();
            }
          }

          if (tau >= 0.985 && landingTriggeredKeyRef.current !== moveKey) {
            landingTriggeredKeyRef.current = moveKey;
            const finalIdx =
              ((movement.fromSpace + movement.totalSteps) % 20 + 20) % 20;
            const finalSpace = BOARD_SPACES[finalIdx];
            triggerTileImpact(finalIdx, finalSpace?.neonHex || '#fde047', true);
          }

          // Emit soft star dust particles behind runner (dt-scaled; disabled under reduced motion)
          if (!reducedMotionRef.current && dustTrailRef.current && Math.random() < Math.min(1, dt * 42)) {
            const { pos, life, mesh } = dustTrailRef.current;
            for (let i = 0; i < 45; i++) {
              if (life[i] <= 0) {
                pos[i * 3] = anim.pos.x + (Math.random() - 0.5) * 0.24;
                pos[i * 3 + 1] = 0.12 + Math.random() * 0.18;
                pos[i * 3 + 2] = anim.pos.z + (Math.random() - 0.5) * 0.24;
                life[i] = 1.0;
                break;
              }
            }
            mesh.geometry.attributes.position.needsUpdate = true;
          }
        } else {
          anim.isMovingActive = false;

          // Smoothly glide idle pawns to target cluster position & facing yaw
          anim.pos.lerp(anim.targetPos, damp(10));
          pawn.position.copy(anim.pos);

          anim.yaw += shortestAngleDiff(anim.yaw, anim.targetYaw) * damp(10);
          pawn.rotation.y = anim.yaw;

          anim.roll += (0 - anim.roll) * damp(10);
          pawn.rotation.z = anim.roll;

          anim.scaleY += (1 - anim.scaleY) * damp(14);
          anim.scaleXZ += (1 - anim.scaleXZ) * damp(14);

          const charBody = pawn.getObjectByName('char_body_group');
          if (charBody) {
            charBody.scale.set(
              0.62 * anim.scaleXZ * spawnScale,
              0.62 * anim.scaleY * spawnScale,
              0.62 * anim.scaleXZ * spawnScale
            );
            const bobAmp = (isTurnPlayer ? 0.042 : 0.022) * motionMult;
            const bobFreq = isTurnPlayer ? 4.4 : 2.8;
            charBody.position.y = 0.09 + Math.sin(elapsedTime * bobFreq + playerId.charCodeAt(0)) * bobAmp;
          }
        }

        const halo = pawn.getObjectByName('leader_halo');
        if (halo) {
          halo.rotation.z += dt * 2.1 * motionMult;
        }
      });

      // Dust trail decay (dt-scaled)
      if (dustTrailRef.current) {
        const { pos, life, mesh } = dustTrailRef.current;
        let anyAlive = false;
        for (let i = 0; i < 45; i++) {
          if (life[i] > 0) {
            life[i] -= dt * 2.4;
            if (life[i] > 0) {
              pos[i * 3 + 1] += dt * 0.85;
              anyAlive = true;
            } else {
              pos[i * 3 + 1] = -100;
            }
          }
        }
        mesh.visible = anyAlive;
        if (anyAlive) {
          mesh.geometry.attributes.position.needsUpdate = true;
        }
      }

      // Active Player Spotlight Ring & Volumetric Beam smooth tracking
      if (activePlayer && activeSpotlightRef.current && activeLightBeamRef.current) {
        const activePawn = pawnsMapRef.current.get(activePlayer.id);
        if (activePawn) {
          const targetX = activePawn.position.x;
          const targetZ = activePawn.position.z;
          const spotFollow = damp(14);
          activeSpotlightRef.current.position.x += (targetX - activeSpotlightRef.current.position.x) * spotFollow;
          activeSpotlightRef.current.position.z += (targetZ - activeSpotlightRef.current.position.z) * spotFollow;
          activeSpotlightRef.current.position.y = 0.095;
          const pulse = 1 + Math.sin(elapsedTime * 5) * 0.1 * motionMult;
          activeSpotlightRef.current.scale.set(pulse, pulse, 1);
          activeSpotlightRef.current.visible = true;

          activeLightBeamRef.current.position.x = activeSpotlightRef.current.position.x;
          activeLightBeamRef.current.position.z = activeSpotlightRef.current.position.z;
          activeLightBeamRef.current.position.y = 1.48;
          const beamMat = activeLightBeamRef.current.material as THREE.MeshBasicMaterial;
          beamMat.opacity = 0.14 + Math.sin(elapsedTime * 3.5) * 0.04 * motionMult;
          activeLightBeamRef.current.visible = true;
        }
      } else {
        if (activeSpotlightRef.current) activeSpotlightRef.current.visible = false;
        if (activeLightBeamRef.current) activeLightBeamRef.current.visible = false;
      }

      // Smooth Damped Camera Presets + Auto-Follow (Never fights user drag; immediate under reduced-motion)
      if (controlsRef.current && !isUserDraggingRef.current) {
        const moveAlpha = reducedMotionRef.current ? 1.0 : damp(5.5);

        if (isMovingPhase && movement && autoFollowRef.current && activePresetRef.current !== 'top') {
          const movingPawn = pawnsMapRef.current.get(movement.playerId);
          if (movingPawn) {
            wasMovingRef.current = true;
            cameraGoalRef.current.active = false;
            desiredCamPos.set(
              movingPawn.position.x * 0.65,
              9.8,
              movingPawn.position.z * 0.65 + 9.4
            );
            desiredCamTarget.set(
              movingPawn.position.x * 0.85,
              0.5,
              movingPawn.position.z * 0.85
            );
            camera.position.lerp(desiredCamPos, damp(4.6));
            controlsRef.current.target.lerp(desiredCamTarget, damp(5.2));
          }
        } else {
          if (
            wasMovingRef.current &&
            currentGameState.phase === 'turn_start' &&
            autoFollowRef.current &&
            activePresetRef.current === 'default'
          ) {
            wasMovingRef.current = false;
            cameraGoalRef.current = {
              pos: DEFAULT_CAMERA_POS.clone(),
              target: DEFAULT_CAMERA_TARGET.clone(),
              active: true,
            };
          } else if (!isMovingPhase && currentGameState.phase === 'turn_start') {
            wasMovingRef.current = false;
          }

          if (cameraGoalRef.current.active) {
            camera.position.lerp(cameraGoalRef.current.pos, moveAlpha);
            controlsRef.current.target.lerp(cameraGoalRef.current.target, moveAlpha);
            if (
              camera.position.distanceTo(cameraGoalRef.current.pos) < 0.03 &&
              controlsRef.current.target.distanceTo(cameraGoalRef.current.target) < 0.03
            ) {
              cameraGoalRef.current.active = false;
            }
          }
        }
      }

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      // Render via Selective Bloom EffectComposer
      if (composerRef.current) {
        composerRef.current.render();
      } else {
        renderer.render(scene, camera);
      }

      // Zero-Stutter Direct-DOM Projection of Overhead Player Badges (0 React re-renders + anti-overlap stacking)
      const curW = container.clientWidth;
      const curH = container.clientHeight;
      const projectedLabels: Array<{
        playerId: string;
        el: HTMLDivElement;
        x: number;
        y: number;
        isActive: boolean;
      }> = [];

      pawnsMapRef.current.forEach((pawn, playerId) => {
        const el = labelElsRef.current.get(playerId);
        if (!el) return;

        pawn.getWorldPosition(projVec);
        projVec.y += 1.32;
        projVec.project(camera);

        if (projVec.z < 1) {
          const x = (projVec.x * 0.5 + 0.5) * curW;
          const y = (-projVec.y * 0.5 + 0.5) * curH;
          projectedLabels.push({
            playerId,
            el,
            x,
            y,
            isActive: activePlayer?.id === playerId,
          });
        } else {
          el.style.opacity = '0';
        }
      });

      // Keep active player anchored front; resolve vertical/horizontal collision + clamp strictly inside stage bounds
      const minX = 64;
      const maxX = Math.max(minX + 10, curW - 64);
      const maxY = Math.max(80, curH - 84);
      projectedLabels.sort((a, b) => (a.isActive === b.isActive ? a.y - b.y : a.isActive ? -1 : 1));

      for (let i = 0; i < projectedLabels.length; i++) {
        const cur = projectedLabels[i];
        const minY = cur.isActive ? 54 : 38;
        cur.x = Math.min(maxX, Math.max(minX, cur.x));
        cur.y = Math.min(maxY, Math.max(minY, cur.y));

        for (let pass = 0; pass < 3; pass++) {
          let adjusted = false;
          for (let j = 0; j < i; j++) {
            const prev = projectedLabels[j];
            if (Math.abs(cur.x - prev.x) < 102 && Math.abs(cur.y - prev.y) < 30) {
              const candidateY = prev.y - 30;
              if (candidateY >= minY) {
                cur.y = candidateY;
              } else {
                const fanStep = Math.ceil((i + 1) / 2) * 106;
                const side = i % 2 === 1 ? 1 : -1;
                const fannedX = Math.min(maxX, Math.max(minX, prev.x + side * fanStep));
                if (Math.abs(fannedX - prev.x) >= 96) {
                  cur.x = fannedX;
                } else {
                  cur.y = Math.min(maxY, prev.y + 30);
                }
              }
              adjusted = true;
            }
          }
          if (!adjusted) break;
        }
        cur.x = Math.min(maxX, Math.max(minX, cur.x));
        cur.y = Math.min(maxY, Math.max(minY, cur.y));
      }

      for (const lbl of projectedLabels) {
        lbl.el.style.transform = `translate3d(${lbl.x.toFixed(1)}px, ${lbl.y.toFixed(1)}px, 0) translate(-50%, -100%)`;
        lbl.el.style.opacity = lbl.isActive ? '1' : '0.92';
      }
    };

    animate();

    return () => {
      motionQuery?.removeEventListener?.('change', handleMotionChange);
      stageObserver?.disconnect();
      window.removeEventListener('resize', handleResize);
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      controls.removeEventListener('start', onControlStart);
      controls.removeEventListener('end', onControlEnd);
      controls.dispose();
      envRT.dispose();
      if (composerRef.current) {
        composerRef.current.dispose();
      }
      renderer.dispose();
      container.innerHTML = '';
      pawnsMapRef.current.forEach((pawn) => scene.remove(pawn));
      pawnsMapRef.current.clear();
      pawnAnimRef.current.clear();
      if (dustTrailRef.current) {
        dustTrailRef.current.mesh.geometry.dispose();
        (dustTrailRef.current.mesh.material as THREE.Material).dispose();
      }
      if (burstPoolRef.current) {
        burstPoolRef.current.mesh.geometry.dispose();
        (burstPoolRef.current.mesh.material as THREE.Material).dispose();
      }
    };
  }, []);

  // SYNC 3D PAWNS WITH GAME STATE & TILE OFFSETTING
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const existingPlayerIds = new Set(gameState.players.map((p) => p.id));

    pawnsMapRef.current.forEach((pawn, playerId) => {
      if (!existingPlayerIds.has(playerId)) {
        scene.remove(pawn);
        pawnsMapRef.current.delete(playerId);
        pawnAnimRef.current.delete(playerId);
      }
    });

    const spaceOccupancy: Record<number, Player[]> = {};
    gameState.players.forEach((p) => {
      if (!spaceOccupancy[p.spaceIndex]) spaceOccupancy[p.spaceIndex] = [];
      spaceOccupancy[p.spaceIndex].push(p);
    });

    gameState.players.forEach((player) => {
      let pawn = pawnsMapRef.current.get(player.id);
      const charInfo = CHARACTERS[player.characterId];
      const cluster = spaceOccupancy[player.spaceIndex] || [player];
      const playerIndexInCluster = Math.max(0, cluster.findIndex((p) => p.id === player.id));
      const targetPos = getPlayerPositionOnSpace(player.spaceIndex, playerIndexInCluster, cluster.length);
      const pt = getTrackPoint(getSpaceTrackParameter(player.spaceIndex), 0);
      // Angle standing characters slightly 3/4 toward the camera so faces read clearly on Space 0
      const targetYaw = Math.atan2(pt.tangent.x * 0.68, pt.tangent.z * 0.68 + 0.74);

      let isFreshSpawn = false;
      if (!pawn || pawn.parent !== scene) {
        if (!pawn) {
          pawn = createCharacterPawn(player.characterId, charInfo.neonColor);
          pawn.position.copy(targetPos);
          pawn.rotation.y = targetYaw;
          pawnsMapRef.current.set(player.id, pawn);
          isFreshSpawn = true;
        }
        scene.add(pawn);
      }

      let anim = pawnAnimRef.current.get(player.id);
      if (!anim) {
        anim = {
          pos: targetPos.clone(),
          yaw: targetYaw,
          roll: 0,
          scaleY: 1,
          scaleXZ: 1,
          spawnProgress: isFreshSpawn ? 0.05 : 1,
          targetPos: targetPos.clone(),
          targetYaw,
          isMovingActive: false,
          moveStartOffset: new THREE.Vector3(),
          moveEndOffset: new THREE.Vector3(),
          lastMovementKey: '',
        };
        pawnAnimRef.current.set(player.id, anim);
        if (isFreshSpawn) {
          triggerTileImpact(player.spaceIndex, charInfo.neonColor, true);
        }
      } else {
        anim.targetPos.copy(targetPos);
        anim.targetYaw = targetYaw;
      }

      // Shield Aura
      let shieldMesh = pawn.getObjectByName('shield_aura') as THREE.Mesh;
      if (player.shieldActive && !shieldMesh) {
        const auraGeo = new THREE.SphereGeometry(0.55, 16, 16);
        const auraMat = new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          wireframe: true,
          transparent: true,
          opacity: 0.65,
        });
        shieldMesh = new THREE.Mesh(auraGeo, auraMat);
        shieldMesh.name = 'shield_aura';
        shieldMesh.position.y = 0.55;
        pawn.add(shieldMesh);
      } else if (!player.shieldActive && shieldMesh) {
        pawn.remove(shieldMesh);
      }

      // Leader Golden Halo
      let leaderHalo = pawn.getObjectByName('leader_halo') as THREE.Mesh;
      const isLeader = player.id === gameState.starLeaderId && player.stars > 0;
      if (isLeader && !leaderHalo) {
        const torusGeo = new THREE.TorusGeometry(0.24, 0.035, 12, 24);
        const torusMat = new THREE.MeshStandardMaterial({
          color: 0xffd700,
          emissive: 0xffaa00,
          emissiveIntensity: 0.9,
          metalness: 0.85,
          roughness: 0.18,
        });
        leaderHalo = new THREE.Mesh(torusGeo, torusMat);
        leaderHalo.name = 'leader_halo';
        leaderHalo.position.y = 1.30;
        leaderHalo.rotation.x = Math.PI / 2;
        pawn.add(leaderHalo);
      } else if (!isLeader && leaderHalo) {
        pawn.remove(leaderHalo);
      }
    });
  }, [gameState.players, gameState.activePlayerIndex, gameState.phase, gameState.movement, gameState.starLeaderId]);

  // SYNC 3D BANANA TRAPS (Curvy 3-petal Mario Kart Banana Peel)
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    bananaMeshesRef.current.forEach((mesh) => scene.remove(mesh));
    bananaMeshesRef.current = [];

    gameState.traps.forEach((trap) => {
      const pos = getSpacePosition(trap.spaceIndex, 0.09);
      const bananaGroup = createBananaPeelTrap();
      bananaGroup.position.copy(pos);
      scene.add(bananaGroup);
      bananaMeshesRef.current.push(bananaGroup);
    });
  }, [gameState.traps]);

  const activePlayer = gameState.players[gameState.activePlayerIndex];

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-slate-950">
      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Direct-DOM Projected Floating Overhead Character Badges (Zero 60fps React Thrash) */}
      {gameState.players.map((player) => {
        const isActive = player.id === activePlayer?.id && gameState.phase !== 'lobby';
        const isLeader = gameState.starLeaderId === player.id && player.stars > 0;

        return (
          <div
            key={player.id}
            ref={(el) => {
              if (el) labelElsRef.current.set(player.id, el);
              else labelElsRef.current.delete(player.id);
            }}
            className={`absolute top-0 left-0 pointer-events-none transition-opacity duration-150 will-change-transform ${
              isActive ? 'z-20' : 'z-10'
            }`}
            style={{ opacity: 0 }}
          >
            {isActive && (
              <div className="flex justify-center -mb-1 animate-bounce motion-reduce:animate-none">
                <span className="text-yellow-300 text-sm filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
                  ▼
                </span>
              </div>
            )}

            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black shadow-2xl backdrop-blur-md transition-all ${
                isActive
                  ? 'bg-slate-900/95 ring-2 ring-yellow-400 text-yellow-200 shadow-yellow-500/35 scale-105'
                  : 'bg-slate-900/85 text-white border border-white/20'
              }`}
            >
              {isLeader && <span aria-hidden="true">👑</span>}
              <span className="truncate max-w-[96px]">{player.name}</span>
              <span className="text-yellow-300 flex items-center font-bold">
                ★ {player.stars}
              </span>
            </div>
          </div>
        );
      })}

      {/* Floating 3D Camera Controls HUD (Bottom-Right, >= 8px button gaps & stage-width responsive) */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col items-end gap-1.5 pointer-events-auto">
        <div
          role="toolbar"
          aria-label="Controles de cámara 3D"
          className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-white/15 shadow-2xl"
        >
          <button
            type="button"
            onClick={() => setAutoFollow((prev) => !prev)}
            aria-pressed={autoFollow}
            aria-label={autoFollow ? 'Desactivar seguimiento automático' : 'Activar seguimiento automático'}
            title={autoFollow ? 'Auto-seguimiento activo al moverse' : 'Auto-seguimiento pausado'}
            className={`min-h-[44px] min-w-[44px] px-2.5 py-2 rounded-xl font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
              autoFollow
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/55 shadow-sm'
                : 'bg-slate-800/90 text-slate-200 hover:text-white border border-white/10'
            }`}
          >
            {autoFollow ? (
              <Video className="w-4 h-4 shrink-0" aria-hidden="true" />
            ) : (
              <VideoOff className="w-4 h-4 shrink-0" aria-hidden="true" />
            )}
            {isWideStage && <span>Auto</span>}
          </button>

          <button
            type="button"
            onClick={resetCamera}
            aria-pressed={activePreset === 'default'}
            aria-label="Restablecer cámara a vista general"
            title="Restablecer vista general del tablero"
            className={`min-h-[44px] min-w-[44px] px-2.5 py-2 rounded-xl font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300 ${
              activePreset === 'default'
                ? 'bg-amber-400/20 text-yellow-200 border border-yellow-400/70 shadow-sm'
                : 'bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 hover:text-white border border-white/10'
            }`}
          >
            <RotateCcw className="w-4 h-4 shrink-0" aria-hidden="true" />
            {isWideStage && <span>Tablero</span>}
          </button>

          <button
            type="button"
            onClick={focusActivePlayer}
            aria-pressed={activePreset === 'character'}
            aria-label="Enfocar cámara en el jugador en turno"
            title="Enfocar en primer plano al jugador en turno"
            className={`min-h-[44px] min-w-[44px] px-2.5 py-2 rounded-xl font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300 ${
              activePreset === 'character'
                ? 'bg-amber-400/20 text-yellow-200 border border-yellow-400/70 shadow-sm'
                : 'bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 hover:text-white border border-white/10'
            }`}
          >
            <Crosshair className="w-4 h-4 shrink-0" aria-hidden="true" />
            {isWideStage && <span>Foco</span>}
          </button>

          <button
            type="button"
            onClick={topDownView}
            aria-pressed={activePreset === 'top'}
            aria-label="Vista cenital aérea del circuito"
            title="Ver circuito completo desde arriba"
            className={`min-h-[44px] min-w-[44px] px-2.5 py-2 rounded-xl font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300 ${
              activePreset === 'top'
                ? 'bg-amber-400/20 text-yellow-200 border border-yellow-400/70 shadow-sm'
                : 'bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 hover:text-white border border-white/10'
            }`}
          >
            <Eye className="w-4 h-4 shrink-0" aria-hidden="true" />
            {isWideStage && <span>Cenital</span>}
          </button>
        </div>
      </div>
    </div>
  );
};
