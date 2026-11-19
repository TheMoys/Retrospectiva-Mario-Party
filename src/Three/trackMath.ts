import * as THREE from 'three';

export const TRACK_SPECS = {
  width: 24.9,
  height: 12.4,
  straightLength: 12.5,
  radius: 6.2,
  laneCount: 6,
  laneWidth: 0.55,
  totalSpaces: 20,
};

export interface TrackPoint {
  position: THREE.Vector3;
  tangent: THREE.Vector3;
  normal: THREE.Vector3;
}

/**
 * Computes parametric coordinates on the 15.2 x 7.8 oval track
 * @param t Parameter from 0 to 1 along the circuit
 * @param laneOffset Offset perpendicular to track centerline (-2.5 to 2.5 * laneWidth)
 */
export function getTrackPoint(t: number, laneOffset: number = 0): TrackPoint {
  const normT = ((t % 1) + 1) % 1; // Ensure 0 <= normT < 1
  const L = TRACK_SPECS.straightLength;
  const R = TRACK_SPECS.radius;

  const straightHalf = L / 2;
  const semiCircumference = Math.PI * R;
  const totalLength = 2 * L + 2 * semiCircumference;

  const dist = normT * totalLength;

  let x = 0;
  let z = 0;
  let tx = 0;
  let tz = 0;

  // Segment 1: Top straight line moving Right (dist: 0 to L)
  if (dist < L) {
    const s = dist / L;
    x = -straightHalf + s * L;
    z = -R;
    tx = 1;
    tz = 0;
  }
  // Segment 2: Right semicircle curving Down (dist: L to L + semiCircumference)
  else if (dist < L + semiCircumference) {
    const s = (dist - L) / semiCircumference;
    const angle = -Math.PI / 2 + s * Math.PI; // -90 deg to +90 deg
    x = straightHalf + R * Math.cos(angle);
    z = R * Math.sin(angle);
    tx = -Math.sin(angle);
    tz = Math.cos(angle);
  }
  // Segment 3: Bottom straight line moving Left (dist: L + semi to 2L + semi)
  else if (dist < 2 * L + semiCircumference) {
    const s = (dist - L - semiCircumference) / L;
    x = straightHalf - s * L;
    z = R;
    tx = -1;
    tz = 0;
  }
  // Segment 4: Left semicircle curving Up back to start
  else {
    const s = (dist - 2 * L - semiCircumference) / semiCircumference;
    const angle = Math.PI / 2 + s * Math.PI; // 90 deg to 270 deg
    x = -straightHalf + R * Math.cos(angle);
    z = R * Math.sin(angle);
    tx = -Math.sin(angle);
    tz = Math.cos(angle);
  }

  const tangent = new THREE.Vector3(tx, 0, tz).normalize();
  // Normal perpendicular to tangent on XZ plane (pointing outward from track center)
  const normal = new THREE.Vector3(-tz, 0, tx).normalize();

  const finalPos = new THREE.Vector3(
    x + normal.x * laneOffset,
    0,
    z + normal.z * laneOffset
  );

  return {
    position: finalPos,
    tangent,
    normal,
  };
}

/**
 * Gets exact 3D coordinates for a board space (0 to 19)
 */
export function getSpacePosition(spaceIndex: number, yOffset: number = 0.05): THREE.Vector3 {
  const t = (spaceIndex % TRACK_SPECS.totalSpaces) / TRACK_SPECS.totalSpaces;
  const pt = getTrackPoint(t, 0);
  return new THREE.Vector3(pt.position.x, yOffset, pt.position.z);
}

/**
 * Gets position for a player standing on a space, neatly offsetting if multiple players share the tile
 */
export function getPlayerPositionOnSpace(
  spaceIndex: number,
  playerIndexOnSpace: number = 0,
  totalPlayersOnSpace: number = 1
): THREE.Vector3 {
  const base = getSpacePosition(spaceIndex, 0.12);

  if (totalPlayersOnSpace > 1) {
    const angle = (playerIndexOnSpace / totalPlayersOnSpace) * Math.PI * 2 + (spaceIndex * 0.5);
    const radius = Math.min(0.38, 0.18 + totalPlayersOnSpace * 0.04);
    base.x += Math.cos(angle) * radius;
    base.z += Math.sin(angle) * radius;
  }

  return base;
}

/**
 * Calculates continuous position and tangent on track given fractional space parameter k
 * k can be e.g. 3.42 (meaning 42% between space 3 and space 4)
 */
export function getContinuousTrackPosition(k: number, laneOffset: number = 0): TrackPoint {
  const normT = ((k / TRACK_SPECS.totalSpaces) % 1 + 1) % 1;
  return getTrackPoint(normT, laneOffset);
}

/**
 * Calculates smooth parabolic hop trajectory between two consecutive tiles
 * @param fromSpace Index of current space (0 to 19)
 * @param toSpace Index of target space (0 to 19)
 * @param hopProgress Progress of this single hop (0.0 to 1.0)
 * @param playerIndexOnSpace Offset index on target space
 * @param totalPlayersOnSpace Total players clustered on target space
 */
export function getHopPosition(
  fromSpace: number,
  toSpace: number,
  hopProgress: number,
  playerIndexOnSpace: number = 0,
  totalPlayersOnSpace: number = 1
): THREE.Vector3 {
  const clampedT = Math.max(0, Math.min(1, hopProgress));
  
  const fromPos = getPlayerPositionOnSpace(fromSpace, 0, 1);
  const targetPos = getPlayerPositionOnSpace(toSpace, playerIndexOnSpace, totalPlayersOnSpace);

  // Linear interpolation along ground
  const currentPos = new THREE.Vector3().lerpVectors(fromPos, targetPos, clampedT);

  // Parabolic bounce arc
  const hopHeight = Math.sin(clampedT * Math.PI) * 0.65;
  currentPos.y += hopHeight;

  return currentPos;
}

/**
 * Legacy compatibility helper
 */
export function getPlayerPosition(spaceIndex: number, laneIndex: number, progressHop: number = 0): THREE.Vector3 {
  return getPlayerPositionOnSpace(spaceIndex, laneIndex % 6, 6);
}
