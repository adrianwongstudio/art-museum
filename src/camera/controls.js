/**
 * Input: drag to look, keys to walk, click to choose.
 *
 * Deliberately not pointer lock. A plain click has to stay available for
 * selecting a work, and pointer lock would also make the gallery hostile on a
 * phone, where the same code path handles a one-finger drag.
 *
 * A press that travels less than DRAG_THRESHOLD pixels is a click; anything more
 * is a look. That single rule is what lets one gesture do both jobs.
 */

import { clampToRoom } from './bounds.js';
import { clampPitch } from './visitor.js';

const DRAG_THRESHOLD = 6; // px
const LOOK_SPEED = 0.0032; // radians per pixel — a screen width is about 180 degrees
const WALK_SPEED = 1.4; // metres per second
const ACCELERATION = 8; // how fast walking spins up and down
const STEPS_PER_SECOND = 1.9; // an unhurried gallery pace

const FORWARD_KEYS = new Set(['KeyW', 'ArrowUp']);
const BACK_KEYS = new Set(['KeyS', 'ArrowDown']);
const LEFT_KEYS = new Set(['KeyA', 'ArrowLeft']);
const RIGHT_KEYS = new Set(['KeyD', 'ArrowRight']);
const WALK_KEYS = new Set([...FORWARD_KEYS, ...BACK_KEYS, ...LEFT_KEYS, ...RIGHT_KEYS]);

export function createControls({ canvas, visitor, onSelect, onHover, onInterrupt, reducedMotion }) {
  const keys = new Set();
  let pointerId = null;
  let last = { x: 0, y: 0 };
  let travelled = 0;
  let walkPhase = 0;
  let speed = 0;

  const ndc = (event) => ({
    x: (event.clientX / window.innerWidth) * 2 - 1,
    y: -(event.clientY / window.innerHeight) * 2 + 1,
  });

  function onPointerDown(event) {
    if (event.button !== undefined && event.button !== 0) return;
    pointerId = event.pointerId;
    last = { x: event.clientX, y: event.clientY };
    travelled = 0;
    canvas.setPointerCapture?.(event.pointerId);
  }

  function onPointerMove(event) {
    if (pointerId !== event.pointerId) {
      onHover?.(ndc(event));
      return;
    }

    const dx = event.clientX - last.x;
    const dy = event.clientY - last.y;
    last = { x: event.clientX, y: event.clientY };
    travelled += Math.hypot(dx, dy);

    if (travelled < DRAG_THRESHOLD) return;

    // The visitor has taken the wheel — stop walking them somewhere.
    onInterrupt?.();
    visitor.yaw -= dx * LOOK_SPEED;
    visitor.pitch = clampPitch(visitor.pitch - dy * LOOK_SPEED);
  }

  function onPointerUp(event) {
    if (pointerId !== event.pointerId) return;
    canvas.releasePointerCapture?.(event.pointerId);
    pointerId = null;
    if (travelled < DRAG_THRESHOLD) onSelect?.(ndc(event));
  }

  function onPointerCancel(event) {
    if (pointerId === event.pointerId) pointerId = null;
  }

  function onKeyDown(event) {
    if (!WALK_KEYS.has(event.code)) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (!keys.has(event.code)) onInterrupt?.();
    keys.add(event.code);
    event.preventDefault();
  }

  const onKeyUp = (event) => keys.delete(event.code);
  const onBlur = () => keys.clear();

  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerCancel);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);

  return {
    get walking() {
      return keys.size > 0;
    },

    /** Free walking. Guided travel drives the visitor directly and skips this. */
    update(dt) {
      let forward = 0;
      let strafe = 0;
      for (const code of keys) {
        if (FORWARD_KEYS.has(code)) forward += 1;
        if (BACK_KEYS.has(code)) forward -= 1;
        if (RIGHT_KEYS.has(code)) strafe += 1;
        if (LEFT_KEYS.has(code)) strafe -= 1;
      }

      const magnitude = Math.hypot(forward, strafe);
      const target = magnitude > 0 ? WALK_SPEED : 0;
      speed += (target - speed) * Math.min(1, ACCELERATION * dt);

      if (speed > 0.001 && magnitude > 0) {
        const nx = forward / magnitude;
        const nz = strafe / magnitude;
        const sin = Math.sin(visitor.yaw);
        const cos = Math.cos(visitor.yaw);

        // Yaw 0 looks down -z, so forward is (-sin, -cos) and right is (cos, -sin).
        const dx = (-sin * nx + cos * nz) * speed * dt;
        const dz = (-cos * nx - sin * nz) * speed * dt;

        const next = clampToRoom({ x: visitor.x + dx, z: visitor.z + dz });
        visitor.x = next.x;
        visitor.z = next.z;

        walkPhase += (speed / WALK_SPEED) * dt;
        const phase = walkPhase * 2 * Math.PI * STEPS_PER_SECOND;
        visitor.bobY = reducedMotion ? 0 : Math.sin(phase) * 0.026;
        visitor.bobRoll = reducedMotion ? 0 : Math.cos(phase) * 0.005;
      } else {
        // Settle back to level when they stop.
        visitor.bobY += (0 - visitor.bobY) * Math.min(1, 8 * dt);
        visitor.bobRoll += (0 - visitor.bobRoll) * Math.min(1, 8 * dt);
      }
    },

    dispose() {
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    },
  };
}
