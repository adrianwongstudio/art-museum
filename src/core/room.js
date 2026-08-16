/**
 * The hall itself: floor, ceiling, four walls with a doorway cut into the west
 * one, skirting, a bench, and the small vestibule you walk in from.
 *
 * The doorway is made by building the west wall from three pieces rather than by
 * cutting a hole — three boxes are cheaper and more predictable than CSG.
 */

import {
  BoxGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
} from 'three';

import { room } from '../data/gallery.js';
import { createContactShadowTexture, createFloorTexture } from './textures.js';

const THICKNESS = 0.3;

function wallMaterial() {
  return new MeshStandardMaterial({ roughness: 0.96, metalness: 0 });
}

function box(width, height, depth, material, position) {
  const mesh = new Mesh(new BoxGeometry(width, height, depth), material);
  mesh.position.set(position.x, position.y, position.z);
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * @returns {{ group: Group, materials: Record<string, any> }} the materials are
 *   handed back so the theme can repaint the hall without rebuilding it
 */
export function buildRoom() {
  const group = new Group();
  group.name = 'room';

  const halfW = room.width / 2;
  const halfD = room.depth / 2;
  const walls = wallMaterial();

  // Floor
  const floorMaterial = new MeshStandardMaterial({
    map: createFloorTexture(),
    roughness: 0.72,
    metalness: 0,
  });
  const floor = new Mesh(new PlaneGeometry(room.width, room.depth), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  floor.name = 'floor';
  group.add(floor);

  // Ceiling
  const ceilingMaterial = new MeshStandardMaterial({ roughness: 1 });
  const ceiling = new Mesh(new PlaneGeometry(room.width, room.depth), ceilingMaterial);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = room.height;
  group.add(ceiling);

  // Skylight strips — they read as the source of the fill light.
  const skylight = new MeshBasicMaterial();
  for (const z of [-2.6, 0, 2.6]) {
    const strip = new Mesh(new PlaneGeometry(room.width - 4, 0.9), skylight);
    strip.rotation.x = Math.PI / 2;
    strip.position.set(0, room.height - 0.02, z);
    group.add(strip);
  }

  // North and south walls
  group.add(box(room.width, room.height, THICKNESS, walls, { x: 0, y: room.height / 2, z: -halfD - THICKNESS / 2 }));
  group.add(box(room.width, room.height, THICKNESS, walls, { x: 0, y: room.height / 2, z: halfD + THICKNESS / 2 }));

  // East wall
  group.add(box(THICKNESS, room.height, room.depth, walls, { x: halfW + THICKNESS / 2, y: room.height / 2, z: 0 }));

  // West wall, in three pieces around the doorway
  const { width: doorW, height: doorH, center: doorZ } = room.doorway;
  const sidePanel = (room.depth - doorW) / 2;
  const westX = -halfW - THICKNESS / 2;
  group.add(
    box(THICKNESS, room.height, sidePanel, walls, {
      x: westX,
      y: room.height / 2,
      z: doorZ - doorW / 2 - sidePanel / 2,
    }),
  );
  group.add(
    box(THICKNESS, room.height, sidePanel, walls, {
      x: westX,
      y: room.height / 2,
      z: doorZ + doorW / 2 + sidePanel / 2,
    }),
  );
  group.add(
    box(THICKNESS, room.height - doorH, doorW, walls, {
      x: westX,
      y: doorH + (room.height - doorH) / 2,
      z: doorZ,
    }),
  );

  // Skirting board around the hall
  const skirtMaterial = new MeshStandardMaterial({ roughness: 0.85 });
  const skirtH = 0.12;
  group.add(box(room.width, skirtH, 0.04, skirtMaterial, { x: 0, y: skirtH / 2, z: -halfD + 0.02 }));
  group.add(box(room.width, skirtH, 0.04, skirtMaterial, { x: 0, y: skirtH / 2, z: halfD - 0.02 }));
  group.add(box(0.04, skirtH, room.depth, skirtMaterial, { x: halfW - 0.02, y: skirtH / 2, z: 0 }));

  const vestibule = buildVestibule(westX);
  group.add(vestibule.group);

  const bench = buildBench();
  group.add(bench.group);

  return {
    group,
    materials: {
      walls,
      floor: floorMaterial,
      ceiling: ceilingMaterial,
      skylight,
      skirting: skirtMaterial,
      ...vestibule.materials,
      ...bench.materials,
    },
  };
}

/**
 * A short anteroom outside the doorway. The entrance walk starts here, so there
 * has to be somewhere to start from.
 */
function buildVestibule(westX) {
  const group = new Group();
  group.name = 'vestibule';
  const depth = 4;
  const width = 5;
  const outerX = westX - depth;

  const floorMaterial = new MeshStandardMaterial({ roughness: 0.9 });
  const floor = new Mesh(new PlaneGeometry(depth, width), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(westX - depth / 2, 0.001, room.doorway.center);
  group.add(floor);

  const material = new MeshStandardMaterial({ roughness: 0.97 });
  group.add(box(depth, room.height, 0.2, material, { x: westX - depth / 2, y: room.height / 2, z: room.doorway.center - width / 2 }));
  group.add(box(depth, room.height, 0.2, material, { x: westX - depth / 2, y: room.height / 2, z: room.doorway.center + width / 2 }));
  group.add(box(0.2, room.height, width, material, { x: outerX, y: room.height / 2, z: room.doorway.center }));

  const ceilingMaterial = new MeshStandardMaterial({ roughness: 1 });
  const ceiling = new Mesh(new PlaneGeometry(depth, width), ceilingMaterial);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(westX - depth / 2, room.height, room.doorway.center);
  group.add(ceiling);

  return {
    group,
    materials: {
      vestibuleFloor: floorMaterial,
      vestibuleWalls: material,
      vestibuleCeiling: ceilingMaterial,
    },
  };
}

/** A bench near the entrance, for looking at the sculpture from. */
function buildBench() {
  const group = new Group();
  group.name = 'bench';

  const wood = new MeshStandardMaterial({ roughness: 0.6 });
  const seat = box(0.5, 0.09, 2.2, wood, { x: -6.4, y: 0.45, z: 0 });
  seat.castShadow = true;
  group.add(seat);

  const legs = new MeshStandardMaterial({ roughness: 0.5, metalness: 0.4 });
  for (const z of [-0.85, 0.85]) {
    group.add(box(0.4, 0.41, 0.06, legs, { x: -6.4, y: 0.225, z }));
  }

  // Painted contact shadow, so the bench sits on the floor without a shadow map.
  const shadowMaterial = new MeshBasicMaterial({
    map: createContactShadowTexture(),
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  });
  const shadow = new Mesh(new PlaneGeometry(1.5, 3.2), shadowMaterial);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(-6.4, 0.006, 0);
  group.add(shadow);

  return {
    group,
    materials: { benchWood: wood, benchLegs: legs, benchShadow: shadowMaterial },
  };
}
