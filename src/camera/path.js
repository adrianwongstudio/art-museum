/**
 * Route planning for a walk across the room.
 *
 * There is exactly one obstacle — the sculpture in the middle — so the planner is
 * correspondingly small: walk straight unless that would take you through the
 * sculpture, in which case round it on the side you were already leaning toward.
 *
 * A detour is expressed as a quadratic Bézier whose control point is chosen so the
 * curve passes exactly through the waypoint at t = 0.5. That keeps the walk smooth
 * — a polyline would put a visible corner in the middle of the room.
 */

import { room, sculpture } from '../data/gallery.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const maxX = room.width / 2 - room.wallMargin;
const maxZ = room.depth / 2 - room.wallMargin;

/** Closest point to `centre` on the segment from `a` to `b`. */
function closestPointOnSegment(a, b, centre) {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const lengthSq = dx * dx + dz * dz;
  if (lengthSq < 1e-12) return { point: { x: a.x, z: a.z }, t: 0 };

  const t = clamp(((centre.x - a.x) * dx + (centre.z - a.z) * dz) / lengthSq, 0, 1);
  return { point: { x: a.x + dx * t, z: a.z + dz * t }, t };
}

export function planPath(from, to, options = {}) {
  const obstacle = options.obstacle ?? sculpture.position;
  const radius = options.radius ?? sculpture.radius;
  const avoidRadius = options.avoidRadius ?? sculpture.avoidRadius;

  const start = { x: from.x, z: from.z };
  const end = { x: to.x, z: to.z };

  const { point: nearest } = closestPointOnSegment(start, end, obstacle);
  const clearance = Math.hypot(nearest.x - obstacle.x, nearest.z - obstacle.z);

  if (clearance >= radius) {
    return {
      curved: false,
      from: start,
      to: end,
      sample(t) {
        const k = clamp(t, 0, 1);
        return { x: start.x + (end.x - start.x) * k, z: start.z + (end.z - start.z) * k };
      },
    };
  }

  // Push further out on the side the straight line already favoured. If it ran
  // dead through the centre, take the left-hand side of the direction of travel.
  let ox = nearest.x - obstacle.x;
  let oz = nearest.z - obstacle.z;
  if (clearance < 1e-6) {
    ox = -(end.z - start.z);
    oz = end.x - start.x;
  }
  const length = Math.hypot(ox, oz) || 1;

  const waypoint = {
    x: clamp(obstacle.x + (ox / length) * avoidRadius, -maxX, maxX),
    z: clamp(obstacle.z + (oz / length) * avoidRadius, -maxZ, maxZ),
  };

  // B(0.5) = (P0 + 2·P1 + P2) / 4, so this control point puts the curve on the
  // waypoint exactly halfway through the walk.
  const control = {
    x: 2 * waypoint.x - (start.x + end.x) / 2,
    z: 2 * waypoint.z - (start.z + end.z) / 2,
  };

  return {
    curved: true,
    from: start,
    to: end,
    waypoint,
    sample(t) {
      const k = clamp(t, 0, 1);
      const inv = 1 - k;
      const a = inv * inv;
      const b = 2 * inv * k;
      const c = k * k;
      return {
        x: a * start.x + b * control.x + c * end.x,
        z: a * start.z + b * control.z + c * end.z,
      };
    },
  };
}

/** Walked length of a path, by sampling. Good enough to time a walk by. */
export function pathLength(path, segments = 48) {
  let total = 0;
  let previous = path.sample(0);
  for (let i = 1; i <= segments; i += 1) {
    const point = path.sample(i / segments);
    total += Math.hypot(point.x - previous.x, point.z - previous.z);
    previous = point;
  }
  return total;
}
