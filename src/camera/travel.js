/**
 * The timing and feel of a walk: how long it takes, how it eases, when the head
 * turns toward the work, and the bob that makes it read as walking rather than
 * gliding.
 *
 * All pure. The module that actually moves the camera lives in main.js.
 */

const clamp01 = (t) => Math.min(1, Math.max(0, t));

/** Walking speed used to time a walk to a spot on the floor. */
export const WALK_SPEED = 2.2;

export const DURATIONS = {
  artwork: 3, // the brief: about three seconds, every time
  entrance: 2.5,
  floorMin: 1.2,
  floorMax: 3,
  reduced: 0.4,
};

export function easeInOutCubic(t) {
  const k = clamp01(t);
  return k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2;
}

export function smoothstep(edge0, edge1, x) {
  if (edge0 === edge1) return x < edge0 ? 0 : 1;
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * Walks to a work always take the same time, so the pacing of the exhibition is
 * consistent wherever you are standing. Walks to a patch of floor are timed by
 * distance, because those are the visitor's own idea.
 */
export function travelDuration({ kind, distance = 0, reducedMotion = false }) {
  if (reducedMotion) return DURATIONS.reduced;
  if (kind === 'artwork') return DURATIONS.artwork;
  if (kind === 'entrance') return DURATIONS.entrance;
  return Math.min(DURATIONS.floorMax, Math.max(DURATIONS.floorMin, distance / WALK_SPEED));
}

/**
 * How much of the final facing has been adopted at time t. Zero for the first
 * stretch — you look where you are going — then a smooth turn onto the work.
 */
export function facingWeight(t) {
  return smoothstep(0.45, 1, clamp01(t));
}

export function shortestAngleDelta(from, to) {
  const twoPi = Math.PI * 2;
  return ((((to - from) % twoPi) + Math.PI * 3) % twoPi) - Math.PI;
}

export function lerpAngle(from, to, t) {
  return from + shortestAngleDelta(from, to) * clamp01(t);
}

/**
 * Vertical bob and a little roll, enveloped to zero at both ends so a walk starts
 * and finishes level. Two steps per second is an unhurried gallery pace.
 */
export function bobAt(t, duration, options = {}) {
  const { enabled = true, amplitude = 0.035, stepsPerSecond = 1.9 } = options;
  if (!enabled) return { y: 0, roll: 0 };

  const k = clamp01(t);
  const envelope = Math.sin(Math.PI * k);
  const phase = 2 * Math.PI * stepsPerSecond * duration * k;

  return {
    y: Math.sin(phase) * amplitude * envelope,
    roll: Math.cos(phase) * 0.007 * envelope, // ~0.4 degrees
  };
}

export function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
