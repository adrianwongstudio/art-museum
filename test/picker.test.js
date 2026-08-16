import { BoxGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry } from 'three';
import { beforeEach, describe, expect, it } from 'vitest';

import { createPicker } from '../src/interaction/picker.js';
import { room, sculpture } from '../src/data/gallery.js';

/**
 * The picker resolves what a visitor meant by a click. It needs real geometry to
 * cast against, but no WebGL — a Raycaster is pure maths.
 */
function scene() {
  const hanging = { work: { slug: 'a-work' }, wall: 'north' };
  const material = new MeshBasicMaterial();

  // A work on the north wall, facing the camera.
  const canvas = new Mesh(new PlaneGeometry(1.2, 1.6), material);
  canvas.position.set(0, room.hangCenterY, -5);
  canvas.userData = { type: 'artwork', hanging };

  // Its frame and placard mean the same thing.
  const frame = new Mesh(new BoxGeometry(1.4, 1.8, 0.07), material);
  frame.position.set(0, room.hangCenterY, -5.05);
  frame.userData = { type: 'artwork', hanging };

  const placard = new Mesh(new PlaneGeometry(0.26, 0.16), material);
  placard.position.set(0.85, 1.08, -5);
  placard.userData = { type: 'artwork', hanging };

  // The sculpture in the middle of the room.
  const body = new Mesh(new BoxGeometry(0.9, 1.3, 0.9), material);
  body.position.set(0, 1.5, 0);
  body.userData = { type: 'sculpture' };

  const floor = new Mesh(new PlaneGeometry(room.width, room.depth), material);
  floor.rotation.x = -Math.PI / 2;

  for (const mesh of [canvas, frame, placard, body, floor]) mesh.updateMatrixWorld(true);

  return {
    hanging,
    targets: { artworks: [canvas, frame, placard], sculpture: [body], floor: [floor] },
  };
}

const CENTRE = { x: 0, y: 0 };

describe('createPicker', () => {
  let camera;
  let targets;
  let hanging;

  beforeEach(() => {
    ({ targets, hanging } = scene());
    camera = new PerspectiveCamera(58, 1.5, 0.1, 120);
    camera.rotation.order = 'YXZ';
  });

  /** Stand somewhere, look somewhere, and update the matrices the raycaster reads. */
  function stand(x, z, yaw, pitch = 0) {
    camera.position.set(x, room.eyeHeight, z);
    camera.rotation.set(pitch, yaw, 0, 'YXZ');
    camera.updateMatrixWorld(true);
  }

  it('returns the work when the visitor aims at the painted surface', () => {
    stand(0, -2, 0);
    const hit = createPicker({ camera, targets }).pick(CENTRE);
    expect(hit).toEqual({ type: 'artwork', hanging });
  });

  it('treats the frame and the placard as the same work', () => {
    stand(0, -2, 0);
    const picker = createPicker({ camera, targets });

    // Aim at the placard, off to the right of the frame and below it. These are
    // where the placard's centre projects to from where the camera is standing.
    const atPlacard = picker.pick({ x: 0.341, y: -0.313 });
    expect(atPlacard?.type).toBe('artwork');
    expect(atPlacard?.hanging).toBe(hanging);
  });

  it('picks the sculpture when the work is not in the way', () => {
    // Yaw 0 looks down -z, so this stands south of the centre looking at it.
    stand(0, 4, 0, -0.05);
    const hit = createPicker({ camera, targets }).pick(CENTRE);
    expect(hit).toEqual({ type: 'sculpture' });
  });

  it('picks the sculpture over a work standing behind it', () => {
    // The ray reaches the sculpture first and the north wall second. Clicking
    // something silhouetted against a painting must not select the painting.
    stand(0, 3, 0);
    const hit = createPicker({ camera, targets }).pick(CENTRE);
    expect(hit?.type).toBe('sculpture');
  });

  it('picks a work when nothing stands in front of it', () => {
    stand(4, 3, 0); // off to one side, so the sculpture is out of the way
    const hit = createPicker({ camera, targets }).pick({ x: -0.601, y: -0.011 });
    expect(hit?.type).toBe('artwork');
  });

  it('falls back to the floor, clamped to somewhere the visitor may stand', () => {
    stand(0, 3, 0, -0.9); // looking down at the boards
    const hit = createPicker({ camera, targets }).pick(CENTRE);
    expect(hit?.type).toBe('floor');
    expect(Math.abs(hit.point.x)).toBeLessThanOrEqual(room.width / 2 - room.wallMargin);
    expect(Math.abs(hit.point.z)).toBeLessThanOrEqual(room.depth / 2 - room.wallMargin);
  });

  it('never returns a floor point inside the sculpture', () => {
    stand(0, 3, 0, -1.1); // aimed at the floor near the plinth
    const hit = createPicker({ camera, targets }).pick(CENTRE);
    if (hit?.type === 'floor') {
      expect(Math.hypot(hit.point.x, hit.point.z)).toBeGreaterThanOrEqual(sculpture.radius - 1e-9);
    }
  });

  it('returns nothing when there is nothing to hit', () => {
    stand(0, 0, 0, 1.2); // looking at the ceiling, which is not a target
    expect(createPicker({ camera, targets }).pick(CENTRE)).toBeNull();
  });

  it('pickArtwork does not light up a work hidden behind the sculpture', () => {
    stand(0, 3, 0);
    expect(createPicker({ camera, targets }).pickArtwork(CENTRE)).toBeNull();
  });

  it('pickArtwork ignores the sculpture and the floor', () => {
    stand(0, 4, 0, -0.05); // squarely on the sculpture
    expect(createPicker({ camera, targets }).pickArtwork(CENTRE)).toBeNull();
  });
});
