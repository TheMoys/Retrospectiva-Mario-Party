import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GameState, Player } from '@/types/game';
import { BOARD_SPACES } from '@/constants/boardSpaces';
import { CHARACTERS } from '@/constants/characters';
import {
  getTrackPoint,
  getSpacePosition,
  getPlayerPositionOnSpace,
  getHopPosition,
  TRACK_SPECS,
} from './trackMath';
import { createCharacterPawn } from './pawnGeometries';

interface GameBoard3DProps {
  gameState: GameState;
  onSpaceClick?: (spaceIndex: number) => void;
}

// 6 Authentic Mario Kart Rainbow Road Neon Lanes
const RAINBOW_LANES = [
  { id: 'red', color: 0xff0044, emissive: 0xff0033, name: 'Mario Red' },
  { id: 'orange', color: 0xff6600, emissive: 0xff5500, name: 'Bowser Orange' },
  { id: 'yellow', color: 0xffea00, emissive: 0xffcc00, name: 'Toad Yellow' },
  { id: 'green', color: 0x00ff66, emissive: 0x00dd44, name: 'Luigi Green' },
  { id: 'cyan', color: 0x00d4ff, emissive: 0x00aaff, name: 'Yoshi Cyan' },
  { id: 'purple', color: 0xaa00ff, emissive: 0x8800ff, name: 'Peach Violet' },
];

