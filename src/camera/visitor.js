/**
 * The visitor: where they stand, which way they are looking, and the small
 * vertical bob applied on top while they walk.
 *
 * One shared object, written by whichever system is in charge at the moment —
 * the free-walk controls or a guided travel — and read once per frame when the
 * camera is updated. Keeping it in one place is what lets the two hand over to
 * each other without a snap.
 */

import { room } from '../data/gallery.js';

export const MAX_PITCH = Math.PI / 3; // 60 degrees

export function createVisitor() {
  return {
    x: 0,
    z: 0,
    yaw: 0,
    pitch: 0,
    bobY: 0,
    bobRoll: 0,
  };
}

export function applyToCamera(camera, visitor) {
  camera.position.set(visitor.x, room.eyeHeight + visitor.bobY, visitor.z);
  camera.rotation.set(visitor.pitch, visitor.yaw, visitor.bobRoll, 'YXZ');
}

export function clampPitch(pitch) {
  return Math.min(MAX_PITCH, Math.max(-MAX_PITCH, pitch));
}
