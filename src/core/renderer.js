/**
 * Renderer and camera setup, plus the resize handling.
 */

import { ACESFilmicToneMapping, PerspectiveCamera, SRGBColorSpace, WebGLRenderer } from 'three';

import { room } from '../data/gallery.js';

export function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl2') || canvas.getContext('webgl')),
    );
  } catch {
    return false;
  }
}

export function createRenderer(canvas) {
  const touch = window.matchMedia('(pointer: coarse)').matches;

  const renderer = new WebGLRenderer({
    canvas,
    antialias: !touch,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, touch ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;

  const camera = new PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 120);
  camera.rotation.order = 'YXZ';
  camera.position.set(0, room.eyeHeight, 0);

  const onResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    // A narrow phone screen needs a wider field of view or the room feels like a corridor.
    camera.fov = camera.aspect < 0.8 ? 72 : 58;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };

  window.addEventListener('resize', onResize);
  onResize();

  return { renderer, camera, onResize };
}
