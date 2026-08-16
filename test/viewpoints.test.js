import { describe, expect, it } from 'vitest';

import {
  viewingDistance,
  viewpointForHanging,
  viewpointForSculpture,
  yawTo,
  pitchTo,
} from '../src/camera/viewpoints.js';
import { hangings, room, sculpture, walls } from '../src/data/gallery.js';
import { getWork } from '../src/data/works.js';

const hangingOn = (wall) => hangings.find((h) => h.wall === wall);

describe('viewingDistance', () => {
  it('scales with the height of the work', () => {
    expect(viewingDistance(1.5)).toBeCloseTo(2.4, 6);
  });

  it('never gets closer than two metres', () => {
    expect(viewingDistance(0.5)).toBe(2);
    expect(viewingDistance(0.65)).toBe(2);
  });

  it('never gets further than four metres', () => {
    expect(viewingDistance(9)).toBe(4);
  });
});

describe('yawTo / pitchTo', () => {
  // Yaw 0 faces -z, which is how a Three.js camera with no rotation points.
  it('gives yaw 0 when looking toward -z', () => {
    expect(yawTo({ x: 0, z: 0 }, { x: 0, z: -5 })).toBeCloseTo(0, 6);
  });

  it('gives +pi/2 when looking toward -x', () => {
    expect(yawTo({ x: 0, z: 0 }, { x: -5, z: 0 })).toBeCloseTo(Math.PI / 2, 6);
  });

  it('gives -pi/2 when looking toward +x', () => {
    expect(yawTo({ x: 0, z: 0 }, { x: 5, z: 0 })).toBeCloseTo(-Math.PI / 2, 6);
  });

  it('tilts down slightly for a target below eye level', () => {
    const pitch = pitchTo({ x: 0, y: 1.6, z: 0 }, { x: 0, y: 1.0, z: -3 });
    expect(pitch).toBeLessThan(0);
    expect(pitch).toBeGreaterThan(-Math.PI / 2);
  });
});

describe('viewpointForHanging', () => {
  it('stands out from the wall along its normal, at eye height', () => {
    const hanging = hangingOn('north');
    const vp = viewpointForHanging(hanging);
    const distance = viewingDistance(hanging.work.dimensions.h);

    expect(vp.position.y).toBe(room.eyeHeight);
    expect(vp.position.x).toBeCloseTo(hanging.position.x, 6);
    expect(vp.position.z).toBeCloseTo(walls.north.fixed + distance, 6);
  });

  it('faces the work squarely from every wall', () => {
    // Standing in front of the east wall means facing +x, which is yaw -pi/2.
    const expected = { north: 0, south: Math.PI, east: -Math.PI / 2 };
    for (const wall of ['north', 'south', 'east']) {
      const hanging = hangingOn(wall);
      const vp = viewpointForHanging(hanging);
      expect(Math.abs(Math.cos(vp.yaw) - Math.cos(expected[wall]))).toBeLessThan(1e-6);
      expect(Math.abs(Math.sin(vp.yaw) - Math.sin(expected[wall]))).toBeLessThan(1e-6);
    }
  });

  it('aims at the centre of the work', () => {
    const hanging = hangingOn('east');
    const vp = viewpointForHanging(hanging);
    expect(vp.target).toEqual(hanging.position);
  });

  it('keeps every viewpoint inside the room and clear of the sculpture', () => {
    for (const hanging of hangings) {
      const { position } = viewpointForHanging(hanging);
      expect(Math.abs(position.x)).toBeLessThanOrEqual(room.width / 2 - room.wallMargin);
      expect(Math.abs(position.z)).toBeLessThanOrEqual(room.depth / 2 - room.wallMargin);
      expect(Math.hypot(position.x, position.z)).toBeGreaterThan(sculpture.radius);
    }
  });
});

describe('viewpointForSculpture', () => {
  it('stands on the same side as the visitor already is', () => {
    const vp = viewpointForSculpture({ x: 5, z: 0 });
    expect(vp.position.x).toBeCloseTo(sculpture.viewDistance, 6);
    expect(vp.position.z).toBeCloseTo(0, 6);
    expect(vp.position.y).toBe(room.eyeHeight);
  });

  it('faces back toward the centre of the room', () => {
    const vp = viewpointForSculpture({ x: 0, z: 6 });
    expect(Math.abs(Math.sin(vp.yaw) - Math.sin(Math.PI)) < 1e-6).toBe(true);
    expect(vp.target.x).toBe(0);
    expect(vp.target.z).toBe(0);
  });

  it('aims at the middle of the sculpture, above the pedestal', () => {
    const work = getWork(sculpture.workId);
    const vp = viewpointForSculpture({ x: 4, z: 4 });
    expect(vp.target.y).toBeCloseTo(sculpture.pedestal.height + work.dimensions.h / 2, 6);
  });

  it('falls back to a stable direction from the exact centre', () => {
    const vp = viewpointForSculpture({ x: 0, z: 0 });
    expect(Math.hypot(vp.position.x, vp.position.z)).toBeCloseTo(sculpture.viewDistance, 6);
  });
});
