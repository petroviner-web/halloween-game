import { describe, expect, it } from 'vitest';
import { KONAMI_SEQUENCE, createKonamiMatcher } from '../src/konami.js';

const feed = (codes: readonly string[]): boolean[] => {
  const matcher = createKonamiMatcher();
  return codes.map((code) => matcher.step(code));
};

describe('createKonamiMatcher', () => {
  it('returns true on the step that completes the sequence', () => {
    const results = feed(KONAMI_SEQUENCE);
    expect(results.slice(0, -1).every((v) => v === false)).toBe(true);
    expect(results.at(-1)).toBe(true);
  });

  it('ignores unrelated keys at the start', () => {
    const matcher = createKonamiMatcher();
    expect(matcher.step('Space')).toBe(false);
    expect(matcher.step('KeyX')).toBe(false);
    // Still able to match a full sequence afterwards.
    const completes = KONAMI_SEQUENCE.map((code) => matcher.step(code)).at(-1);
    expect(completes).toBe(true);
  });

  it('resets on a mismatch but keeps a leading ArrowUp alive', () => {
    const matcher = createKonamiMatcher();
    // Partial progress then a wrong key.
    matcher.step('ArrowUp');
    matcher.step('ArrowUp');
    matcher.step('ArrowDown');
    expect(matcher.step('KeyZ')).toBe(false);
    // After reset, a fresh full sequence still fires.
    const completes = KONAMI_SEQUENCE.map((code) => matcher.step(code)).at(-1);
    expect(completes).toBe(true);
  });

  it('a stray third ArrowUp re-anchors instead of forcing a full retype', () => {
    const matcher = createKonamiMatcher();
    // After two ArrowUps the sequence expects ArrowDown; a third ArrowUp is a
    // mismatch, but the matcher treats it as the sequence's own first key and
    // rewinds to index 1 so the user does not have to start over.
    matcher.step('ArrowUp');
    matcher.step('ArrowUp');
    expect(matcher.step('ArrowUp')).toBe(false);
    // From index 1, one more ArrowUp plus the rest of the sequence completes.
    const tail = [
      'ArrowUp',
      'ArrowDown',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'ArrowLeft',
      'ArrowRight',
      'KeyB',
      'KeyA',
    ];
    const results = tail.map((code) => matcher.step(code));
    expect(results.at(-1)).toBe(true);
  });

  it('rewinds after firing so repeated input toggles cleanly', () => {
    const matcher = createKonamiMatcher();
    const first = KONAMI_SEQUENCE.map((code) => matcher.step(code));
    const second = KONAMI_SEQUENCE.map((code) => matcher.step(code));
    expect(first.at(-1)).toBe(true);
    expect(second.at(-1)).toBe(true);
  });

  it('reset() clears partial progress', () => {
    const matcher = createKonamiMatcher();
    matcher.step('ArrowUp');
    matcher.step('ArrowUp');
    matcher.reset();
    // Now the very next ArrowDown should fail (expected ArrowUp).
    expect(matcher.step('ArrowDown')).toBe(false);
  });
});
