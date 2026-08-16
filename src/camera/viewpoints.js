/**
 * Where you stand to look at something, and which way you face when you get there.
 *
 * Yaw follows the Three.js convention: 0 looks down -z, and yaw increases
 * counter-clockwise when seen from above.
 */

import { room, sculpture } from '../data/gallery.js';
import { getWork } from '../data/works.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * How far back you stand from a work. Tall work needs more room; the bounds stop
 * a postcard from being viewed with your nose against the wall, and a mural from
 * being viewed from the far side of the hall.
 */
export function viewingDistance(height) {
  return clamp(height * 1.6, 2, 4);
}

/** Yaw that looks from `from` toward `to` (both {x, z}). */
export function yawTo(from, to) {
  return Math.atan2(-(to.x - from.x), -(to.z - from.z));
}

/** Pitch that looks from `from` toward `to` (both {x, y, z}). */
export function pitchTo(from, to) {
  const dy = to.y - from.y;
  const horizontal = Math.hypot(to.x - from.x, to.z - from.z);
  if (horizontal < 1e-6) return dy >= 0 ? Math.PI / 2 : -Math.PI / 2;
  return Math.atan2(dy, horizontal);
}

function viewpoint(position, target) {
  return {
    position,
    target,
    yaw: yawTo(position, target),
    pitch: pitchTo(position, target),
  };
}

/** The spot in front of a hung work, square on, at eye height. */
export function viewpointForHanging(hanging) {
  const distance = viewingDistance(hanging.work.dimensions.h);
  const { position: art, normal } = hanging;

  return viewpoint(
    {
      x: art.x + normal.x * distance,
      y: room.eyeHeight,
      z: art.z + normal.z * distance,
    },
    art,
  );
}

/**
 * The spot in front of the sculpture, on whichever side the visitor is already
 * standing — walking around a sculpture to a fixed "front" would feel arbitrary.
 */
export function viewpointForSculpture(from) {
  const dx = from.x - sculpture.position.x;
  const dz = from.z - sculpture.position.z;
  const distance = Math.hypot(dx, dz);
  const [ux, uz] = distance < 1e-6 ? [0, 1] : [dx / distance, dz / distance];

  const work = getWork(sculpture.workId);
  const targetY = sculpture.pedestal.height + (work?.dimensions.h ?? 1.3) / 2;

  return viewpoint(
    {
      x: sculpture.position.x + ux * sculpture.viewDistance,
      y: room.eyeHeight,
      z: sculpture.position.z + uz * sculpture.viewDistance,
    },
    { x: sculpture.position.x, y: targetY, z: sculpture.position.z },
  );
}
