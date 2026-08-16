/**
 * Assembles the gallery: room, works, sculpture, lights — and hands back the
 * short list of meshes the raycaster needs to care about, plus the one function
 * that repaints the whole hall for a theme.
 */

import { Color, Fog, LoadingManager, Scene, TextureLoader } from 'three';

import { buildHangings } from './frames.js';
import { buildLighting } from './lighting.js';
import { buildRoom } from './room.js';
import { buildSculpture } from './sculpture.js';
import { paletteFor } from './palette.js';

export function buildScene({ onProgress, theme = 'light' } = {}) {
  const manager = new LoadingManager();
  if (onProgress) {
    manager.onProgress = (_url, loaded, total) => onProgress(total ? loaded / total : 1);
    manager.onLoad = () => onProgress(1);
  }

  const scene = new Scene();
  // Just enough haze to give the far end of the hall some depth.
  scene.fog = new Fog('#efece6', 22, 48);

  const room = buildRoom();
  scene.add(room.group);

  const loader = new TextureLoader(manager);
  const hangings = buildHangings(loader);
  scene.add(hangings.group);

  const sculpture = buildSculpture();
  scene.add(sculpture.group);

  const lighting = buildLighting(scene);

  const materials = { ...room.materials, ...hangings.materials, ...sculpture.materials };

  /**
   * Repaint the hall. Every surface that carries the theme is a material this
   * module already holds, so switching is assignment rather than a rebuild —
   * which is what lets it happen without a flicker mid-walk.
   */
  function applyTheme(name) {
    const palette = paletteFor(name);

    scene.background = new Color(palette.background);
    scene.fog.color = new Color(palette.fog.color);
    scene.fog.near = palette.fog.near;
    scene.fog.far = palette.fog.far;

    const paint = (key, colour) => {
      if (materials[key] && colour) materials[key].color = new Color(colour);
    };

    paint('walls', palette.walls);
    paint('skirting', palette.skirting);
    paint('ceiling', palette.ceiling);
    paint('skylight', palette.skylight);
    paint('floor', palette.floorTint);
    paint('vestibuleFloor', palette.vestibuleFloor);
    paint('vestibuleWalls', palette.vestibuleWalls);
    paint('vestibuleCeiling', palette.vestibuleCeiling);
    paint('frame', palette.frame);
    paint('pedestal', palette.pedestal);
    paint('sculpture', palette.sculpture);
    paint('benchWood', palette.benchWood);
    paint('benchLegs', palette.benchLegs);

    materials.ceiling.emissive = new Color(palette.ceilingEmissive);
    materials.ceiling.emissiveIntensity = palette.ceilingEmissiveIntensity;

    // Contact shadows are painted, so they have to deepen with the room.
    materials.sculptureShadow.opacity = palette.contactShadow;
    materials.benchShadow.opacity = palette.contactShadow * 0.84;

    lighting.applyTheme(name);
  }

  applyTheme(theme);

  const floor = room.group.getObjectByName('floor');

  return {
    scene,
    manager,
    lighting,
    applyTheme,
    /** Meshes a click may usefully hit. */
    targets: {
      artworks: hangings.targets,
      sculpture: sculpture.targets,
      floor: floor ? [floor] : [],
    },
  };
}
