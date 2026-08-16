import { describe, expect, it } from 'vitest';

import { clampToRoom, clampToWalls, pushOutOfSculpture } from '../src/camera/bounds.js';
import { room, sculpture } from '../src/data/gallery.js';

const maxX = room.width / 2 - room.wallMargin; // 9.5
const maxZ = room.depth / 2 - room.wallMargin; // 4.5

describe('clampToWalls', () => {
  it('leaves a position that is already inside untouched', () => {
    expect(clampToWalls({ x: 3, z: -1 })).toEqual({ x: 3, z: -1 });
  });

  it('clamps past each wall to the margin', () => {
    expect(clampToWalls({ x: 50, z: 0 }).x).toBe(maxX);
    expect(clampToWalls({ x: -50, z: 0 }).x).toBe(-maxX);
    expect(clampToWalls({ x: 0, z: 50 }).z).toBe(maxZ);
    expect(clampToWalls({ x: 0, z: -50 }).z).toBe(-maxZ);
  });

  it('clamps both axes at once in a corner', () => {
    expect(clampToWalls({ x: 99, z: -99 })).toEqual({ x: maxX, z: -maxZ });
  });

  it('does not mutate its argument', () => {
    const input = { x: 99, z: 0 };
    clampToWalls(input);
    expect(input).toEqual({ x: 99, z: 0 });
  });
});

describe('pushOutOfSculpture', () => {
  it('leaves positions outside the sculpture radius untouched', () => {
    const outside = { x: 4, z: 0 };
    expect(pushOutOfSculpture(outside)).toEqual(outside);
  });

  it('pushes a position inside the radius out to the radius, keeping its direction', () => {
    const pushed = pushOutOfSculpture({ x: 0.5, z: 0 });
    expect(pushed.x).toBeCloseTo(sculpture.radius, 6);
    expect(pushed.z).toBeCloseTo(0, 6);
  });

  it('keeps the angle of approach when pushing out', () => {
    const pushed = pushOutOfSculpture({ x: 0.3, z: 0.4 }); // direction (0.6, 0.8)
    expect(Math.hypot(pushed.x, pushed.z)).toBeCloseTo(sculpture.radius, 6);
    expect(pushed.x / pushed.z).toBeCloseTo(0.75, 6);
  });

  it('picks a deterministic direction when standing exactly at the centre', () => {
    const pushed = pushOutOfSculpture({ x: 0, z: 0 });
    expect(Math.hypot(pushed.x, pushed.z)).toBeCloseTo(sculpture.radius, 6);
  });
});

describe('clampToRoom', () => {
  it('applies both constraints', () => {
    const result = clampToRoom({ x: 0.2, z: 0 });
    expect(Math.hypot(result.x, result.z)).toBeCloseTo(sculpture.radius, 6);

    const cornered = clampToRoom({ x: 100, z: 100 });
    expect(cornered).toEqual({ x: maxX, z: maxZ });
  });

  it('never returns a point inside the sculpture or outside the walls', () => {
    for (let x = -12; x <= 12; x += 0.7) {
      for (let z = -7; z <= 7; z += 0.7) {
        const p = clampToRoom({ x, z });
        expect(Math.abs(p.x)).toBeLessThanOrEqual(maxX + 1e-9);
        expect(Math.abs(p.z)).toBeLessThanOrEqual(maxZ + 1e-9);
        expect(Math.hypot(p.x, p.z)).toBeGreaterThanOrEqual(sculpture.radius - 1e-9);
      }
    }
  });
});
