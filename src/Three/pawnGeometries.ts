import * as THREE from 'three';
import { CharacterId } from '@/types/game';
import { createCharacterStandeeTexture } from './characterTextures';

/**
 * Creates an authentic Nintendo-quality 3D Acrylic Standee Pawn for each character
 * Height: 1.35 units (instantly recognizable from the isometric camera).
 */
export function createCharacterPawn(charId: CharacterId, neonColor: string): THREE.Group {
  const pawnGroup = new THREE.Group();
  pawnGroup.name = `pawn_${charId}`;

  // 1. Soft Ground Contact Shadow
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const sCtx = shadowCanvas.getContext('2d')!;
  const sGrad = sCtx.createRadialGradient(64, 64, 8, 64, 64, 60);
  sGrad.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
  sGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)');
  sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  sCtx.fillStyle = sGrad;
  sCtx.fillRect(0, 0, 128, 128);

  const shadowGeo = new THREE.PlaneGeometry(1.0, 1.0);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: new THREE.CanvasTexture(shadowCanvas),
    transparent: true,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.04;
  pawnGroup.add(shadowMesh);

  // 2. Acrylic Pedestal Base (Illuminated with character's neon color)
  const baseGeo = new THREE.CylinderGeometry(0.42, 0.46, 0.1, 32);
  const baseMat = new THREE.MeshStandardMaterial({
    color: neonColor,
    emissive: neonColor,
    emissiveIntensity: 0.75,
    roughness: 0.15,
    metalness: 0.8,
    toneMapped: false,
  });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.y = 0.08;
  pawnGroup.add(baseMesh);

  // Perimeter rim light on the pedestal
  const baseRimGeo = new THREE.RingGeometry(0.43, 0.48, 32);
  const baseRimMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  const baseRim = new THREE.Mesh(baseRimGeo, baseRimMat);
  baseRim.rotation.x = -Math.PI / 2;
  baseRim.position.y = 0.135;
  pawnGroup.add(baseRim);

  // 3. HD 512x512 Die-Cut Character Standee Billboard (Height: 1.35 units)
  const standeeTex = createCharacterStandeeTexture(charId);
  const standeeWidth = 1.15;
  const standeeHeight = 1.35;
  const standeeGeo = new THREE.PlaneGeometry(standeeWidth, standeeHeight);
  const standeeMat = new THREE.MeshStandardMaterial({
    map: standeeTex,
    transparent: true,
    alphaTest: 0.02,
    roughness: 0.2,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });

  const standeeMesh = new THREE.Mesh(standeeGeo, standeeMat);
  standeeMesh.name = 'standee_mesh';
  standeeMesh.position.y = 0.13 + standeeHeight / 2;
  // Tilt subtly back (15 deg) to directly face the FOV 38 host camera
  standeeMesh.rotation.x = -Math.PI / 10;
  pawnGroup.add(standeeMesh);

  return pawnGroup;
}