export const GameBoard3D: React.FC<GameBoard3DProps> = ({ gameState }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [screenLabels, setScreenLabels] = useState<Array<{
    id: string;
    name: string;
    characterId: any;
    stars: number;
    x: number;
    y: number;
    isActive: boolean;
    isLeader: boolean;
    color: string;
  }>>([]);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameId = useRef<number | null>(null);

  // 3D Objects References
  const starMeshRef = useRef<THREE.Group | null>(null);
  const orbitalRingRef = useRef<THREE.Mesh | null>(null);
  const pawnsMapRef = useRef<Map<string, THREE.Group>>(new Map());
  const activeSpotlightRef = useRef<THREE.Mesh | null>(null);
  const activeLightBeamRef = useRef<THREE.Mesh | null>(null);
  const bananaMeshesRef = useRef<THREE.Group[]>([]);
  const questionBlocksRef = useRef<THREE.Mesh[]>([]);
  const piranhasRef = useRef<THREE.Group[]>([]);
  const starBitsRef = useRef<THREE.Points | null>(null);
  const lastLabelsHashRef = useRef<string>('');

  // Helper: Create Mario Kart 8 Crystal Grid Texture for Rainbow Road
  const createCrystalGridTexture = (): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 4;
    ctx.strokeRect(3, 3, 250, 250);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(14, 14, 228, 228);

    // Diagonal crystal reflection sheen
    const grad = ctx.createLinearGradient(0, 0, 256, 256);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
    grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.08)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0.35)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 40);
    return texture;
  };

  // Helper: Create Authentic Mario Super Star with Iconic Oval Black Eyes
  const createMarioSuperStar = (): THREE.Group => {
    const starGroup = new THREE.Group();
    starGroup.name = 'mario_super_star';

    // 5-pointed Star Shape with bevel (Upright orientation)
    const starShape = new THREE.Shape();
    const points = 5;
    const outerRadius = 1.35;
    const innerRadius = 0.62;

    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / points + Math.PI / 2; // +PI/2 points the star straight UP
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
      emissiveIntensity: 0.85,
      metalness: 0.85,
      roughness: 0.15,
      toneMapped: false,
    });
    const starMesh = new THREE.Mesh(starGeo, starMat);
    starMesh.castShadow = true;
    starGroup.add(starMesh);

    // Front & Back Iconic Black Oval Eyes with White Sparkle Pupils (Centered in Upper Face)
    const createEyesGroup = (zPos: number) => {
      const eyesGroup = new THREE.Group();
      const eyeGeo = new THREE.CapsuleGeometry(0.065, 0.22, 12, 16);
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0a });

      const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
      leftEye.position.set(-0.25, 0.05, zPos);

      const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
      rightEye.position.set(0.25, 0.05, zPos);

      // White glint dots
      const glintGeo = new THREE.SphereGeometry(0.035, 8, 8);
      const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

      const leftGlint = new THREE.Mesh(glintGeo, glintMat);
      leftGlint.position.set(-0.23, 0.12, zPos + 0.04);

      const rightGlint = new THREE.Mesh(glintGeo, glintMat);
      rightGlint.position.set(0.27, 0.12, zPos + 0.04);

      eyesGroup.add(leftEye, rightEye, leftGlint, rightGlint);
      return eyesGroup;
    };

    starGroup.add(createEyesGroup(0.34));
    starGroup.add(createEyesGroup(-0.34));

    // Golden Orbiting Torus Ring
    const torusGeo = new THREE.TorusGeometry(2.2, 0.04, 16, 64);
    const torusMat = new THREE.MeshBasicMaterial({
      color: 0xfde047,
      transparent: true,
      opacity: 0.85,
    });
    const torusMesh = new THREE.Mesh(torusGeo, torusMat);
    torusMesh.rotation.x = Math.PI / 2;
    starGroup.add(torusMesh);

    starGroup.position.set(0, 1.35, 0);
    return starGroup;
  };

  // Helper: Create Space Icon Decal Texture for Board Tiles
  const createSpaceIconTexture = (type: string, colorHex: string, neonHex: string): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = colorHex;
    ctx.beginPath();
    ctx.arc(64, 64, 58, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 54px "Fredoka", "Arial Black", sans-serif';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 6;

    let symbol = '★';
    if (type === 'start') symbol = '★';
    else if (type === 'green') symbol = '★';
    else if (type === 'yellow') symbol = '⚡';
    else if (type === 'red') symbol = '✕';
    else symbol = '?';

    ctx.strokeText(symbol, 64, 66);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(symbol, 64, 66);

    return new THREE.CanvasTexture(canvas);
  };

  // Helper: Create Question Mark block texture
  const createQuestionBlockTexture = (): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(0, 0, 128, 128);

    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, 120, 120);

    // Bolts
    ctx.fillStyle = '#78350F';
    const bolt = (x: number, y: number) => {
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
    };
    bolt(16, 16); bolt(112, 16); bolt(16, 112); bolt(112, 112);

    // Big '?'
    ctx.font = 'bold 80px "Fredoka", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 12;
    ctx.strokeText('?', 64, 68);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('?', 64, 68);

    return new THREE.CanvasTexture(canvas);
  };

  // Helper: Create Authentic Warp Pipe with beveled lip & dark cavity
  const createAuthenticWarpPipe = (colorHex: number, rimHex: number): THREE.Group => {
    const pipeGroup = new THREE.Group();

    // Body
    const bodyGeo = new THREE.CylinderGeometry(0.72, 0.72, 1.2, 32);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.18,
      metalness: 0.35,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.6;
    body.castShadow = true;
    body.receiveShadow = true;
    pipeGroup.add(body);

    // Beveled Collar Lip
    const lipGeo = new THREE.CylinderGeometry(0.84, 0.84, 0.38, 32);
    const lipMat = new THREE.MeshStandardMaterial({
      color: rimHex,
      roughness: 0.15,
      metalness: 0.4,
    });
    const lip = new THREE.Mesh(lipGeo, lipMat);
    lip.position.y = 1.3;
    lip.castShadow = true;
    pipeGroup.add(lip);

    // Dark cavity interior
    const holeGeo = new THREE.CircleGeometry(0.68, 32);
    const holeMat = new THREE.MeshBasicMaterial({ color: 0x051308 });
    const hole = new THREE.Mesh(holeGeo, holeMat);
    hole.rotation.x = -Math.PI / 2;
    hole.position.y = 1.495;
    pipeGroup.add(hole);

    // Realistic Piranha Plant
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
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headGroup.add(headMesh);

    // White lips
    const lipTorusGeo = new THREE.TorusGeometry(0.32, 0.08, 12, 24, Math.PI);
    const lipWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const upperLip = new THREE.Mesh(lipTorusGeo, lipWhiteMat);
    upperLip.position.set(0, 0.1, 0.22);
    upperLip.rotation.x = 0.3;
    headGroup.add(upperLip);

    // Teeth
    const toothGeo = new THREE.ConeGeometry(0.04, 0.1, 6);
    for (let i = -2; i <= 2; i++) {
      const tooth = new THREE.Mesh(toothGeo, lipWhiteMat);
      tooth.position.set(i * 0.09, 0.06, 0.28);
      tooth.rotation.x = Math.PI;
      headGroup.add(tooth);
    }

    // White polka dots
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
  };

  // INITIALIZE THREE.JS SCENE
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene with Deep Cosmic Atmosphere
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060714);
    sceneRef.current = scene;

    // 2. Camera (panoramic perspective FOV 38)
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
    camera.position.set(0, 15.5, 13.8);
    camera.lookAt(0, 0, -0.2);
    cameraRef.current = camera;

    // 3. High Quality Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0x38bdf8, 0.85);
    scene.add(ambientLight);

    const mainSun = new THREE.DirectionalLight(0xffffff, 2.2);
    mainSun.position.set(5, 18, 10);
    mainSun.castShadow = true;
    mainSun.shadow.mapSize.width = 2048;
    mainSun.shadow.mapSize.height = 2048;
    mainSun.shadow.bias = -0.0005;
    scene.add(mainSun);

    const magentaRim = new THREE.PointLight(0xd946ef, 3.5, 35);
    magentaRim.position.set(-10, 6, -8);
    scene.add(magentaRim);

    const cyanRim = new THREE.PointLight(0x06b6d4, 3.5, 35);
    cyanRim.position.set(10, 6, 8);
    scene.add(cyanRim);

    // 5. SUPER MARIO GALAXY COSMIC BACKGROUND
    // 5A. 2,500 Chromatic Stars
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
      const dist = 45 + Math.random() * 35;
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
      size: 0.42,
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
    });
    scene.add(new THREE.Points(starGeo, starMat));

    // 5B. 3D Ringed Planet (Saturn) in the Cosmic Horizon
    const planetGroup = new THREE.Group();
    planetGroup.position.set(-22, 11, -30);

    const planetGeo = new THREE.SphereGeometry(4.0, 32, 32);
    const planetMat = new THREE.MeshStandardMaterial({
      color: 0x4338ca,
      emissive: 0x312e81,
      emissiveIntensity: 0.35,
      roughness: 0.5,
    });
    planetGroup.add(new THREE.Mesh(planetGeo, planetMat));

    const ringGeo = new THREE.RingGeometry(5.2, 9.2, 64);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.5,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 3;
    ringMesh.rotation.y = Math.PI / 6;
    planetGroup.add(ringMesh);
    scene.add(planetGroup);

    // 5C. Glowing Nebulae Dust Clouds (Positioned high in cosmic backdrop)
    const nebulae = [
      { x: -18, y: 12, z: -35, color: 0x7e22ce, scale: 28 },
      { x: 20, y: 15, z: -35, color: 0x0284c7, scale: 32 },
      { x: 0, y: 18, z: -40, color: 0xec4899, scale: 30 },
    ];
    nebulae.forEach((neb) => {
      const cloudGeo = new THREE.PlaneGeometry(neb.scale, neb.scale);
      const cloudMat = new THREE.MeshBasicMaterial({
        color: neb.color,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
      cloudMesh.position.set(neb.x, neb.y, neb.z);
      scene.add(cloudMesh);
    });

    // 5D. Floating Star Bits Particle Dust
    const starBitsCount = 80;
    const starBitsGeo = new THREE.BufferGeometry();
    const starBitsPos = new Float32Array(starBitsCount * 3);
    for (let i = 0; i < starBitsCount; i++) {
      starBitsPos[i * 3] = (Math.random() - 0.5) * 24;
      starBitsPos[i * 3 + 1] = 0.5 + Math.random() * 4;
      starBitsPos[i * 3 + 2] = (Math.random() - 0.5) * 16;
    }
    starBitsGeo.setAttribute('position', new THREE.BufferAttribute(starBitsPos, 3));
    const starBitsMat = new THREE.PointsMaterial({
      size: 0.28,
      color: 0xfacc15,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const starBitsMesh = new THREE.Points(starBitsGeo, starBitsMat);
    scene.add(starBitsMesh);
    starBitsRef.current = starBitsMesh;

    // 6. BUILD AUTHENTIC 6-LANE RAINBOW ROAD (SENDA ARCOÍRIS)
    const samples = 360;
    const laneCount = 6;
    const laneWidth = 0.38; // Total width = 2.28
    const halfTotalWidth = (laneCount * laneWidth) / 2;
    const crystalTex = createCrystalGridTexture();

    const rainbowGroup = new THREE.Group();
    rainbowGroup.name = 'rainbow_road';

    // 6A. 6 Vibrant Neon Ribbon Lanes with Crystal Texture
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
        uvs.push(0, t * 40, 1, t * 40);

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
        emissiveIntensity: 0.85,
        map: crystalTex,
        roughness: 0.15,
        metalness: 0.1,
        transparent: true,
        opacity: 0.94,
        toneMapped: false, // True neon saturation!
      });

      const laneMesh = new THREE.Mesh(geo, laneMat);
      laneMesh.receiveShadow = true;
      rainbowGroup.add(laneMesh);
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
      const lineMat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.85,
      });
      rainbowGroup.add(new THREE.Line(lineGeo, lineMat));
    }

    // 6C. Metallic Gold Chrome Curbs with Neon Glow Rails
    const rails = [-halfTotalWidth - 0.05, halfTotalWidth + 0.05];
    rails.forEach((railOffset, idx) => {
      const railGeo = new THREE.BufferGeometry();
      const railVerts: number[] = [];
      const railIndices: number[] = [];

      for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        const pt = getTrackPoint(t, railOffset);
        const outerPt = getTrackPoint(t, railOffset + (idx === 0 ? -0.15 : 0.15));

        railVerts.push(pt.position.x, 0.12, pt.position.z);
        railVerts.push(outerPt.position.x, 0.01, outerPt.position.z);

        if (i < samples) {
          const r1 = i * 2;
          const r2 = (i + 1) * 2;
          railIndices.push(r1, r1 + 1, r2);
          railIndices.push(r1 + 1, r2 + 1, r2);
        }
      }

      railGeo.setAttribute('position', new THREE.Float32BufferAttribute(railVerts, 3));
      railGeo.computeVertexNormals();
      railGeo.setIndex(railIndices);

      const railMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.95,
        roughness: 0.12,
        emissive: idx === 0 ? 0xff0044 : 0xaa00ff,
        emissiveIntensity: 0.45,
        toneMapped: false,
      });
      rainbowGroup.add(new THREE.Mesh(railGeo, railMat));
    });

    // 6D. Underside Cosmic Halo (Floating Underglow)
    const underglowGeo = new THREE.BufferGeometry();
    const ugVerts: number[] = [];
    const ugIndices: number[] = [];
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const ptIn = getTrackPoint(t, -halfTotalWidth - 0.2);
      const ptOut = getTrackPoint(t, halfTotalWidth + 0.2);
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
    const underglowMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
      side: THREE.BackSide,
    });
    rainbowGroup.add(new THREE.Mesh(underglowGeo, underglowMat));

    scene.add(rainbowGroup);

    // 7. BOARD SPACES (20 Circular Stepping Discs)
    BOARD_SPACES.forEach((space) => {
      const pos = getSpacePosition(space.index, 0.04);
      const spaceGroup = new THREE.Group();
      spaceGroup.position.copy(pos);

      // Base cylinder
      const cylGeo = new THREE.CylinderGeometry(0.55, 0.58, 0.06, 24);
      const cylMat = new THREE.MeshStandardMaterial({
        color: space.colorHex,
        emissive: space.neonHex,
        emissiveIntensity: 0.55,
        roughness: 0.25,
        metalness: 0.35,
        toneMapped: false,
      });
      const cylMesh = new THREE.Mesh(cylGeo, cylMat);
      cylMesh.receiveShadow = true;
      spaceGroup.add(cylMesh);

      // Top decal
      const iconTex = createSpaceIconTexture(space.type, space.colorHex, space.neonHex);
      const topPlateGeo = new THREE.CircleGeometry(0.51, 24);
      const topPlateMat = new THREE.MeshBasicMaterial({ map: iconTex, transparent: true });
      const topPlateMesh = new THREE.Mesh(topPlateGeo, topPlateMat);
      topPlateMesh.rotation.x = -Math.PI / 2;
      topPlateMesh.position.y = 0.035;
      spaceGroup.add(topPlateMesh);

      // White perimeter rim
      const ringGeo = new THREE.RingGeometry(0.52, 0.60, 24);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.y = 0.038;
      spaceGroup.add(ringMesh);

      scene.add(spaceGroup);
    });

    // 8. AUTHENTIC 3D SUPER STAR IN CENTER (UPRIGHT WITH EYES)
    const superStar = createMarioSuperStar();
    scene.add(superStar);
    starMeshRef.current = superStar;

    // Glowing white circular floor halo
    const floorRingGeo = new THREE.RingGeometry(2.2, 2.38, 64);
    const floorRingMat = new THREE.MeshBasicMaterial({
      color: 0x93c5fd,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const floorRingMesh = new THREE.Mesh(floorRingGeo, floorRingMat);
    floorRingMesh.rotation.x = -Math.PI / 2;
    floorRingMesh.position.y = 0.02;
    scene.add(floorRingMesh);
    orbitalRingRef.current = floorRingMesh;

    // 9. TWO AUTHENTIC WARP PIPES WITH ANIMATED PIRANHA PLANTS
    const pipeConfigs = [
      { x: -5.8, z: 0.2, color: 0x22c55e, rimColor: 0x16a34a }, // Green Left
      { x: 5.8, z: -0.2, color: 0x06b6d4, rimColor: 0x0891b2 }, // Cyan Right
    ];
    piranhasRef.current = [];

    pipeConfigs.forEach((p) => {
      const pipe = createAuthenticWarpPipe(p.color, p.rimColor);
      pipe.position.set(p.x, 0, p.z);
      scene.add(pipe);

      const piranhaHead = pipe.getObjectByName('piranha_head') as THREE.Group;
      if (piranhaHead) piranhasRef.current.push(piranhaHead);
    });

    // 10. FOUR FLOATING GOLDEN '?' BLOCKS
    const qTex = createQuestionBlockTexture();
    const qMaterials = Array(6).fill(new THREE.MeshStandardMaterial({
      map: qTex,
      roughness: 0.15,
      metalness: 0.5,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.35,
    }));
    const qBlockGeo = new THREE.BoxGeometry(0.72, 0.72, 0.72);
    const qBlockPositions = [
      { x: -3.4, y: 1.8, z: -3.8 },
      { x: 0, y: 1.8, z: -4.4 },
      { x: 3.4, y: 1.8, z: -3.8 },
      { x: 0, y: 1.8, z: 4.4 },
    ];
    questionBlocksRef.current = [];

    qBlockPositions.forEach((pos) => {
      const block = new THREE.Mesh(qBlockGeo, qMaterials);
      block.position.set(pos.x, pos.y, pos.z);
      block.castShadow = true;
      scene.add(block);
      questionBlocksRef.current.push(block);
    });

    // 11. ACTIVE TURN SPOTLIGHT RING (UNDER ACTIVE PLAYER FEET)
    const activeRingGeo = new THREE.RingGeometry(0.48, 0.62, 32);
    const activeRingMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
    });
    const activeSpotlight = new THREE.Mesh(activeRingGeo, activeRingMat);
    activeSpotlight.rotation.x = -Math.PI / 2;
    activeSpotlight.position.y = 0.055;
    scene.add(activeSpotlight);
    activeSpotlightRef.current = activeSpotlight;

    // Window Resize with Dynamic FOV (Prevents cramping in split-screen/demo mode)
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      const aspect = w / h;
      camera.aspect = aspect;
      camera.fov = aspect < 1.65 ? Math.min(Math.max(38 * (1.65 / aspect), 38), 54) : 38;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // ANIMATION LOOP (60 FPS CHOREOGRAPHY)
    const clock = new THREE.Clock();

    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // 1. Super Star: Upright floating + majestic continuous rotation
      if (starMeshRef.current) {
        starMeshRef.current.position.y = 1.35 + Math.sin(elapsedTime * 2.2) * 0.18;
        starMeshRef.current.rotation.y = elapsedTime * 0.85;
      }

      // 2. Halo ring pulsation
      if (orbitalRingRef.current) {
        const s = 1 + Math.sin(elapsedTime * 3) * 0.05;
        orbitalRingRef.current.scale.set(s, s, 1);
      }

      // 3. Question Blocks: Floating & rotating
      questionBlocksRef.current.forEach((block, idx) => {
        block.rotation.y = elapsedTime * 1.2 + idx * 0.8;
        block.position.y = 1.8 + Math.sin(elapsedTime * 2.5 + idx) * 0.12;
      });

      // 4. Piranha Plants: Smoothly bobbing in and out of warp pipes
      piranhasRef.current.forEach((piranha, idx) => {
        const peek = Math.sin(elapsedTime * 2.0 + idx * Math.PI);
        piranha.position.y = 0.35 + Math.max(0, peek) * 0.45;
        piranha.rotation.y = Math.sin(elapsedTime * 1.5 + idx) * 0.3;
      });

      // 5. Star bits floating dust drift
      if (starBitsRef.current) {
        starBitsRef.current.rotation.y = elapsedTime * 0.04;
      }

      // 6. Active player spotlight ring pulsation
      if (activeSpotlightRef.current) {
        const pulse = 1 + Math.sin(elapsedTime * 5) * 0.15;
        activeSpotlightRef.current.scale.set(pulse, pulse, 1);
      }

      // 7. 3D Volumetric Characters Idle Bobbing
      pawnsMapRef.current.forEach((pawn, playerId) => {
        const isMoving = gameState.phase === 'moving' && gameState.movement?.playerId === playerId;
        if (!isMoving) {
          const charBody = pawn.getObjectByName('char_body_group');
          if (charBody) {
            charBody.position.y = 0.16 + Math.sin(elapsedTime * 3.0 + playerId.charCodeAt(0)) * 0.03;
          }
        }
      });

      // Render
      renderer.render(scene, camera);

      // Update projected 2D screen positions for character labels with actual dimensions
      const curW = container.clientWidth;
      const curH = container.clientHeight;
      update2DLabels(camera, curW, curH);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      renderer.dispose();
      container.innerHTML = '';
      pawnsMapRef.current.forEach((pawn) => scene.remove(pawn));
      pawnsMapRef.current.clear();
    };
  }, []);

  // Update 2D Billboard Labels above characters (Anti-Thrashing Zero-Stutter)
  const update2DLabels = (camera: THREE.PerspectiveCamera, width: number, height: number) => {
    if (!pawnsMapRef.current) return;
    const labels: Array<{
      id: string;
      name: string;
      characterId: any;
      stars: number;
      x: number;
      y: number;
      isActive: boolean;
      isLeader: boolean;
      color: string;
    }> = [];

    const activePlayer = gameState.players[gameState.activePlayerIndex];

    pawnsMapRef.current.forEach((pawn, playerId) => {
      const player = gameState.players.find((p) => p.id === playerId);
      if (!player) return;

      const charInfo = CHARACTERS[player.characterId];
      const pos = new THREE.Vector3();
      pawn.getWorldPosition(pos);
      pos.y += 1.85; // Float directly above the 1.6 volumetric character head

      pos.project(camera);

      if (pos.z < 1) {
        const x = (pos.x * 0.5 + 0.5) * width;
        const y = (-pos.y * 0.5 + 0.5) * height;

        labels.push({
          id: player.id,
          name: player.name,
          characterId: player.characterId,
          stars: player.stars,
          x,
          y,
          isActive: player.id === activePlayer?.id,
          isLeader: gameState.starLeaderId === player.id && player.stars > 0,
          color: charInfo?.neonColor || '#facc15',
        });
      }
    });

    const hash = labels
      .map((l) => `${l.id}:${Math.round(l.x)}:${Math.round(l.y)}:${l.stars}:${l.isActive}`)
      .join('|');
    if (hash !== lastLabelsHashRef.current) {
      lastLabelsHashRef.current = hash;
      setScreenLabels(labels);
    }
  };

  // SYNC 3D PAWNS WITH GAME STATE & TILE OFFSETTING
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const existingPlayerIds = new Set(gameState.players.map((p) => p.id));

    // Remove pawns of players who left
    pawnsMapRef.current.forEach((pawn, playerId) => {
      if (!existingPlayerIds.has(playerId)) {
        scene.remove(pawn);
        pawnsMapRef.current.delete(playerId);
      }
    });

    // Group players by spaceIndex to calculate neat cluster offsets (prevents clipping!)
    const spaceOccupancy: Record<number, Player[]> = {};
    gameState.players.forEach((p) => {
      if (!spaceOccupancy[p.spaceIndex]) spaceOccupancy[p.spaceIndex] = [];
      spaceOccupancy[p.spaceIndex].push(p);
    });

    // Add or update pawns (Guaranteed inclusion in scene!)
    gameState.players.forEach((player) => {
      let pawn = pawnsMapRef.current.get(player.id);
      const charInfo = CHARACTERS[player.characterId];

      if (!pawn || pawn.parent !== scene) {
        if (!pawn) {
          pawn = createCharacterPawn(player.characterId, charInfo.neonColor);
          pawnsMapRef.current.set(player.id, pawn);
        }
        scene.add(pawn);
      }

      // Check if this pawn is actively hopping in movement phase
      const isMoving = gameState.phase === 'moving' && gameState.movement?.playerId === player.id;

      if (!isMoving) {
        const cluster = spaceOccupancy[player.spaceIndex] || [player];
        const playerIndexInCluster = cluster.findIndex((p) => p.id === player.id);
        const pos = getPlayerPositionOnSpace(player.spaceIndex, playerIndexInCluster, cluster.length);
        pawn.position.copy(pos);
      } else {
        // Positioned along hop trajectory
        const from = gameState.movement!.currentSpace;
        const to = (from + 1) % 20;
        const pos = getHopPosition(from, to, 0.5);
        pawn.position.copy(pos);
      }

      // Shield Aura
      let shieldMesh = pawn.getObjectByName('shield_aura') as THREE.Mesh;
      if (player.shieldActive && !shieldMesh) {
        const auraGeo = new THREE.SphereGeometry(0.7, 16, 16);
        const auraMat = new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          wireframe: true,
          transparent: true,
          opacity: 0.65,
        });
        shieldMesh = new THREE.Mesh(auraGeo, auraMat);
        shieldMesh.name = 'shield_aura';
        shieldMesh.position.y = 0.75;
        pawn.add(shieldMesh);
      } else if (!player.shieldActive && shieldMesh) {
        pawn.remove(shieldMesh);
      }
    });

    // Update active player spotlight position
    const activePlayer = gameState.players[gameState.activePlayerIndex];
    if (activePlayer && activeSpotlightRef.current) {
      const activePawn = pawnsMapRef.current.get(activePlayer.id);
      if (activePawn) {
        activeSpotlightRef.current.position.set(activePawn.position.x, 0.045, activePawn.position.z);
        activeSpotlightRef.current.visible = true;
      }
    } else if (activeSpotlightRef.current) {
      activeSpotlightRef.current.visible = false;
    }
  }, [gameState.players, gameState.activePlayerIndex, gameState.phase, gameState.movement]);

  // SYNC 3D BANANA TRAPS
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    bananaMeshesRef.current.forEach((mesh) => scene.remove(mesh));
    bananaMeshesRef.current = [];

    gameState.traps.forEach((trap) => {
      const pos = getSpacePosition(trap.spaceIndex, 0.08);
      const bananaGroup = new THREE.Group();
      bananaGroup.position.copy(pos);

      // Banana Peel 3D shape
      const peelGeo = new THREE.ConeGeometry(0.18, 0.35, 12);
      const peelMat = new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        roughness: 0.3,
        emissive: 0xca8a04,
        emissiveIntensity: 0.4,
      });
      const peelMesh = new THREE.Mesh(peelGeo, peelMat);
      peelMesh.rotation.z = Math.PI / 4;
      bananaGroup.add(peelMesh);

      scene.add(bananaGroup);
      bananaMeshesRef.current.push(bananaGroup);
    });
  }, [gameState.traps]);

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-slate-950">
      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* 2D Projected Floating Overhead Character Badges */}
      {screenLabels.map((label) => (
        <div
          key={label.id}
          className={`absolute pointer-events-none transform -translate-x-1/2 -translate-y-full transition-opacity duration-150 ${
            label.isActive ? 'scale-110 z-20 opacity-100' : 'opacity-90 z-10'
          }`}
          style={{
            left: `${label.x}px`,
            top: `${label.y}px`,
          }}
        >
          {/* Active Turn Arrow Indicator */}
          {label.isActive && (
            <div className="flex justify-center -mb-1 animate-bounce">
              <span className="text-yellow-300 text-sm filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                ▼
              </span>
            </div>
          )}

          {/* Floating Pill Badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black shadow-2xl backdrop-blur-md transition-all ${
              label.isActive
                ? 'bg-slate-900/95 ring-2 ring-yellow-400 text-yellow-300 shadow-yellow-500/40'
                : 'bg-slate-900/85 text-white border border-white/15'
            }`}
          >
            {label.isLeader && <span>👑</span>}
            <span className="truncate max-w-[90px]">{label.name}</span>
            <span className="text-yellow-400 flex items-center font-bold">
              ★ {label.stars}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
