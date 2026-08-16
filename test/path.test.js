import { describe, expect, it } from 'vitest';

import { planPath, pathLength } from '../src/camera/path.js';
import { sculpture } from '../src/data/gallery.js';

const distanceToCentre = (p) => Math.hypot(p.x, p.z);
const samples = (path, n = 200) =>
  Array.from({ length: n + 1 }, (_, i) => path.sample(i / n));

describe('planPath', () => {
  it('goes straight when the sculpture is not in the way', () => {
    const path = planPath({ x: -8, z: -4 }, { x: 8, z: -4 });
    expect(path.curved).toBe(false);
    const mid = path.sample(0.5);
    expect(mid.x).toBeCloseTo(0, 6);
    expect(mid.z).toBeCloseTo(-4, 6);
  });

  it('starts at `from` and ends at `to`', () => {
    const from = { x: -7, z: 3 };
    const to = { x: 6, z: -3 };
    const path = planPath(from, to);
    expect(path.sample(0)).toEqual(from);
    expect(path.sample(1)).toEqual(to);
  });

  it('curves when the straight line would pass through the sculpture', () => {
    const path = planPath({ x: -7, z: 0 }, { x: 7, z: 0 });
    expect(path.curved).toBe(true);
  });

  it('never enters the sculpture, whichever way it routes', () => {
    const crossings = [
      [{ x: -7, z: 0 }, { x: 7, z: 0 }],
      [{ x: 0, z: -4 }, { x: 0, z: 4 }],
      [{ x: -6, z: -3 }, { x: 6, z: 3 }],
      [{ x: -6, z: 3 }, { x: 6, z: -3 }],
      [{ x: -2, z: -2 }, { x: 2, z: 2 }],
      [{ x: -8, z: 0.4 }, { x: 8, z: -0.4 }],
    ];

    for (const [from, to] of crossings) {
      const path = planPath(from, to);
      for (const point of samples(path)) {
        expect(distanceToCentre(point)).toBeGreaterThanOrEqual(sculpture.radius - 1e-6);
      }
    }
  });

  it('rounds the near side, so the detour is the shorter one', () => {
    // A line that passes just north of centre should be pushed further north,
    // not dragged all the way around the south side.
    const path = planPath({ x: -7, z: -0.5 }, { x: 7, z: -0.5 });
    expect(path.sample(0.5).z).toBeLessThan(0);
  });

  it('stays inside the room when it detours', () => {
    const path = planPath({ x: -8, z: 0 }, { x: 8, z: 0 });
    for (const point of samples(path)) {
      expect(Math.abs(point.x)).toBeLessThanOrEqual(9.5 + 1e-6);
      expect(Math.abs(point.z)).toBeLessThanOrEqual(4.5 + 1e-6);
    }
  });

  it('is continuous — no jumps between neighbouring samples', () => {
    const path = planPath({ x: -7, z: 0 }, { x: 7, z: 0 });
    const pts = samples(path, 100);
    for (let i = 1; i < pts.length; i += 1) {
      const step = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z);
      expect(step).toBeLessThan(0.6);
    }
  });

  it('handles a zero-length path without producing NaN', () => {
    const path = planPath({ x: 3, z: 3 }, { x: 3, z: 3 });
    const mid = path.sample(0.5);
    expect(Number.isFinite(mid.x)).toBe(true);
    expect(Number.isFinite(mid.z)).toBe(true);
  });
});

describe('pathLength', () => {
  it('measures a straight run', () => {
    expect(pathLength(planPath({ x: -5, z: 4 }, { x: 5, z: 4 }))).toBeCloseTo(10, 1);
  });

  it('measures a detour as longer than the straight line it replaced', () => {
    const detour = pathLength(planPath({ x: -7, z: 0 }, { x: 7, z: 0 }));
    expect(detour).toBeGreaterThan(14);
    expect(detour).toBeLessThan(18);
  });
});
