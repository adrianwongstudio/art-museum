/**
 * The lighting rig: soft daylight fill from the skylights, a warm spot on each
 * work, and one shadow-casting key on the sculpture.
 *
 * Only the sculpture's light casts shadows. The wall spots light flat planes, so
 * a shadow map would cost frames and show nothing.
 */

import { AmbientLight, DirectionalLight, HemisphereLight, SpotLight } from 'three';

import { hangings, room, sculpture } from '../data/gallery.js';
import { viewingDistance } from '../camera/viewpoints.js';

export function buildLighting(scene) {
  scene.add(new HemisphereLight('#fff8ee', '#d6cbb6', 1.15));
  scene.add(new AmbientLight('#ffffff', 0.5));

  // Daylight through the skylights, angled so the room has a direction.
  const sun = new DirectionalLight('#fff3e0', 0.55);
  sun.position.set(-6, 12, 4);
  scene.add(sun);

  /** @type {Map<string, SpotLight>} */
  const spots = new Map();

  for (const hanging of hangings) {
    const { position, normal, work } = hanging;
    const standoff = Math.max(1.1, viewingDistance(work.dimensions.h) * 0.5);

    const spot = new SpotLight('#ffe9c9', 22, 9, Math.PI / 7, 0.55, 1.4);
    spot.position.set(
      position.x + normal.x * standoff,
      room.height - 0.55,
      position.z + normal.z * standoff,
    );
    spot.target.position.set(position.x, position.y + 0.1, position.z);

    scene.add(spot);
    scene.add(spot.target);
    spots.set(work.slug, spot);
  }

  // The sculpture gets the one shadow-casting light in the room.
  const key = new SpotLight('#fff1dc', 30, 12, Math.PI / 6, 0.6, 1.5);
  key.position.set(1.8, room.height - 0.4, 2.4);
  key.target.position.set(sculpture.position.x, sculpture.pedestal.height + 0.6, sculpture.position.z);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.bias = -0.0012;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 14;
  scene.add(key);
  scene.add(key.target);

  return {
    spots,
    /** Lift the spot on the work under the cursor, so hover reads in 3D as well as on the cursor. */
    highlight(slug) {
      for (const [key_, spot] of spots) {
        spot.intensity = key_ === slug ? 30 : 22;
      }
    },
  };
}
