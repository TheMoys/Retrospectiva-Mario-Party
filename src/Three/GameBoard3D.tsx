import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GameState, Player } from '@/types/game';
import { BOARD_SPACES } from '@/constants/boardSpaces';
import { CHARACTERS } from '@/constants/characters';
import { getTrackPoint, getSpacePosition, getPlayerPosition, TRACK_SPECS } from './trackMath';
import { createCharacterPawn } from './pawnGeometries';

interface GameBoard3DProps {
  gameState: GameState;
  onSpaceClick?: (spaceIndex: number) => void;
}

export const GameBoard3D: React.FC<GameBoard3DProps> = ({ gameState, onSpaceClick }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [screenLabels, setScreenLabels] = useState<Array<{ id: string; name: string; stars: number; x: number; y: number; isLeader: boolean; color: string }>>([]);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameId = useRef<number | null>(null);

  // 3D Objects References
  const starMeshRef = useRef<THREE.Mesh | null>(null);
  const orbitalHaloRef = useRef<THREE.Points | null>(null);
  const diceGroupRef = useRef<THREE.Group | null>(null);
  const diceMeshesRef = useRef<THREE.Mesh[]>([]);
  const questionBlocksRef = useRef<THREE.Mesh[]>([]);
  const piranhasRef = useRef<THREE.Group[]>([]);
  const pawnsMapRef = useRef<Map<string, THREE.Group>>(new Map());
  const bananaMeshesRef = useRef<THREE.Group[]>([]);

  // Movement animation interpolation states
  const pawnMotionRef = useRef<Map<string, { currentSpace: number; targetSpace: number; hopProgress: number }>>(new Map());

  // Helper: Create Dice Face Texture with dots
  const createDiceTexture = (num: number): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    // Background: Golden Yellow gradient with metallic border
    const grad = ctx.createRadialGradient(64, 64, 10, 64, 64, 80);
    grad.addColorStop(0, '#FFFBEB');
    grad.addColorStop(1, '#FDE68A');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, 118, 118);

    // Draw Dice Dots
    ctx.fillStyle = '#B45309';
    const dot = (x: number, y: number) => {
      ctx.beginPath();
      ctx.arc(x, y, 11, 0, Math.PI * 2);
      ctx.fill();
    };

    if (num % 2 === 1) dot(64, 64); // Center
    if (num > 1) { dot(32, 32); dot(96, 96); } // Top-left & Bottom-right
    if (num > 3) { dot(96, 32); dot(32, 96); } // Top-right & Bottom-left
    if (num === 6) { dot(32, 64); dot(96, 64); } // Middle sides

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

    // 4 Corner bolts
    ctx.fillStyle = '#78350F';
    const bolt = (x: number, y: number) => {
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
    };
    bolt(16, 16); bolt(112, 16); bolt(16, 112); bolt(112, 112);

    // Big white Question Mark '?' with black stroke
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

  // Helper: Create Extruded 5-pointed Star Geometry
  const createStarGeometry = (): THREE.BufferGeometry => {
    const starShape = new THREE.Shape();
    const points = 5;
    const outerRadius = 1.3;
    const innerRadius = 0.58;

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
      depth: 0.35,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.08,
      bevelThickness: 0.08,
    });
  };

  // INITIALIZE THREE.JS SCENE
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060913); // Deep cosmic navy
    sceneRef.current = scene;

    // 2. Camera (Static Panoramic: FOV 38)
    // Fixed elevated perspective showing the entire 15.2 x 7.8 track without vertigo
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 15.5, 12.8);
    camera.lookAt(0, -0.4, 0);
    cameraRef.current = camera;

    // 3. Renderer with antialiasing and shadow maps
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const mainSun = new THREE.DirectionalLight(0xfffaed, 2.0);
    mainSun.position.set(6, 20, 8);
    mainSun.castShadow = true;
    mainSun.shadow.mapSize.width = 2048;
    mainSun.shadow.mapSize.height = 2048;
    mainSun.shadow.bias = -0.0005;
    scene.add(mainSun);

    // Glowing colored rim lights
    const blueRimLight = new THREE.PointLight(0x00ccff, 3.5, 25);
    blueRimLight.position.set(-10, 6, -8);
    scene.add(blueRimLight);

    const magentaRimLight = new THREE.PointLight(0xff00cc, 3.5, 25);
    magentaRimLight.position.set(10, 6, 8);
    scene.add(magentaRimLight);

    // 5. Starry Space Skybox & Ringed Planet in Horizon
    const starCount = 1200;
    const skyStarGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const dist = 45 + Math.random() * 25;

      starPositions[i * 3] = dist * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = Math.abs(dist * Math.cos(phi)) + 5; // keep in upper sky
      starPositions[i * 3 + 2] = dist * Math.sin(phi) * Math.sin(theta);

      // Star colors (white, cyan, yellow, pink)
      const colorType = Math.random();
      if (colorType > 0.8) {
        starColors[i * 3] = 0.5; starColors[i * 3 + 1] = 0.8; starColors[i * 3 + 2] = 1.0;
      } else if (colorType > 0.6) {
        starColors[i * 3] = 1.0; starColors[i * 3 + 1] = 0.9; starColors[i * 3 + 2] = 0.4;
      } else {
        starColors[i * 3] = 1.0; starColors[i * 3 + 1] = 1.0; starColors[i * 3 + 2] = 1.0;
      }
    }
    skyStarGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    skyStarGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const skyStarMat = new THREE.PointsMaterial({ size: 0.35, vertexColors: true, transparent: true, opacity: 0.85 });
    const starsMesh = new THREE.Points(skyStarGeo, skyStarMat);
    scene.add(starsMesh);

    // Ringed Planet on the Horizon
    const planetGroup = new THREE.Group();
    planetGroup.position.set(-14, 12, -22);

    const planetSphere = new THREE.Mesh(
      new THREE.SphereGeometry(2.4, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0x4f46e5, roughness: 0.4, emissive: 0x1e1b4b })
    );
    const planetRings = new THREE.Mesh(
      new THREE.RingGeometry(3.2, 5.2, 48),
      new THREE.MeshBasicMaterial({ color: 0x818cf8, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
    );
    planetRings.rotation.x = Math.PI / 2.6;
    planetRings.rotation.y = Math.PI / 6;
    planetGroup.add(planetSphere, planetRings);
    scene.add(planetGroup);

    // 6. BUILD THE 6-LANE OVAL RAINBOW ROAD
    const laneColors = [
      0xff0033, // 0: Red
      0xff6600, // 1: Orange
      0xffee00, // 2: Yellow
      0x00ff66, // 3: Green
      0x00ccff, // 4: Sky Blue
      0x9900ff, // 5: Violet
    ];

    const samples = 240;
    const laneWidth = TRACK_SPECS.laneWidth;

    // Build each of the 6 ribbon lanes
    laneColors.forEach((colorHex, laneIdx) => {
      const laneOffset = (laneIdx - 2.5) * laneWidth;
      const halfWidth = laneWidth / 2;

      const laneGeo = new THREE.BufferGeometry();
      const vertices: number[] = [];
      const normals: number[] = [];
      const uvs: number[] = [];
      const indices: number[] = [];

      for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        const pt = getTrackPoint(t, laneOffset);

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

      laneGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      laneGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      laneGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      laneGeo.setIndex(indices);

      // Vibrant neon material with toneMapped: false as required
      const laneMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 0.65,
        roughness: 0.15,
        metalness: 0.4,
        toneMapped: false,
      });

      const laneMesh = new THREE.Mesh(laneGeo, laneMat);
      laneMesh.receiveShadow = true;
      scene.add(laneMesh);
    });

    // Outer & Inner Metallic Golden Curbs
    const curbRadiiOffsets = [-3 * laneWidth, 3 * laneWidth];
    curbRadiiOffsets.forEach((curbOffset) => {
      const curbGeo = new THREE.BufferGeometry();
      const curbVerts: number[] = [];
      const curbNorms: number[] = [];
      const curbIndices: number[] = [];

      for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        const pt = getTrackPoint(t, curbOffset);
        const inner = new THREE.Vector3().copy(pt.position);
        const outer = new THREE.Vector3().copy(pt.position).addScaledVector(pt.normal, curbOffset > 0 ? 0.14 : -0.14);

        curbVerts.push(inner.x, 0.08, inner.z);
        curbVerts.push(outer.x, 0.0, outer.z);
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
        color: 0xffd700,
        emissive: 0xb45309,
        emissiveIntensity: 0.3,
        metalness: 0.9,
        roughness: 0.2,
      });
      const curbMesh = new THREE.Mesh(curbGeo, curbMat);
      scene.add(curbMesh);
    });

    // 7. BOARD SPACES (20 Cylindrical Casillas)
    BOARD_SPACES.forEach((space) => {
      const pos = getSpacePosition(space.index, 0.03);

      const spaceGroup = new THREE.Group();
      spaceGroup.position.copy(pos);

      // Base cylinder
      const cylGeo = new THREE.CylinderGeometry(0.55, 0.6, 0.06, 24);
      const cylMat = new THREE.MeshStandardMaterial({
        color: space.colorHex,
        emissive: space.neonHex,
        emissiveIntensity: 0.5,
        roughness: 0.3,
        metalness: 0.5,
        toneMapped: false,
      });
      const cylMesh = new THREE.Mesh(cylGeo, cylMat);
      cylMesh.receiveShadow = true;
      spaceGroup.add(cylMesh);

      // White perimeter ring
      const ringGeo = new THREE.RingGeometry(0.54, 0.64, 24);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.y = 0.035;
      spaceGroup.add(ringMesh);

      scene.add(spaceGroup);
    });

    // 8. GIANT GOLDEN STAR & ORBITAL HALO IN CENTER
    const starGeo = createStarGeometry();
    const starMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.8,
      metalness: 0.95,
      roughness: 0.15,
      toneMapped: false,
    });
    const starMesh = new THREE.Mesh(starGeo, starMat);
    starMesh.position.set(0, 1.8, 0);
    starMesh.rotation.x = 0.25;
    scene.add(starMesh);
    starMeshRef.current = starMesh;

    // Glowing orbital halo around central star
    const haloCount = 180;
    const haloGeo = new THREE.BufferGeometry();
    const haloPositions = new Float32Array(haloCount * 3);
    for (let i = 0; i < haloCount; i++) {
      const angle = (i / haloCount) * Math.PI * 2;
      const rad = 2.4 + (Math.random() - 0.5) * 0.3;
      haloPositions[i * 3] = Math.cos(angle) * rad;
      haloPositions[i * 3 + 1] = 1.8 + (Math.random() - 0.5) * 0.2;
      haloPositions[i * 3 + 2] = Math.sin(angle) * rad;
    }
    haloGeo.setAttribute('position', new THREE.BufferAttribute(haloPositions, 3));
    const haloMat = new THREE.PointsMaterial({ color: 0xffd700, size: 0.15, transparent: true, opacity: 0.75 });
    const haloPoints = new THREE.Points(haloGeo, haloMat);
    scene.add(haloPoints);
    orbitalHaloRef.current = haloPoints;

    // 9. WARP PIPES WITH PIRANHA PLANTS
    const pipeCoords = [
      { x: -4.2, z: -1.6 },
      { x: 4.2, z: 1.6 },
    ];
    piranhasRef.current = [];

    pipeCoords.forEach((coord) => {
      const pipeGroup = new THREE.Group();
      pipeGroup.position.set(coord.x, 0, coord.z);

      // Pipe Body
      const pipeCyl = new THREE.Mesh(
        new THREE.CylinderGeometry(0.45, 0.45, 0.8, 20),
        new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.2, metalness: 0.6 })
      );
      pipeCyl.position.y = 0.4;

      // Pipe Rim Lip
      const pipeRim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.52, 0.52, 0.2, 20),
        new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.2, metalness: 0.6 })
      );
      pipeRim.position.y = 0.8;
      pipeGroup.add(pipeCyl, pipeRim);

      // Piranha Plant Head coming out
      const piranhaGroup = new THREE.Group();
      piranhaGroup.position.y = 0.75;

      const headMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.24, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3 })
      );
      const whiteLips = new THREE.Mesh(
        new THREE.TorusGeometry(0.18, 0.04, 12, 20),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
      );
      whiteLips.rotation.x = Math.PI / 2;
      piranhaGroup.add(headMesh, whiteLips);

      pipeGroup.add(piranhaGroup);
      scene.add(pipeGroup);
      piranhasRef.current.push(piranhaGroup);
    });

    // 10. FLOATING ? BLOCKS ROTATING IN AIR
    const questionTex = createQuestionBlockTexture();
    const qMaterials = [
      new THREE.MeshStandardMaterial({ map: questionTex, roughness: 0.2, metalness: 0.5 }),
      new THREE.MeshStandardMaterial({ map: questionTex, roughness: 0.2, metalness: 0.5 }),
      new THREE.MeshStandardMaterial({ map: questionTex, roughness: 0.2, metalness: 0.5 }),
      new THREE.MeshStandardMaterial({ map: questionTex, roughness: 0.2, metalness: 0.5 }),
      new THREE.MeshStandardMaterial({ map: questionTex, roughness: 0.2, metalness: 0.5 }),
      new THREE.MeshStandardMaterial({ map: questionTex, roughness: 0.2, metalness: 0.5 }),
    ];
    const qBlockGeo = new THREE.BoxGeometry(0.65, 0.65, 0.65);

    const qPositions = [
      { x: -2.2, y: 1.5, z: -2.6 },
      { x: 2.2, y: 1.5, z: 2.6 },
    ];
    questionBlocksRef.current = [];

    qPositions.forEach((pos) => {
      const qBlock = new THREE.Mesh(qBlockGeo, qMaterials);
      qBlock.position.set(pos.x, pos.y, pos.z);
      scene.add(qBlock);
      questionBlocksRef.current.push(qBlock);
    });

    // 11. 3D DICE GROUP
    const diceGroup = new THREE.Group();
    diceGroup.position.set(0, 2.2, 0);
    scene.add(diceGroup);
    diceGroupRef.current = diceGroup;

    // Build default Die
    const dieMatArray = [
      new THREE.MeshStandardMaterial({ map: createDiceTexture(1), roughness: 0.1 }),
      new THREE.MeshStandardMaterial({ map: createDiceTexture(6), roughness: 0.1 }),
      new THREE.MeshStandardMaterial({ map: createDiceTexture(2), roughness: 0.1 }),
      new THREE.MeshStandardMaterial({ map: createDiceTexture(5), roughness: 0.1 }),
      new THREE.MeshStandardMaterial({ map: createDiceTexture(3), roughness: 0.1 }),
      new THREE.MeshStandardMaterial({ map: createDiceTexture(4), roughness: 0.1 }),
    ];
    const dieMesh1 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), dieMatArray);
    const dieMesh2 = dieMesh1.clone();
    diceGroup.add(dieMesh1, dieMesh2);
    diceMeshesRef.current = [dieMesh1, dieMesh2];
    dieMesh2.visible = false; // only visible when Turbo Mushroom is active

    // Handle Window Resize
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 12. ANIMATION LOOP
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Central Star Rotation & gentle hovering
      if (starMeshRef.current) {
        starMeshRef.current.rotation.y = elapsedTime * 0.85;
        starMeshRef.current.position.y = 1.8 + Math.sin(elapsedTime * 2) * 0.15;
      }

      // Orbital Halo
      if (orbitalHaloRef.current) {
        orbitalHaloRef.current.rotation.y = -elapsedTime * 0.4;
      }

      // Floating ? Blocks spin
      questionBlocksRef.current.forEach((block, idx) => {
        block.rotation.y = elapsedTime * 1.2 + idx * Math.PI;
        block.position.y = 1.5 + Math.sin(elapsedTime * 2.5 + idx) * 0.12;
      });

      // Piranha Plants bobbing up and down
      piranhasRef.current.forEach((plant, idx) => {
        const offset = idx * Math.PI;
        const bob = Math.sin(elapsedTime * 2.5 + offset);
        plant.position.y = 0.5 + Math.max(0, bob) * 0.4;
        plant.rotation.y = Math.sin(elapsedTime * 1.5 + offset) * 0.3;
      });

      // Render 3D Scene
      renderer.render(scene, camera);

      // Project 2D screen positions for character labels
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

  // Update 2D Billboard Labels above 3D Pawns
  const update2DLabels = (camera: THREE.PerspectiveCamera, width: number, height: number) => {
    if (!pawnsMapRef.current) return;
    const labels: Array<{ id: string; name: string; stars: number; x: number; y: number; isLeader: boolean; color: string }> = [];

    pawnsMapRef.current.forEach((pawn, playerId) => {
      const player = gameState.players.find((p) => p.id === playerId);
      if (!player) return;

      const charInfo = CHARACTERS[player.characterId];
      const pos = new THREE.Vector3();
      pawn.getWorldPosition(pos);
      pos.y += 0.85; // Float directly above head

      pos.project(camera);

      // Check if in front of camera
      if (pos.z < 1) {
        const x = (pos.x * 0.5 + 0.5) * width;
        const y = (-pos.y * 0.5 + 0.5) * height;

        labels.push({
          id: player.id,
          name: player.name,
          stars: player.stars,
          x,
          y,
          isLeader: gameState.starLeaderId === player.id && player.stars > 0,
          color: charInfo?.neonColor || '#facc15',
        });
      }
    });

    setScreenLabels(labels);
  };

  // SYNC 3D PAWNS WITH GAME STATE
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Create or remove pawns matching gameState.players
    const existingPlayerIds = new Set(gameState.players.map((p) => p.id));

    // Remove pawns of players who left
    pawnsMapRef.current.forEach((pawn, playerId) => {
      if (!existingPlayerIds.has(playerId)) {
        scene.remove(pawn);
        pawnsMapRef.current.delete(playerId);
        pawnMotionRef.current.delete(playerId);
      }
    });

    // Add or update pawns
    gameState.players.forEach((player) => {
      let pawn = pawnsMapRef.current.get(player.id);
      const charInfo = CHARACTERS[player.characterId];

      if (!pawn) {
        pawn = createCharacterPawn(player.characterId, charInfo.neonColor);
        scene.add(pawn);
        pawnsMapRef.current.set(player.id, pawn);
        pawnMotionRef.current.set(player.id, {
          currentSpace: player.spaceIndex,
          targetSpace: player.spaceIndex,
          hopProgress: 0,
        });
      }

      // Update position along player's specific lane
      const pos = getPlayerPosition(player.spaceIndex, charInfo.laneIndex, 0);
      pawn.position.copy(pos);

      // Shield Aura effect (visual pulsing sphere if shield is active)
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
  }, [gameState.players]);

  // SYNC 3D BANANA TRAPS
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clear old bananas
    bananaMeshesRef.current.forEach((mesh) => scene.remove(mesh));
    bananaMeshesRef.current = [];

    // Place 3D bananas
    gameState.traps.forEach((trap) => {
      const pos = getSpacePosition(trap.spaceIndex, 0.08);
      const bananaGroup = new THREE.Group();
      bananaGroup.position.copy(pos);

      // Yellow curved peel
      const peelGeo = new THREE.TorusGeometry(0.18, 0.05, 8, 16, Math.PI);
      const peelMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 });
      const peelMesh = new THREE.Mesh(peelGeo, peelMat);
      peelMesh.rotation.x = Math.PI / 2;
      bananaGroup.add(peelMesh);

      scene.add(bananaGroup);
      bananaMeshesRef.current.push(bananaGroup);
    });
  }, [gameState.traps]);

  // SYNC 3D DICE OVER ACTIVE PLAYER
  useEffect(() => {
    if (!diceGroupRef.current || !diceMeshesRef.current.length) return;
    const diceGroup = diceGroupRef.current;
    const activePlayer = gameState.players[gameState.activePlayerIndex];

    if (!activePlayer || gameState.phase === 'lobby' || gameState.phase === 'podium') {
      diceGroup.visible = false;
      return;
    }

    diceGroup.visible = true;
    const charInfo = CHARACTERS[activePlayer.characterId];
    const playerPos = getPlayerPosition(activePlayer.spaceIndex, charInfo.laneIndex, 0);

    // Float dice directly above the active player
    diceGroup.position.set(playerPos.x, playerPos.y + 1.6, playerPos.z);

    const isDouble = gameState.diceRoll.length === 2;
    const [die1, die2] = diceMeshesRef.current;

    if (isDouble) {
      die1.position.x = -0.45;
      die2.position.x = 0.45;
      die2.visible = true;
    } else {
      die1.position.x = 0;
      die2.visible = false;
    }

    // If rolling, spin fast
    if (gameState.phase === 'rolling') {
      die1.rotation.x += 0.35;
      die1.rotation.y += 0.45;
      if (isDouble) {
        die2.rotation.x -= 0.35;
        die2.rotation.y -= 0.45;
      }
    }
  }, [gameState.activePlayerIndex, gameState.phase, gameState.diceRoll, gameState.players]);

  return (
    <div className="relative w-full h-full select-none overflow-hidden">
      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Floating 2D Projected Badges for Characters */}
      {screenLabels.map((lbl) => (
        <div
          key={lbl.id}
          className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-full transition-all duration-75 flex flex-col items-center"
          style={{ left: `${lbl.x}px`, top: `${lbl.y}px` }}
        >
          <div
            className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-lg flex items-center gap-1 border border-white/30 backdrop-blur-sm"
            style={{ backgroundColor: `${lbl.color}dd` }}
          >
            {lbl.isLeader && <span className="text-sm animate-bounce">👑</span>}
            <span>{lbl.name}</span>
            <span className="bg-black/40 px-1.5 py-0.2 rounded-full text-[10px] text-yellow-300 flex items-center gap-0.5">
              ⭐ {lbl.stars}
            </span>
          </div>
          <div className="w-1.5 h-1.5 bg-white/70 rotate-45 transform -translate-y-0.5" />
        </div>
      ))}
    </div>
  );
};
