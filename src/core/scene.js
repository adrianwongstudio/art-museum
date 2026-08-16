/**
 * Assembles the gallery: room, works, sculpture, lights — and hands back the
 * short list of meshes the raycaster needs to care about.
 */

import { Color, Fog, LoadingManager, Scene, TextureLoader } from 'three';

import { buildHangings } from './frames.js';
import { buildLighting } from './lighting.js';
import { buildRoom } from './room.js';
import { buildSculpture } from './sculpture.js';

export function buildScene({ onProgress } = {}) {
  const manager = new LoadingManager();
  if (onProgress) {
    manager.onProgress = (_url, loaded, total) => onProgress(total ? loaded / total : 1);
    manager.onLoad = () => onProgress(1);
  }

  const scene = new Scene();
  scene.background = new Color('#efece6');
  // Just enough haze to give the far end of the hall some depth.
  scene.fog = new Fog('#efece6', 22, 48);

  const room = buildRoom();
  scene.add(room);

  const loader = new TextureLoader(manager);
  const { group: hangingsGroup, targets: artworkTargets } = buildHangings(loader);
  scene.add(hangingsGroup);

  const { group: sculptureGroup, targets: sculptureTargets } = buildSculpture();
  scene.add(sculptureGroup);

  const lighting = buildLighting(scene);

  const floor = room.getObjectByName('floor');

  return {
    scene,
    manager,
    lighting,
    /** Meshes a click may usefully hit, in priority order. */
    targets: {
      artworks: artworkTargets,
      sculpture: sculptureTargets,
      floor: floor ? [floor] : [],
    },
  };
}
