// Pure Konami-code sequence matcher. No DOM.
// Fed `KeyboardEvent.code` values; returns true the moment the sequence completes.

export const KONAMI_SEQUENCE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'KeyB',
  'KeyA',
] as const;

export interface KonamiMatcher {
  /** True on the step that completes the sequence; the matcher then rewinds. */
  step(code: string): boolean;
  reset(): void;
}

export function createKonamiMatcher(): KonamiMatcher {
  let index = 0;
  return {
    step(code) {
      if (code === KONAMI_SEQUENCE[index]) {
        index += 1;
        if (index === KONAMI_SEQUENCE.length) {
          index = 0;
          return true;
        }
        return false;
      }
      // Mismatch: if the current code happens to be the first element, start a
      // fresh run at position 1 so a stray key does not force the user to retype.
      index = code === KONAMI_SEQUENCE[0] ? 1 : 0;
      return false;
    },
    reset() {
      index = 0;
    },
  };
}
