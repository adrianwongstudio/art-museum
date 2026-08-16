/**
 * The papier-mâché figure in the middle of the room.
 *
 * The form is an icosphere pushed around by layered value noise, so it reads as
 * something built up by hand rather than something modelled. The noise is seeded
 * and deterministic: the sculpture is the same one on every visit.
 */

import {
  CylinderGeometry,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
} from 'three';

import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import { sculpture as spec } from '../data/gallery.js';
import { getWork } from '../data/works.js';
import { createContactShadowTexture, createPaperTexture } from './textures.js';

/** Cheap deterministic noise — three offset sine layers is plenty for a lumpy surface. */
function noise3(x, y, z) {
  return (
    Math.sin(x * 1.7 + y * 2.3 + z * 1.1) * 0.5 +
    Math.sin(x * 3.9 - y * 1.3 + z * 2.7) * 0.3 +
    Math.sin(x * 7.1 + y * 5.7 - z * 4.3) * 0.2
  );
}

function lumpyForm(radius, detail, strength, squash) {
  const geometry = new IcosahedronGeometry(radius, detail);
  const positions = geometry.attributes.position;

  for (let i = 0; i < positions.count; i += 1) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);
    const length = Math.hypot(x, y, z) || 1;
    // A coarse layer for the form, a fine one for the ridges where torn paper
    // overlaps.
    const displaced =
      1 + noise3(x * 1.4, y * 1.4, z * 1.4) * strength + noise3(x * 6.5, y * 6.5, z * 6.5) * strength * 0.22;

    positions.setXYZ(
      i,
      (x / length) * radius * displaced,
      (y / length) * radius * displaced * squash,
      (z / length) * radius * displaced,
    );
  }

  // IcosahedronGeometry arrives unindexed, which shades every triangle flat and
  // makes a hand-built form look like a cut gem. Welding the seams first gives
  // the smooth, slightly lumpy surface papier-mâché actually has.
  const welded = mergeVertices(geometry, 1e-4);
  welded.computeVertexNormals();
  geometry.dispose();
  return welded;
}

export function buildSculpture() {
  const group = new Group();
  group.name = 'sculpture';
  group.position.set(spec.position.x, spec.position.y, spec.position.z);

  const work = getWork(spec.workId);
  const height = work?.dimensions.h ?? 1.3;
  const paper = createPaperTexture();

  // Pedestal
  const pedestal = new Mesh(
    new CylinderGeometry(spec.pedestal.radius, spec.pedestal.radius * 1.03, spec.pedestal.height, 48),
    new MeshStandardMaterial({ color: '#f4f2ee', roughness: 0.9 }),
  );
  pedestal.position.y = spec.pedestal.height / 2;
  pedestal.receiveShadow = true;
  pedestal.castShadow = true;
  // The plinth is part of "that one" as far as a visitor pointing at it is concerned.
  pedestal.userData = { type: 'sculpture' };
  group.add(pedestal);

  const material = new MeshStandardMaterial({
    map: paper,
    bumpMap: paper,
    bumpScale: 3.5,
    color: '#e3d7c4',
    roughness: 0.98,
    metalness: 0,
  });

  // Main mass. The catalogue lists this work at 1.35 m, so it is 1.35 m.
  const body = new Mesh(lumpyForm(height * 0.33, 5, 0.19, 1.15), material);
  body.position.y = spec.pedestal.height + height * 0.36;
  body.scale.set(1.06, 1, 0.84); // hand-built, so not a solid of revolution
  body.rotation.y = 0.7;
  body.castShadow = true;
  body.receiveShadow = true;
  body.userData = { type: 'sculpture' };
  group.add(body);

  // A second, smaller lobe leaning off the first — the form that has not decided
  // what kind of body it is yet.
  const lobe = new Mesh(lumpyForm(height * 0.2, 4, 0.22, 1.05), material);
  lobe.position.set(0.31, spec.pedestal.height + height * 0.64, -0.13);
  lobe.rotation.set(0.3, 0.8, 0.45);
  lobe.scale.set(1, 0.86, 0.9);
  lobe.castShadow = true;
  lobe.userData = { type: 'sculpture' };
  group.add(lobe);

  // A low foot so the body does not appear to float on the pedestal.
  const foot = new Mesh(lumpyForm(height * 0.17, 3, 0.1, 0.45), material);
  foot.position.y = spec.pedestal.height + height * 0.1;
  foot.castShadow = true;
  foot.userData = { type: 'sculpture' };
  group.add(foot);

  // Painted contact shadow under the pedestal — a soft round pool, not a square.
  const contact = new Mesh(
    new PlaneGeometry(spec.pedestal.radius * 3.6, spec.pedestal.radius * 3.6),
    new MeshBasicMaterial({
      map: createContactShadowTexture(),
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    }),
  );
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = 0.005;
  group.add(contact);

  return { group, targets: [body, lobe, foot, pedestal] };
}
