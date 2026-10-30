import { describe, expect, it } from 'vitest';
import {
  DARKNESS_PER_TICK,
  MAX_DARKNESS,
  cloudX,
  darknessFor,
} from '../src/features/night-sky.js';
import { CANVAS } from '../src/tuning.js';

describe('darknessFor', () => {
  it('is zero at tick 0 and below', () => {
    expect(darknessFor(0)).toBe(0);
    expect(darknessFor(-5)).toBe(0);
  });

  it('grows linearly with tick before the cap', () => {
    const a = darknessFor(600);
    const b = darknessFor(1200);
    expect(a).toBeCloseTo(600 * DARKNESS_PER_TICK, 10);
    expect(b).toBeCloseTo(2 * a, 10);
  });

  it('caps at MAX_DARKNESS once the ramp finishes', () => {
    const cap = MAX_DARKNESS / DARKNESS_PER_TICK;
    expect(darknessFor(cap)).toBeCloseTo(MAX_DARKNESS, 10);
    expect(darknessFor(cap * 10)).toBe(MAX_DARKNESS);
  });

  it('is strictly increasing over the ramp', () => {
    let last = -1;
    for (let tick = 0; tick < 5000; tick += 100) {
      const d = darknessFor(tick);
      expect(d).toBeGreaterThanOrEqual(last);
      last = d;
    }
  });
});

describe('cloudX', () => {
  const CLOUD_WIDTH = 44;

  it('wraps smoothly: starts off-screen left when a cloud has just left the right edge', () => {
    const period = CANVAS.width + CLOUD_WIDTH;
    // Pick a tick that places the cloud right at the end of its period.
    const atEnd = cloudX(0, 1, period - 1);
    const justAfter = cloudX(0, 1, period);
    expect(atEnd).toBeGreaterThan(CANVAS.width - 2);
    // After wrap, the cloud is back off-screen on the left.
    expect(justAfter).toBe(-CLOUD_WIDTH);
  });

  it('drifts right over time at the given speed', () => {
    const first = cloudX(100, 0.5, 0);
    const later = cloudX(100, 0.5, 50);
    expect(later).toBeGreaterThan(first);
    expect(later - first).toBeCloseTo(25, 10);
  });
});
