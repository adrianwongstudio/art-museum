/**
 * The room itself, and what hangs where.
 *
 * All units are metres, right-handed Y-up, room centred on the origin.
 * This module is pure data — no Three.js, no DOM — so the camera maths and the
 * scene builder can both depend on it.
 */

import { getWork } from './works.js';

export const room = {
  width: 20, // along x
  depth: 10, // along z
  height: 5,
  /** Vertical centre of every hung work. */
  hangCenterY: 1.55,
  /** The visitor's eye is always at this height. */
  eyeHeight: 1.6,
  /** How close the visitor may get to a wall. */
  wallMargin: 0.5,
  doorway: { wall: 'west', width: 1.6, height: 2.6, center: 0 },
};

/**
 * Walls that carry work. `fixed` is the wall plane's coordinate, `axis` is the
 * coordinate that varies along the wall, and `normal` points into the room.
 */
export const walls = {
  north: { id: 'north', axis: 'x', fixed: -room.depth / 2, normal: { x: 0, y: 0, z: 1 } },
  south: { id: 'south', axis: 'x', fixed: room.depth / 2, normal: { x: 0, y: 0, z: -1 } },
  east: { id: 'east', axis: 'z', fixed: room.width / 2, normal: { x: -1, y: 0, z: 0 } },
  west: { id: 'west', axis: 'z', fixed: -room.width / 2, normal: { x: 1, y: 0, z: 0 } },
};

/**
 * The centre sculpture. It is selectable like a hung work but is not one of the
 * eight, so it does not appear in the progress dots.
 */
export const sculpture = {
  workId: 'w-reyes-sculpture',
  position: { x: 0, y: 0, z: 0 },
  /** Visitors are kept outside this radius, and travel paths route around it. */
  radius: 1.6,
  /** Radius the travel planner rounds the corner at when avoiding the sculpture. */
  avoidRadius: 2.4,
  pedestal: { height: 0.9, radius: 0.5 },
  viewDistance: 2.8,
};

/**
 * The eight hung works, in the order a visitor walking clockwise from the
 * entrance would meet them. `offset` is the position along the wall's axis.
 */
export const placements = [
  { workId: 'w-okonkwo-1', wall: 'north', offset: -6.5 },
  { workId: 'w-halvorsen-4', wall: 'north', offset: 0 },
  { workId: 'w-banks-2', wall: 'north', offset: 6.5 },
  { workId: 'w-banks-1', wall: 'east', offset: -2.6 },
  { workId: 'w-reyes-1', wall: 'east', offset: 2.6 },
  { workId: 'w-halvorsen-2', wall: 'south', offset: 6.5 },
  { workId: 'w-reyes-2', wall: 'south', offset: 0 },
  { workId: 'w-okonkwo-2', wall: 'south', offset: -6.5 },
];

/** Centre point of a placement's canvas, in world space. */
export function placementPosition(placement) {
  const wall = walls[placement.wall];
  if (!wall) throw new Error(`Unknown wall: ${placement.wall}`);
  return wall.axis === 'x'
    ? { x: placement.offset, y: room.hangCenterY, z: wall.fixed }
    : { x: wall.fixed, y: room.hangCenterY, z: placement.offset };
}

/**
 * Placements resolved against the catalogue: everything the scene builder, the
 * camera and the UI need about a hung work, in one shape.
 */
export const hangings = placements.map((placement, index) => {
  const work = getWork(placement.workId);
  if (!work) throw new Error(`Placement ${index} references unknown work: ${placement.workId}`);
  return {
    ...placement,
    index,
    work,
    position: placementPosition(placement),
    normal: walls[placement.wall].normal,
  };
});

export const hangingBySlug = Object.fromEntries(hangings.map((h) => [h.work.slug, h]));

export function getHangingBySlug(slug) {
  return hangingBySlug[slug] ?? null;
}

export function isHung(workId) {
  return hangings.some((h) => h.work.id === workId) || sculpture.workId === workId;
}
