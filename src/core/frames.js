/**
 * The hung works: frame, canvas and placard, built from the catalogue.
 *
 * Each artwork mesh carries its hanging in `userData` so the raycaster can hand a
 * hit straight back to the rest of the app without a lookup table.
 */

import {
  BoxGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  SRGBColorSpace,
} from 'three';

import { hangings } from '../data/gallery.js';
import { createPlacardTexture } from './textures.js';

const FRAME_WIDTH = 0.055;
const FRAME_DEPTH = 0.07;
const PLACARD_SIZE = { w: 0.26, h: 0.164 };
const PLACARD_HEIGHT = 1.08;

/**
 * @param {import('three').TextureLoader} loader
 * @returns {{ group: Group, targets: Mesh[] }} every mesh a visitor might aim at
 *   when they mean "that one" — canvas, frame and placard alike
 */
export function buildHangings(loader) {
  const group = new Group();
  group.name = 'hangings';
  const targets = [];

  for (const hanging of hangings) {
    const { work, position, normal } = hanging;
    const { w, h } = work.dimensions;

    const piece = new Group();
    piece.position.set(position.x, position.y, position.z);
    // Face into the room.
    piece.lookAt(position.x + normal.x, position.y, position.z + normal.z);

    // Frame: a shallow box slightly larger than the canvas.
    const frame = new Mesh(
      new BoxGeometry(w + FRAME_WIDTH * 2, h + FRAME_WIDTH * 2, FRAME_DEPTH),
      new MeshStandardMaterial({ color: '#2a2723', roughness: 0.55, metalness: 0.08 }),
    );
    frame.position.z = FRAME_DEPTH / 2;
    frame.castShadow = false;
    frame.receiveShadow = true;
    // Aiming at the frame edge means the same thing as aiming at the picture.
    frame.userData = { type: 'artwork', hanging };
    piece.add(frame);
    targets.push(frame);

    // The work itself, sitting just proud of the frame's face.
    const texture = loader.load(work.image);
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 4;

    const canvas = new Mesh(
      new PlaneGeometry(w, h),
      new MeshStandardMaterial({ map: texture, roughness: 0.88, metalness: 0 }),
    );
    canvas.position.z = FRAME_DEPTH + 0.001;
    canvas.userData = { type: 'artwork', hanging };
    canvas.name = `artwork:${work.slug}`;
    piece.add(canvas);
    targets.push(canvas);

    const placard = buildPlacard(hanging);
    piece.add(placard);
    targets.push(placard);
    group.add(piece);
  }

  return { group, targets };
}

/**
 * The card to the right of the work, at reading height. It hangs level with the
 * bottom third of the frame the way most galleries mount them.
 */
function buildPlacard(hanging) {
  const { work, position } = hanging;
  const placard = new Mesh(
    new PlaneGeometry(PLACARD_SIZE.w, PLACARD_SIZE.h),
    new MeshBasicMaterial({ map: createPlacardTexture(work), toneMapped: false }),
  );

  placard.position.set(
    work.dimensions.w / 2 + 0.24,
    PLACARD_HEIGHT - position.y,
    FRAME_DEPTH * 0.4,
  );
  placard.userData = { type: 'artwork', hanging };
  return placard;
}
