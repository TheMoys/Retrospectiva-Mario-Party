import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { CharacterId } from '@/types/game';

const gltfLoader = new GLTFLoader();
const loadedGltfCache = new Map<CharacterId, THREE.Group>();

/**
 * Checks and loads external GLTF/GLB models if available in /models/[characterId].glb
 * Features automatic bounding-box normalization, centering on pedestal, double-sided materials,
 * and robust SkinnedMesh cloning via SkeletonUtils.
 */
export function tryLoadGLTFCharacter(charId: CharacterId, onLoaded: (group: THREE.Group) => void) {
  if (loadedGltfCache.has(charId)) {
    const cached = loadedGltfCache.get(charId)!;
    onLoaded(SkeletonUtils.clone(cached) as THREE.Group);
    return;
  }

  const modelUrl = `/models/${charId}.glb`;
  gltfLoader.load(
    modelUrl,
    (gltf) => {
      const rawScene = gltf.scene;

      // 1. Enable shadows & ensure material visibility for all child meshes
      rawScene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          const mesh = child as THREE.Mesh;
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((m) => {
                m.side = THREE.DoubleSide;
                m.depthWrite = true;
              });
            } else {
              mesh.material.side = THREE.DoubleSide;
              mesh.material.depthWrite = true;
            }
          }
        }
      });

      // 2. Measure actual bounding box after scene hierarchy
      rawScene.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(rawScene);
      const size = new THREE.Vector3();
      box.getSize(size);
      const center = new THREE.Vector3();
      box.getCenter(center);

      // Target unscaled height = 1.65 (so when scaled by 0.62 in GameBoard3D, rendered height is ~1.02 units)
      const targetHeight = 1.65;
      const modelDimension = Math.max(size.y, size.x * 0.7, size.z * 0.7);
      const scaleFactor = targetHeight / (modelDimension > 0.0001 ? modelDimension : 1.0);

      // 3. Wrap in a normalized anchor group: centered at (0, 0) and seated on feet at Y=0
      const container = new THREE.Group();
      container.name = 'char_body_group';

      rawScene.scale.set(scaleFactor, scaleFactor, scaleFactor);
      rawScene.position.x = -center.x * scaleFactor;
      rawScene.position.z = -center.z * scaleFactor;
      rawScene.position.y = -box.min.y * scaleFactor;

      container.add(rawScene);

      loadedGltfCache.set(charId, container);
      onLoaded(SkeletonUtils.clone(container) as THREE.Group);
    },
    undefined,
    (err) => {
      console.warn(`[GLB Loader] Could not load /models/${charId}.glb (using procedural 3D model instead):`, err);
    }
  );
}

/**
 * Creates an authentic, prominent, high-fidelity 3D Volumetric Mario Party Character Pawn
 * Height: ~1.6 units (Fully 3D sculpted, richly detailed, instantly recognizable)
 */
