/**
 * Walking the visitor from where they are to where they asked to be.
 *
 * The feel of it lives in travel.js (durations, easing, when the head turns, the
 * bob); the route lives in path.js. This module is the part that ties those to a
 * clock and writes the result onto the visitor each frame.
 */

import { planPath, pathLength } from './path.js';
import {
  bobAt,
  easeInOutCubic,
  facingWeight,
  lerpAngle,
  smoothstep,
  travelDuration,
} from './travel.js';
import { clampPitch } from './visitor.js';

/** How quickly the head swings onto the direction of travel at the start of a walk. */
const HEADING_BLEND = 0.3;

export function createTravelController({ visitor, reducedMotion = false }) {
  let path = null;
  let duration = 0;
  let elapsed = 0;
  let startYaw = 0;
  let startPitch = 0;
  let targetYaw = 0;
  let targetPitch = 0;
  let onArrive = null;
  let destination = null;

  function finish(arrived) {
    const callback = onArrive;
    const where = destination;
    path = null;
    onArrive = null;
    destination = null;
    visitor.bobY = 0;
    visitor.bobRoll = 0;
    if (arrived) callback?.(where);
  }

  return {
    get active() {
      return path !== null;
    },

    /** Where this walk is headed, or null when standing still. */
    get destination() {
      return destination;
    },

    /**
     * @param {{position: {x:number,z:number}, yaw:number, pitch?:number}} viewpoint
     * @param {{kind?: 'artwork'|'floor'|'entrance', meta?: any, onArrive?: Function}} options
     */
    go(viewpoint, { kind = 'artwork', meta = null, onArrive: callback = null } = {}) {
      path = planPath({ x: visitor.x, z: visitor.z }, viewpoint.position);
      duration = travelDuration({ kind, distance: pathLength(path), reducedMotion });
      elapsed = 0;
      startYaw = visitor.yaw;
      startPitch = visitor.pitch;
      targetYaw = viewpoint.yaw;
      targetPitch = clampPitch(viewpoint.pitch ?? 0);
      destination = meta;
      onArrive = callback;
    },

    /** Hand control back to the visitor, wherever they have got to. */
    cancel() {
      if (path) finish(false);
    },

    update(dt) {
      if (!path) return;

      elapsed = Math.min(duration, elapsed + dt);
      const t = duration > 0 ? elapsed / duration : 1;
      const eased = easeInOutCubic(t);

      const point = path.sample(eased);
      const ahead = path.sample(Math.min(1, eased + 0.02));
      visitor.x = point.x;
      visitor.z = point.z;

      // Look where you are going, then turn onto the work as you arrive.
      const dx = ahead.x - point.x;
      const dz = ahead.z - point.z;
      const heading =
        Math.hypot(dx, dz) > 1e-5 ? Math.atan2(-dx, -dz) : targetYaw;

      const alongPath = lerpAngle(startYaw, heading, smoothstep(0, HEADING_BLEND, t));
      visitor.yaw = lerpAngle(alongPath, targetYaw, facingWeight(t));
      visitor.pitch = startPitch + (targetPitch - startPitch) * eased;

      const bob = bobAt(t, duration, { enabled: !reducedMotion });
      visitor.bobY = bob.y;
      visitor.bobRoll = bob.roll;

      if (elapsed >= duration) {
        visitor.x = path.to.x;
        visitor.z = path.to.z;
        visitor.yaw = targetYaw;
        visitor.pitch = targetPitch;
        finish(true);
      }
    },
  };
}
