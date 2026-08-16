import { describe, expect, it } from 'vitest';

import {
  bobAt,
  easeInOutCubic,
  facingWeight,
  lerpAngle,
  shortestAngleDelta,
  smoothstep,
  travelDuration,
} from '../src/camera/travel.js';

describe('easeInOutCubic', () => {
  it('pins both ends', () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
  });

  it('is symmetrical around the midpoint', () => {
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 6);
    expect(easeInOutCubic(0.25) + easeInOutCubic(0.75)).toBeCloseTo(1, 6);
  });

  it('starts and ends slower than the middle', () => {
    expect(easeInOutCubic(0.1)).toBeLessThan(0.1);
    expect(easeInOutCubic(0.9)).toBeGreaterThan(0.9);
  });

  it('never leaves the unit range, even for out-of-range input', () => {
    expect(easeInOutCubic(-1)).toBe(0);
    expect(easeInOutCubic(2)).toBe(1);
  });
});

describe('travelDuration', () => {
  it('always takes about three seconds to walk to a work', () => {
    expect(travelDuration({ kind: 'artwork', distance: 3 })).toBe(3);
    expect(travelDuration({ kind: 'artwork', distance: 18 })).toBe(3);
  });

  it('scales floor travel with distance', () => {
    expect(travelDuration({ kind: 'floor', distance: 4.4 })).toBeCloseTo(2, 6);
  });

  it('clamps floor travel to a sensible window', () => {
    expect(travelDuration({ kind: 'floor', distance: 0.2 })).toBe(1.2);
    expect(travelDuration({ kind: 'floor', distance: 40 })).toBe(3);
  });

  it('uses a fixed walk-in for the entrance', () => {
    expect(travelDuration({ kind: 'entrance', distance: 12 })).toBe(2.5);
  });

  it('collapses to a near-cut when the visitor prefers reduced motion', () => {
    expect(travelDuration({ kind: 'artwork', distance: 12, reducedMotion: true })).toBe(0.4);
    expect(travelDuration({ kind: 'floor', distance: 12, reducedMotion: true })).toBe(0.4);
  });
});

describe('facingWeight', () => {
  it('looks where it is going for the first part of the walk', () => {
    expect(facingWeight(0)).toBe(0);
    expect(facingWeight(0.45)).toBe(0);
  });

  it('has fully turned to the work on arrival', () => {
    expect(facingWeight(1)).toBe(1);
  });

  it('turns gradually over the back half', () => {
    const early = facingWeight(0.6);
    const late = facingWeight(0.85);
    expect(early).toBeGreaterThan(0);
    expect(early).toBeLessThan(late);
    expect(late).toBeLessThan(1);
  });
});

describe('smoothstep', () => {
  it('clamps outside its edges', () => {
    expect(smoothstep(0.2, 0.8, 0)).toBe(0);
    expect(smoothstep(0.2, 0.8, 1)).toBe(1);
  });

  it('is one half at the midpoint', () => {
    expect(smoothstep(0, 1, 0.5)).toBeCloseTo(0.5, 6);
  });

  it('returns a hard step when the edges coincide', () => {
    expect(smoothstep(0.5, 0.5, 0.4)).toBe(0);
    expect(smoothstep(0.5, 0.5, 0.6)).toBe(1);
  });
});

describe('angle helpers', () => {
  it('takes the short way around the circle', () => {
    expect(shortestAngleDelta(3, -3)).toBeCloseTo(2 * Math.PI - 6, 6);
    expect(shortestAngleDelta(0, Math.PI / 2)).toBeCloseTo(Math.PI / 2, 6);
  });

  it('interpolates the short way too', () => {
    const mid = lerpAngle(3, -3, 0.5);
    expect(Math.abs(Math.sin(mid) - Math.sin(Math.PI))).toBeLessThan(1e-6);
  });

  it('returns the endpoints exactly', () => {
    expect(lerpAngle(1, 2, 0)).toBeCloseTo(1, 6);
    expect(lerpAngle(1, 2, 1)).toBeCloseTo(2, 6);
  });
});

describe('bobAt', () => {
  const duration = 3;

  it('is still at both ends of the walk', () => {
    expect(bobAt(0, duration).y).toBeCloseTo(0, 6);
    expect(bobAt(1, duration).y).toBeCloseTo(0, 6);
    expect(bobAt(0, duration).roll).toBeCloseTo(0, 6);
    expect(bobAt(1, duration).roll).toBeCloseTo(0, 6);
  });

  it('stays within a few centimetres', () => {
    for (let t = 0; t <= 1; t += 0.01) {
      expect(Math.abs(bobAt(t, duration).y)).toBeLessThanOrEqual(0.036);
    }
  });

  it('actually moves somewhere in the middle', () => {
    const peak = Math.max(
      ...Array.from({ length: 101 }, (_, i) => Math.abs(bobAt(i / 100, duration).y)),
    );
    expect(peak).toBeGreaterThan(0.02);
  });

  it('is switched off for reduced motion', () => {
    expect(bobAt(0.5, duration, { enabled: false }).y).toBe(0);
  });
});
