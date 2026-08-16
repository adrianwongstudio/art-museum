/**
 * Where the visitor is allowed to stand.
 *
 * This is the whole of our "physics": the room is a box and the sculpture is a
 * cylinder, so collision is two clamps. Positions are {x, z} — the eye height
 * never changes.
 */

import { room, sculpture } from '../data/gallery.js';

const maxX = room.width / 2 - room.wallMargin;
const maxZ = room.depth / 2 - room.wallMargin;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/** Keep the visitor off the walls. */
export function clampToWalls(position) {
  return {
    x: clamp(position.x, -maxX, maxX),
    z: clamp(position.z, -maxZ, maxZ),
  };
}

/**
 * Keep the visitor out of the sculpture, pushing radially so the direction they
 * approached from is preserved.
 */
export function pushOutOfSculpture(position, radius = sculpture.radius) {
  const dx = position.x - sculpture.position.x;
  const dz = position.z - sculpture.position.z;
  const distance = Math.hypot(dx, dz);

  if (distance >= radius) return { x: position.x, z: position.z };

  // Walking exactly onto the centre is not reachable in practice, but a
  // deterministic answer beats a NaN.
  if (distance < 1e-6) {
    return { x: sculpture.position.x + radius, z: sculpture.position.z };
  }

  const scale = radius / distance;
  return {
    x: sculpture.position.x + dx * scale,
    z: sculpture.position.z + dz * scale,
  };
}

/** Both constraints, in the order that leaves the result valid for each. */
export function clampToRoom(position) {
  return pushOutOfSculpture(clampToWalls(position));
}

export const limits = { maxX, maxZ };
