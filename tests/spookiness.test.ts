import { describe, expect, it } from 'vitest';
import {
  SHAKE_AMPLITUDE,
  SHAKE_FRAMES,
  shakeOffset,
} from '../src/features/spookiness.js';

describe('shakeOffset', () => {
  it('is a no-op before the shake starts and after it ends', () => {
    expect(shakeOffset(-1)).toEqual({ x: 0, y: 0 });
    expect(shakeOffset(SHAKE_FRAMES)).toEqual({ x: 0, y: 0 });
    expect(shakeOffset(SHAKE_FRAMES + 10)).toEqual({ x: 0, y: 0 });
  });

  it('starts at full amplitude and decays to zero over SHAKE_FRAMES', () => {
    // At elapsed = 0 the x component is sin(0) * SHAKE_AMPLITUDE = 0, but the
    // y component is cos(0) * 0.6 * SHAKE_AMPLITUDE at its full magnitude.
    const start = shakeOffset(0);
    expect(Math.abs(start.y)).toBeCloseTo(SHAKE_AMPLITUDE * 0.6, 10);
    // One frame before the shake ends the amplitude is tiny.
    const late = shakeOffset(SHAKE_FRAMES - 1);
    expect(Math.hypot(late.x, late.y)).toBeLessThan(SHAKE_AMPLITUDE * 0.1);
  });

  it('is deterministic (no randomness)', () => {
    for (let i = 0; i < SHAKE_FRAMES; i += 1) {
      expect(shakeOffset(i)).toEqual(shakeOffset(i));
    }
  });
});
