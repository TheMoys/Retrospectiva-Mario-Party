import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GameState, Player } from '@/types/game';
import { BOARD_SPACES } from '@/constants/boardSpaces';
import { CHARACTERS } from '@/constants/characters';
import { CharacterAvatar } from '@/components/Common/CharacterAvatar';
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
  const starMeshRef = useRef<THREE.Mesh | null>(null);
  const orbitalRingRef = useRef<THREE.Mesh | null>(null);
  const pawnsMapRef = useRef<Map<string, THREE.Group>>(new Map());
  const activeSpotlightRef = useRef<THREE.Mesh | null>(null);
  const bananaMeshesRef = useRef<THREE.Group[]>([]);
  const questionBlocksRef = useRef<THREE.Mesh[]>([]);
  const piranhasRef = useRef<THREE.Group[]>([]);

  // Movement animation interpolation reference
  const movementAnimRef = useRef<{
    playerId: string;
    fromSpace: number;
    toSpace: number;
    startTime: number;
    duration: number;
  } | null>(null);

  // Helper: Create Extruded 5-pointed Star Geometry
  const createStarGeometry = (scale: number = 1): THREE.BufferGeometry => {
    const starShape = new THREE.Shape();
    const points = 5;
    const outerRadius = 1.35 * scale;
    const innerRadius = 0.62 * scale;

    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) starShape.moveTo(x, y);
      else starShape.lineTo(x, y);
    }
    starShape.closePath();

    return new THREE.ExtrudeGeometry(starShape, {
      depth: 0.38 * scale,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.08 * scale,
      bevelThickness: 0.08 * scale,
    });
  };

  // Helper: Create Space Icon Decal Texture (Matching Reference)
  const createSpaceIconTexture = (type: string, colorHex: string, neonHex: string): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    // Clean saturated disc
    ctx.fillStyle = colorHex;
    ctx.beginPath();
    ctx.arc(64, 64, 58, 0, Math.PI * 2);
    ctx.fill();

    // White perimeter ring
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Inner icon symbol
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

  // INITIALIZE THREE.JS SCENE
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070814); // Deep cosmic navy/black
    sceneRef.current = scene;

    // 2. Camera (Fixed Isometric Perspective matching Reference Screenshot)
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(0, 16.5, 14.5);
    camera.lookAt(0, -0.6, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting Rig (Bright, vibrant, crisp shadows)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    const mainSun = new THREE.DirectionalLight(0xfffaed, 2.2);
    mainSun.position.set(6, 22, 10);
    mainSun.castShadow = true;
    mainSun.shadow.mapSize.width = 2048;
    mainSun.shadow.mapSize.height = 2048;
    mainSun.shadow.bias = -0.0004;
    scene.add(mainSun);

    // Magenta & Cyan soft rim highlights
    const magentaRim = new THREE.PointLight(0xd946ef, 3.2, 30);
    magentaRim.position.set(-10, 5, -8);
    scene.add(magentaRim);

    const cyanRim = new THREE.PointLight(0x06b6d4, 3.2, 30);
    cyanRim.position.set(10, 5, 8);
    scene.add(cyanRim);

    // 5. Cosmic Starfield Background
    const starCount = 1000;
    const skyStarGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const dist = 40 + Math.random() * 25;
      starPositions[i * 3] = dist * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = Math.abs(dist * Math.cos(phi)) + 4;
      starPositions[i * 3 + 2] = dist * Math.sin(phi) * Math.sin(theta);
    }
    skyStarGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const skyStarMat = new THREE.PointsMaterial({ size: 0.32, color: 0xffffff, transparent: true, opacity: 0.8 });
    scene.add(new THREE.Points(skyStarGeo, skyStarMat));

    // 6. BUILD THE SLEEK OVAL TRACK (Matching mario party game.jpeg)
    const samples = 240;
    const trackWidth = 2.3;
    const halfWidth = trackWidth / 2;

    const trackGeo = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const pt = getTrackPoint(t, 0);

      const leftEdge = new THREE.Vector3().copy(pt.position).addScaledVector(pt.normal, -halfWidth);
      const rightEdge = new THREE.Vector3().copy(pt.position).addScaledVector(pt.normal, halfWidth);

      vertices.push(leftEdge.x, 0.01, leftEdge.z);
      vertices.push(rightEdge.x, 0.01, rightEdge.z);

      normals.push(0, 1, 0, 0, 1, 0);
      uvs.push(0, t * 10, 1, t * 10);

      if (i < samples) {
        const row1 = i * 2;
        const row2 = (i + 1) * 2;
        indices.push(row1, row1 + 1, row2);
        indices.push(row1 + 1, row2 + 1, row2);
      }
    }

    trackGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    trackGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    trackGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    trackGeo.setIndex(indices);

    // Deep purple-navy satin surface
    const trackMat = new THREE.MeshStandardMaterial({
      color: 0x120e29,
      emissive: 0x080614,
      emissiveIntensity: 0.4,
      roughness: 0.3,
      metalness: 0.25,
    });
    const trackMesh = new THREE.Mesh(trackGeo, trackMat);
    trackMesh.receiveShadow = true;
    scene.add(trackMesh);

    // Glowing Neon Magenta Curbs (Inner & Outer)
    const curbOffsets = [-halfWidth, halfWidth];
    curbOffsets.forEach((curbOffset) => {
      const curbGeo = new THREE.BufferGeometry();
      const curbVerts: number[] = [];
      const curbNorms: number[] = [];
      const curbIndices: number[] = [];

      for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        const pt = getTrackPoint(t, curbOffset);
        const inner = new THREE.Vector3().copy(pt.position);
        const outer = new THREE.Vector3().copy(pt.position).addScaledVector(pt.normal, curbOffset > 0 ? 0.12 : -0.12);

        curbVerts.push(inner.x, 0.06, inner.z);
        curbVerts.push(outer.x, 0.01, outer.z);
        curbNorms.push(0, 1, 0, 0, 1, 0);

        if (i < samples) {
          const r1 = i * 2;
          const r2 = (i + 1) * 2;
          curbIndices.push(r1, r1 + 1, r2);
          curbIndices.push(r1 + 1, r2 + 1, r2);
        }
      }

      curbGeo.setAttribute('position', new THREE.Float32BufferAttribute(curbVerts, 3));
      curbGeo.setAttribute('normal', new THREE.Float32BufferAttribute(curbNorms, 3));
      curbGeo.setIndex(curbIndices);

      const curbMat = new THREE.MeshStandardMaterial({
        color: 0xd946ef,
        emissive: 0xc026d3,
        emissiveIntensity: 0.9,
        roughness: 0.2,
        metalness: 0.4,
        toneMapped: false,
      });
      scene.add(new THREE.Mesh(curbGeo, curbMat));
    });

    // 7. BOARD SPACES (20 Circular Stepping Pads with Decals)
    BOARD_SPACES.forEach((space) => {
      const pos = getSpacePosition(space.index, 0.03);
      const spaceGroup = new THREE.Group();
      spaceGroup.position.copy(pos);

      // Base cylinder
      const cylGeo = new THREE.CylinderGeometry(0.55, 0.58, 0.06, 24);
      const cylMat = new THREE.MeshStandardMaterial({
        color: space.colorHex,
        emissive: space.neonHex,
        emissiveIntensity: 0.45,
        roughness: 0.3,
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

    // 8. GIANT GOLDEN STAR IN CENTER (Resting tilted as in Reference)
    const starGeo = createStarGeometry(1.05);
    const starMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.7,
      metalness: 0.95,
      roughness: 0.15,
      toneMapped: false,
    });
    const starMesh = new THREE.Mesh(starGeo, starMat);
    starMesh.position.set(0, 0.5, 0);
    starMesh.rotation.x = Math.PI / 2.4; // Tilted slightly upwards toward camera
    scene.add(starMesh);
    starMeshRef.current = starMesh;

    // Glowing white circular ring on the floor beneath the central star
    const floorRingGeo = new THREE.RingGeometry(2.2, 2.35, 64);
    const floorRingMat = new THREE.MeshBasicMaterial({
      color: 0x93c5fd,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const floorRingMesh = new THREE.Mesh(floorRingGeo, floorRingMat);
    floorRingMesh.rotation.x = -Math.PI / 2;
    floorRingMesh.position.y = 0.02;
    scene.add(floorRingMesh);
    orbitalRingRef.current = floorRingMesh;

    // 9. TWO WARP PIPES (Green on Left, Cyan on Right - Matching Reference)
    const pipes = [
      { x: -5.8, z: 0.2, color: 0x22c55e, rimColor: 0x16a34a },
      { x: 5.8, z: -0.2, color: 0x06b6d4, rimColor: 0x0891b2 },
    ];
    piranhasRef.current = [];

    pipes.forEach((p) => {
      const pipeGroup = new THREE.Group();
      pipeGroup.position.set(p.x, 0, p.z);

      const pipeBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.65, 0.65, 1.3, 24),
        new THREE.MeshStandardMaterial({ color: p.color, roughness: 0.2, metalness: 0.4 })
      );
      pipeBody.position.y = 0.65;

      const pipeLip = new THREE.Mesh(
        new THREE.CylinderGeometry(0.74, 0.74, 0.35, 24),
        new THREE.MeshStandardMaterial({ color: p.rimColor, roughness: 0.2, metalness: 0.4 })
      );
      pipeLip.position.y = 1.35;
      pipeGroup.add(pipeBody, pipeLip);

      // Cute Piranha inside
      const piranhaHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3 })
      );
      piranhaHead.position.y = 1.3;
      pipeGroup.add(piranhaHead);

      scene.add(pipeGroup);
      piranhasRef.current.push(pipeGroup);
    });

    // 10. FOUR FLOATING ? BLOCKS
    const qTex = createQuestionBlockTexture();
    const qMaterials = Array(6).fill(new THREE.MeshStandardMaterial({ map: qTex, roughness: 0.2, metalness: 0.4 }));
    const qBlockGeo = new THREE.BoxGeometry(0.65, 0.65, 0.65);
    const qBlockPositions = [
      { x: -3.4, y: 1.6, z: -3.8 },
      { x: 0, y: 1.6, z: -4.4 },
      { x: 3.4, y: 1.6, z: -3.8 },
      { x: 0, y: 1.6, z: 4.4 },
    ];
    questionBlocksRef.current = [];

    qBlockPositions.forEach((pos) => {
      const block = new THREE.Mesh(qBlockGeo, qMaterials);
      block.position.set(pos.x, pos.y, pos.z);
      scene.add(block);
      questionBlocksRef.current.push(block);
    });

    // 11. ACTIVE TURN SPOTLIGHT RING (Under feet of current player)
    const activeRingGeo = new THREE.RingGeometry(0.38, 0.48, 32);
    const activeRingMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const activeSpotlight = new THREE.Mesh(activeRingGeo, activeRingMat);
    activeSpotlight.rotation.x = -Math.PI / 2;
    activeSpotlight.position.y = 0.05;
    scene.add(activeSpotlight);
    activeSpotlightRef.current = activeSpotlight;

    // Window Resize
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // ANIMATION LOOP
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Gentle Star breathing / hover
      if (starMeshRef.current) {
        starMeshRef.current.rotation.z = Math.sin(elapsedTime * 1.5) * 0.08;
        starMeshRef.current.position.y = 0.5 + Math.sin(elapsedTime * 2) * 0.08;
      }

      // Question blocks floating & bobbing
      questionBlocksRef.current.forEach((block, idx) => {
        block.rotation.y = elapsedTime * 1.2 + idx * 0.8;
        block.position.y = 1.6 + Math.sin(elapsedTime * 2.5 + idx) * 0.1;
      });

      // Active player spotlight ring pulsation
      if (activeSpotlightRef.current) {
        const pulse = 1 + Math.sin(elapsedTime * 5) * 0.15;
        activeSpotlightRef.current.scale.set(pulse, pulse, 1);
      }

      // Render
      renderer.render(scene, camera);

      // Update projected 2D screen positions for character labels
      update2DLabels(camera, width, height);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      renderer.dispose();
      container.innerHTML = '';
    };
  }, []);

  // Update 2D Billboard Labels above characters
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
      pos.y += 0.95; // Float directly above head

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

    setScreenLabels(labels);
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

    // Add or update pawns
    gameState.players.forEach((player) => {
      let pawn = pawnsMapRef.current.get(player.id);
      const charInfo = CHARACTERS[player.characterId];

      if (!pawn) {
        pawn = createCharacterPawn(player.characterId, charInfo.neonColor);
        scene.add(pawn);
        pawnsMapRef.current.set(player.id, pawn);
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
        const auraGeo = new THREE.SphereGeometry(0.5, 16, 16);
        const auraMat = new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          wireframe: true,
          transparent: true,
          opacity: 0.6,
        });
        shieldMesh = new THREE.Mesh(auraGeo, auraMat);
        shieldMesh.name = 'shield_aura';
        shieldMesh.position.y = 0.35;
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
        activeSpotlightRef.current.position.set(activePawn.position.x, 0.04, activePawn.position.z);
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

      const peelGeo = new THREE.TorusGeometry(0.18, 0.05, 8, 16, Math.PI);
      const peelMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 });
      const peelMesh = new THREE.Mesh(peelGeo, peelMat);
      peelMesh.rotation.x = Math.PI / 2;
      bananaGroup.add(peelMesh);

      scene.add(bananaGroup);
      bananaMeshesRef.current.push(bananaGroup);
    });
  }, [gameState.traps]);

  return (
    <div className="relative w-full h-full select-none overflow-hidden">
      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Floating 2D Billboard Badges for Characters (High Legibility & Anti-Slop) */}
      {screenLabels.map((lbl) => (
        <div
          key={lbl.id}
          className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-full transition-all duration-75 flex flex-col items-center"
          style={{ left: `${lbl.x}px`, top: `${lbl.y}px` }}
        >
          <div
            className={`px-2.5 py-1 rounded-full text-[11px] font-black text-white shadow-xl flex items-center gap-1.5 border backdrop-blur-md transition-all ${
              lbl.isActive
                ? 'ring-2 ring-yellow-400 bg-slate-900/95 border-yellow-400 scale-110 shadow-yellow-500/30'
                : 'bg-slate-950/85 border-white/20'
            }`}
          >
            {lbl.isLeader && <span className="text-xs animate-bounce">👑</span>}
            <CharacterAvatar characterId={lbl.characterId} size="sm" showBorder={false} />
            <span className="truncate max-w-[85px]">{lbl.name}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/50 text-[10px] text-yellow-300 font-black">
              ★ {lbl.stars}
            </span>
          </div>

          {/* Turn Arrow Indicator if active */}
          {lbl.isActive && (
            <div className="w-2 h-2 bg-yellow-400 rotate-45 transform -translate-y-1 shadow-md" />
          )}
        </div>
      ))}
    </div>
  );
};