import * as THREE from 'three';
import { CharacterId } from '@/types/game';

/**
 * Creates a distinct stylized 3D Mario Party character pawn
 */
export function createCharacterPawn(charId: CharacterId, neonColor: string): THREE.Group {
  const pawnGroup = new THREE.Group();

  // 1. Glowing Pedestal Base
  const baseGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.08, 24);
  const baseMat = new THREE.MeshStandardMaterial({
    color: neonColor,
    emissive: neonColor,
    emissiveIntensity: 0.6,
    metalness: 0.8,
    roughness: 0.2,
    toneMapped: false,
  });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.y = 0.04;
  pawnGroup.add(baseMesh);

  // 2. Character Model Hierarchy
  const bodyGroup = new THREE.Group();
  bodyGroup.position.y = 0.08;

  switch (charId) {
    case 'mario':
    case 'luigi': {
      const isLuigi = charId === 'luigi';
      const mainColor = isLuigi ? 0x22c55e : 0xef4444; // Green vs Red
      const overallsColor = 0x1d4ed8; // Denim blue

      // Shoes
      const shoeGeo = new THREE.BoxGeometry(0.1, 0.07, 0.16);
      const shoeMat = new THREE.MeshStandardMaterial({ color: 0x5c3818 });
      const leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
      leftShoe.position.set(-0.08, 0.035, 0.02);
      const rightShoe = leftShoe.clone();
      rightShoe.position.x = 0.08;
      bodyGroup.add(leftShoe, rightShoe);

      // Overalls (Legs & Torso)
      const torsoGeo = new THREE.BoxGeometry(isLuigi ? 0.22 : 0.26, isLuigi ? 0.32 : 0.28, 0.2);
      const torsoMat = new THREE.MeshStandardMaterial({ color: overallsColor });
      const torsoMesh = new THREE.Mesh(torsoGeo, torsoMat);
      torsoMesh.position.y = 0.2;
      bodyGroup.add(torsoMesh);

      // Shirt sleeves & White Gloves
      const gloveGeo = new THREE.SphereGeometry(0.06, 12, 12);
      const gloveMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
      const leftGlove = new THREE.Mesh(gloveGeo, gloveMat);
      leftGlove.position.set(-0.16, 0.18, 0);
      const rightGlove = leftGlove.clone();
      rightGlove.position.x = 0.16;
      bodyGroup.add(leftGlove, rightGlove);

      // Head
      const headGeo = new THREE.SphereGeometry(0.12, 16, 16);
      const headMat = new THREE.MeshStandardMaterial({ color: 0xffdbac });
      const headMesh = new THREE.Mesh(headGeo, headMat);
      headMesh.position.y = isLuigi ? 0.42 : 0.38;
      bodyGroup.add(headMesh);

      // Mustache
      const stacheGeo = new THREE.BoxGeometry(0.14, 0.04, 0.06);
      const stacheMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
      const stacheMesh = new THREE.Mesh(stacheGeo, stacheMat);
      stacheMesh.position.set(0, headMesh.position.y - 0.03, 0.11);
      bodyGroup.add(stacheMesh);

      // Cap with brim
      const capGeo = new THREE.SphereGeometry(0.13, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const capMat = new THREE.MeshStandardMaterial({ color: mainColor });
      const capMesh = new THREE.Mesh(capGeo, capMat);
      capMesh.position.y = headMesh.position.y + 0.04;

      const brimGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.02, 16, 1, false, -Math.PI / 3, (2 * Math.PI) / 3);
      const brimMesh = new THREE.Mesh(brimGeo, capMat);
      brimMesh.position.set(0, headMesh.position.y + 0.04, 0.06);
      brimMesh.rotation.x = 0.2;
      bodyGroup.add(capMesh, brimMesh);
      break;
    }

    case 'peach': {
      // Pink Flared Dress
      const dressGeo = new THREE.ConeGeometry(0.24, 0.4, 20);
      const dressMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.3 });
      const dressMesh = new THREE.Mesh(dressGeo, dressMat);
      dressMesh.position.y = 0.2;
      bodyGroup.add(dressMesh);

      // Blonde Hair Volume
      const hairGeo = new THREE.SphereGeometry(0.14, 16, 16);
      const hairMat = new THREE.MeshStandardMaterial({ color: 0xfacc15 });
      const hairMesh = new THREE.Mesh(hairGeo, hairMat);
      hairMesh.position.set(0, 0.42, -0.03);
      bodyGroup.add(hairMesh);

      // Head
      const headGeo = new THREE.SphereGeometry(0.11, 16, 16);
      const headMat = new THREE.MeshStandardMaterial({ color: 0xffe4e6 });
      const headMesh = new THREE.Mesh(headGeo, headMat);
      headMesh.position.y = 0.44;
      bodyGroup.add(headMesh);

      // Golden Crown with red/blue gems
      const crownGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.07, 6);
      const crownMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.9,
        roughness: 0.1,
      });
      const crownMesh = new THREE.Mesh(crownGeo, crownMat);
      crownMesh.position.y = 0.56;
      bodyGroup.add(crownMesh);
      break;
    }

    case 'yoshi': {
      // Green Body
      const bodyGeo = new THREE.SphereGeometry(0.16, 16, 16);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x22c55e });
      const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
      bodyMesh.position.y = 0.22;
      bodyGroup.add(bodyMesh);

      // White Rounded Snout
      const snoutGeo = new THREE.SphereGeometry(0.14, 16, 16);
      const snoutMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
      const snoutMesh = new THREE.Mesh(snoutGeo, snoutMat);
      snoutMesh.position.set(0, 0.36, 0.1);
      bodyGroup.add(snoutMesh);

      // Yoshi Head
      const headGeo = new THREE.SphereGeometry(0.12, 16, 16);
      const headMesh = new THREE.Mesh(headGeo, bodyMat);
      headMesh.position.set(0, 0.42, 0);
      bodyGroup.add(headMesh);

      // Orange Spikes on back
      const spikeGeo = new THREE.ConeGeometry(0.04, 0.08, 8);
      const spikeMat = new THREE.MeshStandardMaterial({ color: 0xf97316 });
      const spike = new THREE.Mesh(spikeGeo, spikeMat);
      spike.rotation.x = -Math.PI / 2;
      spike.position.set(0, 0.34, -0.15);
      bodyGroup.add(spike);
      break;
    }

    case 'bowser': {
      // Big Spiky Shell on back
      const shellGeo = new THREE.SphereGeometry(0.24, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const shellMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });
      const shellMesh = new THREE.Mesh(shellGeo, shellMat);
      shellMesh.rotation.x = Math.PI / 2;
      shellMesh.position.set(0, 0.28, -0.1);
      bodyGroup.add(shellMesh);

      // White Shell Spikes
      const spikeGeo = new THREE.ConeGeometry(0.04, 0.1, 8);
      const spikeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
      for (let i = -1; i <= 1; i++) {
        const s = new THREE.Mesh(spikeGeo, spikeMat);
        s.position.set(i * 0.12, 0.28, -0.28);
        s.rotation.x = -Math.PI / 2;
        bodyGroup.add(s);
      }

      // Yellow Robust Torso
      const torsoGeo = new THREE.BoxGeometry(0.3, 0.32, 0.24);
      const torsoMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24 });
      const torsoMesh = new THREE.Mesh(torsoGeo, torsoMat);
      torsoMesh.position.y = 0.22;
      bodyGroup.add(torsoMesh);

      // Big Head with Horns
      const headGeo = new THREE.BoxGeometry(0.22, 0.18, 0.2);
      const headMesh = new THREE.Mesh(headGeo, torsoMat);
      headMesh.position.set(0, 0.44, 0.06);

      const hornGeo = new THREE.ConeGeometry(0.03, 0.1, 8);
      const hornMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
      const leftHorn = new THREE.Mesh(hornGeo, hornMat);
      leftHorn.position.set(-0.11, 0.54, 0.04);
      leftHorn.rotation.z = 0.4;
      const rightHorn = leftHorn.clone();
      rightHorn.position.x = 0.11;
      rightHorn.rotation.z = -0.4;

      bodyGroup.add(headMesh, leftHorn, rightHorn);
      break;
    }

    case 'toad': {
      // Blue vest on torso
      const torsoGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.2, 16);
      const torsoMat = new THREE.MeshStandardMaterial({ color: 0x2563eb });
      const torsoMesh = new THREE.Mesh(torsoGeo, torsoMat);
      torsoMesh.position.y = 0.16;
      bodyGroup.add(torsoMesh);

      // Head
      const headGeo = new THREE.SphereGeometry(0.11, 16, 16);
      const headMat = new THREE.MeshStandardMaterial({ color: 0xffdbac });
      const headMesh = new THREE.Mesh(headGeo, headMat);
      headMesh.position.y = 0.32;
      bodyGroup.add(headMesh);

      // Giant Mushroom Cap (White with Red Polka Dots)
      const capGeo = new THREE.SphereGeometry(0.25, 24, 16, 0, Math.PI * 2, 0, Math.PI / 1.6);
      const capMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
      const capMesh = new THREE.Mesh(capGeo, capMat);
      capMesh.position.y = 0.38;

      // Red dots on mushroom cap
      const dotGeo = new THREE.CircleGeometry(0.06, 12);
      const dotMat = new THREE.MeshStandardMaterial({ color: 0xef4444, side: THREE.DoubleSide });
      const frontDot = new THREE.Mesh(dotGeo, dotMat);
      frontDot.position.set(0, 0.46, 0.23);
      frontDot.rotation.x = -0.2;
      const leftDot = frontDot.clone();
      leftDot.position.set(-0.22, 0.46, 0);
      leftDot.rotation.y = -Math.PI / 2;
      const rightDot = frontDot.clone();
      rightDot.position.set(0.22, 0.46, 0);
      rightDot.rotation.y = Math.PI / 2;

      bodyGroup.add(capMesh, frontDot, leftDot, rightDot);
      break;
    }
  }

  pawnGroup.add(bodyGroup);
  pawnGroup.scale.set(1.4, 1.4, 1.4);

  return pawnGroup;
}