export function createCharacterPawn(charId: CharacterId, neonColor: string): THREE.Group {
  const pawnGroup = new THREE.Group();
  pawnGroup.name = `pawn_${charId}`;

  // 1. Soft Ground Contact Shadow (Radial gradient disc)
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const sCtx = shadowCanvas.getContext('2d')!;
  const sGrad = sCtx.createRadialGradient(64, 64, 8, 64, 64, 60);
  sGrad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
  sGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.4)');
  sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  sCtx.fillStyle = sGrad;
  sCtx.fillRect(0, 0, 128, 128);

  const shadowGeo = new THREE.PlaneGeometry(0.72, 0.72);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: new THREE.CanvasTexture(shadowCanvas),
    transparent: true,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.04;
  pawnGroup.add(shadowMesh);

  // 2. Beveled Illuminated Acrylic Pedestal Base (Compact Tabletop Scale)
  const baseGeo = new THREE.CylinderGeometry(0.28, 0.33, 0.08, 32);
  const baseMat = new THREE.MeshStandardMaterial({
    color: neonColor,
    emissive: neonColor,
    emissiveIntensity: 0.8,
    roughness: 0.15,
    metalness: 0.75,
    toneMapped: false,
  });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.y = 0.06;
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  pawnGroup.add(baseMesh);

  // Double perimeter gold rim
  const rimGeo = new THREE.RingGeometry(0.29, 0.34, 32);
  const rimMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  const rimMesh = new THREE.Mesh(rimGeo, rimMat);
  rimMesh.rotation.x = -Math.PI / 2;
  rimMesh.position.y = 0.102;
  pawnGroup.add(rimMesh);

  // 3. Volumetric 3D Character Body Model (Harmoniously scaled ~1.04 units)
  const charBodyGroup = new THREE.Group();
  charBodyGroup.name = 'char_body_group';
  charBodyGroup.position.y = 0.09;
  charBodyGroup.scale.set(0.62, 0.62, 0.62);

  // Build character-specific 3D geometry
  switch (charId) {
    case 'mario':
    case 'luigi': {
      const isLuigi = charId === 'luigi';
      const shirtColor = isLuigi ? 0x22c55e : 0xe52521; // Green vs Red
      const capEmblemText = isLuigi ? 'L' : 'M';
      const bodyScaleY = isLuigi ? 1.15 : 1.0;

      // Shoes
      const shoeMat = new THREE.MeshStandardMaterial({ color: 0x5c3818, roughness: 0.4 });
      const shoeGeo = new THREE.BoxGeometry(0.18, 0.12, 0.28);
      const leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
      leftShoe.position.set(-0.16, 0.06, 0.04);
      const rightShoe = leftShoe.clone();
      rightShoe.position.x = 0.16;
      leftShoe.castShadow = true;
      rightShoe.castShadow = true;
      charBodyGroup.add(leftShoe, rightShoe);

      // Blue Denim Overalls Legs & Torso
      const denimMat = new THREE.MeshStandardMaterial({ color: 0x002688, roughness: 0.35 });
      const torsoGeo = new THREE.CylinderGeometry(0.32, 0.35, 0.52 * bodyScaleY, 20);
      const torso = new THREE.Mesh(torsoGeo, denimMat);
      torso.position.y = 0.36 * bodyScaleY;
      torso.castShadow = true;
      charBodyGroup.add(torso);

      // Yellow Buttons
      const buttonGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.02, 12);
      const buttonMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 });
      const btn1 = new THREE.Mesh(buttonGeo, buttonMat);
      btn1.rotation.x = Math.PI / 2;
      btn1.position.set(-0.12, 0.46 * bodyScaleY, 0.31);
      const btn2 = btn1.clone();
      btn2.position.x = 0.12;
      charBodyGroup.add(btn1, btn2);

      // Red/Green Shirt & Arms
      const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.3 });
      const armGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.35, 12);
      const leftArm = new THREE.Mesh(armGeo, shirtMat);
      leftArm.position.set(-0.35, 0.4 * bodyScaleY, 0);
      leftArm.rotation.z = 0.3;
      const rightArm = leftArm.clone();
      rightArm.position.x = 0.35;
      rightArm.rotation.z = -0.3;
      charBodyGroup.add(leftArm, rightArm);

      // White Spherical Gloves
      const gloveGeo = new THREE.SphereGeometry(0.11, 16, 16);
      const gloveMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
      const leftGlove = new THREE.Mesh(gloveGeo, gloveMat);
      leftGlove.position.set(-0.42, 0.26 * bodyScaleY, 0.05);
      const rightGlove = leftGlove.clone();
      rightGlove.position.x = 0.42;
      charBodyGroup.add(leftGlove, rightGlove);

      // Peach Head
      const headGeo = new THREE.SphereGeometry(0.24, 24, 24);
      const headMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.35 });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.y = 0.76 * bodyScaleY;
      head.castShadow = true;
      charBodyGroup.add(head);

      // Big Round Nose
      const noseGeo = new THREE.SphereGeometry(0.1, 16, 16);
      const noseMat = new THREE.MeshStandardMaterial({ color: 0xf1c27d, roughness: 0.3 });
      const nose = new THREE.Mesh(noseGeo, noseMat);
      nose.position.set(0, 0.74 * bodyScaleY, 0.24);
      charBodyGroup.add(nose);

      // 3D Black Mustache
      const stacheGeo = new THREE.BoxGeometry(0.32, 0.08, 0.12);
      const stacheMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.5 });
      const stache = new THREE.Mesh(stacheGeo, stacheMat);
      stache.position.set(0, 0.67 * bodyScaleY, 0.22);
      charBodyGroup.add(stache);

      // Eyes
      const eyeGeo = new THREE.CapsuleGeometry(0.035, 0.08, 8, 8);
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x002688 });
      const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
      leftEye.position.set(-0.08, 0.82 * bodyScaleY, 0.22);
      const rightEye = leftEye.clone();
      rightEye.position.x = 0.08;
      charBodyGroup.add(leftEye, rightEye);

      // Red/Green Cap
      const capDomeGeo = new THREE.SphereGeometry(0.28, 24, 16, 0, Math.PI * 2, 0, Math.PI / 1.7);
      const capDome = new THREE.Mesh(capDomeGeo, shirtMat);
      capDome.position.y = 0.84 * bodyScaleY;
      capDome.castShadow = true;

      // Cap Visor Brim
      const brimGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.04, 24, 1, false, -Math.PI / 3, (2 * Math.PI) / 3);
      const brimMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.3 });
      const brim = new THREE.Mesh(brimGeo, brimMat);
      brim.position.set(0, 0.82 * bodyScaleY, 0.16);
      brim.rotation.x = 0.25;

      // White 'M' or 'L' Emblem Circle
      const emblemCanvas = document.createElement('canvas');
      emblemCanvas.width = 128;
      emblemCanvas.height = 128;
      const eCtx = emblemCanvas.getContext('2d')!;
      eCtx.fillStyle = '#FFFFFF';
      eCtx.beginPath();
      eCtx.arc(64, 64, 60, 0, Math.PI * 2);
      eCtx.fill();
      eCtx.fillStyle = isLuigi ? '#22C55E' : '#E52521';
      eCtx.font = '900 80px "Arial Black", sans-serif';
      eCtx.textAlign = 'center';
      eCtx.textBaseline = 'middle';
      eCtx.fillText(capEmblemText, 64, 68);

      const emblemGeo = new THREE.CircleGeometry(0.1, 16);
      const emblemMat = new THREE.MeshBasicMaterial({
        map: new THREE.CanvasTexture(emblemCanvas),
        transparent: true,
      });
      const emblem = new THREE.Mesh(emblemGeo, emblemMat);
      emblem.position.set(0, 0.94 * bodyScaleY, 0.28);
      emblem.rotation.x = -0.15;

      charBodyGroup.add(capDome, brim, emblem);
      break;
    }

    case 'peach': {
      // Pink Flared Gown
      const dressGeo = new THREE.ConeGeometry(0.48, 0.75, 24);
      const dressMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.25 });
      const dress = new THREE.Mesh(dressGeo, dressMat);
      dress.position.y = 0.38;
      dress.castShadow = true;
      charBodyGroup.add(dress);

      // Magenta Waist Bustle
      const bustleGeo = new THREE.TorusGeometry(0.28, 0.06, 12, 24);
      const bustleMat = new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.3 });
      const bustle = new THREE.Mesh(bustleGeo, bustleMat);
      bustle.rotation.x = Math.PI / 2;
      bustle.position.y = 0.52;
      charBodyGroup.add(bustle);

      // Torso
      const torsoGeo = new THREE.CylinderGeometry(0.18, 0.24, 0.32, 16);
      const torso = new THREE.Mesh(torsoGeo, dressMat);
      torso.position.y = 0.68;
      charBodyGroup.add(torso);

      // Long White Gloves
      const gloveGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.32, 12);
      const gloveMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
      const leftGlove = new THREE.Mesh(gloveGeo, gloveMat);
      leftGlove.position.set(-0.25, 0.56, 0.05);
      leftGlove.rotation.z = 0.25;
      const rightGlove = leftGlove.clone();
      rightGlove.position.x = 0.25;
      rightGlove.rotation.z = -0.25;
      charBodyGroup.add(leftGlove, rightGlove);

      // Blonde Hair
      const hairGeo = new THREE.SphereGeometry(0.28, 20, 20);
      const hairMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35 });
      const hair = new THREE.Mesh(hairGeo, hairMat);
      hair.position.set(0, 0.95, -0.06);
      charBodyGroup.add(hair);

      // Head
      const headGeo = new THREE.SphereGeometry(0.2, 20, 20);
      const headMat = new THREE.MeshStandardMaterial({ color: 0xffe4e6, roughness: 0.3 });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.set(0, 0.95, 0.05);
      head.castShadow = true;
      charBodyGroup.add(head);

      // Big Sapphire Eyes
      const eyeGeo = new THREE.CapsuleGeometry(0.03, 0.06, 8, 8);
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
      const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
      leftEye.position.set(-0.07, 0.98, 0.22);
      const rightEye = leftEye.clone();
      rightEye.position.x = 0.07;
      charBodyGroup.add(leftEye, rightEye);

      // Golden Crown
      const crownGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.14, 6);
      const crownMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.9,
        roughness: 0.1,
      });
      const crown = new THREE.Mesh(crownGeo, crownMat);
      crown.position.set(0, 1.22, 0);

      // Red Ruby in Center of Crown
      const gemGeo = new THREE.SphereGeometry(0.035, 8, 8);
      const gemMat = new THREE.MeshBasicMaterial({ color: 0xe11d48 });
      const gem = new THREE.Mesh(gemGeo, gemMat);
      gem.position.set(0, 1.22, 0.12);
      charBodyGroup.add(crown, gem);
      break;
    }

    case 'yoshi': {
      // Green Dino Body
      const dinoMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.35 });
      const bodyGeo = new THREE.SphereGeometry(0.34, 20, 20);
      const body = new THREE.Mesh(bodyGeo, dinoMat);
      body.position.y = 0.45;
      body.castShadow = true;
      charBodyGroup.add(body);

      // White Belly
      const bellyGeo = new THREE.SphereGeometry(0.26, 16, 16);
      const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
      const belly = new THREE.Mesh(bellyGeo, whiteMat);
      belly.position.set(0, 0.42, 0.14);
      charBodyGroup.add(belly);

      // Red Saddle Shell on Back
      const saddleGeo = new THREE.TorusGeometry(0.18, 0.06, 12, 20);
      const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3 });
      const saddle = new THREE.Mesh(saddleGeo, redMat);
      saddle.rotation.y = Math.PI / 2;
      saddle.position.set(0, 0.48, -0.28);
      charBodyGroup.add(saddle);

      // Big Bulbous Yoshi Snout
      const snoutGeo = new THREE.SphereGeometry(0.24, 20, 20);
      const snout = new THREE.Mesh(snoutGeo, dinoMat);
      snout.position.set(0, 0.72, 0.22);
      charBodyGroup.add(snout);

      // Yoshi Head
      const headGeo = new THREE.SphereGeometry(0.22, 20, 20);
      const head = new THREE.Mesh(headGeo, dinoMat);
      head.position.set(0, 0.85, 0.02);
      charBodyGroup.add(head);

      // Big Tall Friendly Eyes on top
      const eyeGeo = new THREE.CapsuleGeometry(0.06, 0.16, 12, 12);
      const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
      const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
      leftEye.position.set(-0.09, 1.05, 0.08);
      const rightEye = leftEye.clone();
      rightEye.position.x = 0.09;

      // Pupils
      const pupilGeo = new THREE.SphereGeometry(0.035, 8, 8);
      const pupilMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
      const p1 = new THREE.Mesh(pupilGeo, pupilMat);
      p1.position.set(-0.09, 1.05, 0.14);
      const p2 = p1.clone();
      p2.position.x = 0.09;

      charBodyGroup.add(leftEye, rightEye, p1, p2);

      // Orange Crest Spikes on back of head
      const crestGeo = new THREE.ConeGeometry(0.06, 0.14, 8);
      const orangeMat = new THREE.MeshStandardMaterial({ color: 0xf97316 });
      for (let i = 0; i < 3; i++) {
        const spike = new THREE.Mesh(crestGeo, orangeMat);
        spike.rotation.x = -Math.PI / 2.2;
        spike.position.set(0, 0.92 - i * 0.12, -0.22);
        charBodyGroup.add(spike);
      }
      break;
    }

    case 'bowser': {
      // Bulky Yellow Scaled Torso
      const scaleMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 });
      const bodyGeo = new THREE.CylinderGeometry(0.42, 0.48, 0.65, 20);
      const body = new THREE.Mesh(bodyGeo, scaleMat);
      body.position.y = 0.45;
      body.castShadow = true;
      charBodyGroup.add(body);

      // Giant Green Spiked Shell on Back
      const shellGeo = new THREE.SphereGeometry(0.46, 20, 20, 0, Math.PI, 0, Math.PI);
      const shellMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.3 });
      const shell = new THREE.Mesh(shellGeo, shellMat);
      shell.rotation.y = -Math.PI / 2;
      shell.position.set(0, 0.52, -0.15);
      charBodyGroup.add(shell);

      // 3D White Shell Spikes
      const spikeGeo = new THREE.ConeGeometry(0.07, 0.18, 8);
      const spikeMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.2 });
      const spikePositions = [
        { x: 0, y: 0.65, z: -0.48 },
        { x: -0.22, y: 0.52, z: -0.42 },
        { x: 0.22, y: 0.52, z: -0.42 },
        { x: 0, y: 0.38, z: -0.46 },
      ];
      spikePositions.forEach((sp) => {
        const s = new THREE.Mesh(spikeGeo, spikeMat);
        s.rotation.x = -Math.PI / 2;
        s.position.set(sp.x, sp.y, sp.z);
        charBodyGroup.add(s);
      });

      // Spiked Wristbands
      const bandGeo = new THREE.TorusGeometry(0.14, 0.04, 8, 16);
      const bandMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.8 });
      const b1 = new THREE.Mesh(bandGeo, bandMat);
      b1.position.set(-0.45, 0.38, 0);
      const b2 = b1.clone();
      b2.position.x = 0.45;
      charBodyGroup.add(b1, b2);

      // Bowser Head
      const headGeo = new THREE.SphereGeometry(0.28, 20, 20);
      const head = new THREE.Mesh(headGeo, scaleMat);
      head.position.set(0, 0.82, 0.1);
      charBodyGroup.add(head);

      // Green Snout with Fangs
      const snoutGeo = new THREE.CylinderGeometry(0.22, 0.24, 0.2, 16);
      const greenSnoutMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.35 });
      const snout = new THREE.Mesh(snoutGeo, greenSnoutMat);
      snout.rotation.x = Math.PI / 3;
      snout.position.set(0, 0.74, 0.32);
      charBodyGroup.add(snout);

      // Fangs
      const fangGeo = new THREE.ConeGeometry(0.04, 0.12, 6);
      const fangMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
      const f1 = new THREE.Mesh(fangGeo, fangMat);
      f1.position.set(-0.12, 0.76, 0.42);
      const f2 = f1.clone();
      f2.position.x = 0.12;
      charBodyGroup.add(f1, f2);

      // Fiery Red Hair
      const hairGeo = new THREE.ConeGeometry(0.18, 0.36, 12);
      const redHairMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3 });
      const hair = new THREE.Mesh(hairGeo, redHairMat);
      hair.position.set(0, 1.15, -0.05);
      charBodyGroup.add(hair);

      // Yellow Horns
      const hornGeo = new THREE.ConeGeometry(0.08, 0.3, 10);
      const horn1 = new THREE.Mesh(hornGeo, spikeMat);
      horn1.position.set(-0.25, 0.98, -0.05);
      horn1.rotation.z = 0.6;
      horn1.rotation.x = -0.3;
      const horn2 = horn1.clone();
      horn2.position.x = 0.25;
      horn2.rotation.z = -0.6;
      charBodyGroup.add(horn1, horn2);
      break;
    }

    case 'toad': {
      // White Pants & Shoes
      const pantsGeo = new THREE.CylinderGeometry(0.28, 0.32, 0.25, 16);
      const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
      const pants = new THREE.Mesh(pantsGeo, whiteMat);
      pants.position.y = 0.2;
      charBodyGroup.add(pants);

      // Blue & Gold Vest
      const vestGeo = new THREE.CylinderGeometry(0.26, 0.28, 0.28, 16);
      const vestMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.35 });
      const vest = new THREE.Mesh(vestGeo, vestMat);
      vest.position.y = 0.42;
      vest.castShadow = true;
      charBodyGroup.add(vest);

      // Round Peach Face
      const headGeo = new THREE.SphereGeometry(0.22, 20, 20);
      const headMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.35 });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.y = 0.68;
      charBodyGroup.add(head);

      // Black Oval Eyes with Sparkles
      const eyeGeo = new THREE.CapsuleGeometry(0.035, 0.08, 8, 8);
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
      const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
      leftEye.position.set(-0.08, 0.72, 0.2);
      const rightEye = leftEye.clone();
      rightEye.position.x = 0.08;
      charBodyGroup.add(leftEye, rightEye);

      // Giant Mushroom Cap (White sphere with red polka dots)
      const capGeo = new THREE.SphereGeometry(0.46, 24, 24);
      const cap = new THREE.Mesh(capGeo, whiteMat);
      cap.position.y = 1.05;
      cap.castShadow = true;
      charBodyGroup.add(cap);

      // Red Polka Dots on Mushroom Cap
      const dotGeo = new THREE.CircleGeometry(0.16, 16);
      const redDotMat = new THREE.MeshBasicMaterial({ color: 0xe11d48, side: THREE.DoubleSide });

      // Front dot
      const frontDot = new THREE.Mesh(dotGeo, redDotMat);
      frontDot.position.set(0, 1.05, 0.465);
      // Top dot
      const topDot = new THREE.Mesh(dotGeo, redDotMat);
      topDot.rotation.x = -Math.PI / 2;
      topDot.position.set(0, 1.515, 0);
      // Left dot
      const leftDot = new THREE.Mesh(dotGeo, redDotMat);
      leftDot.rotation.y = -Math.PI / 2;
      leftDot.position.set(-0.465, 1.05, 0);
      // Right dot
      const rightDot = new THREE.Mesh(dotGeo, redDotMat);
      rightDot.rotation.y = Math.PI / 2;
      rightDot.position.set(0.465, 1.05, 0);

      charBodyGroup.add(frontDot, topDot, leftDot, rightDot);
      break;
    }
  }

  pawnGroup.add(charBodyGroup);

  // Check if an external GLB model exists and replace procedural mesh when loaded
  tryLoadGLTFCharacter(charId, (gltfModel) => {
    pawnGroup.remove(charBodyGroup);
    gltfModel.position.y = 0.09;
    gltfModel.name = 'char_body_group';
    pawnGroup.add(gltfModel);
  });

  return pawnGroup;
}
