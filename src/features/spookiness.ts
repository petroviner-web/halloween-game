// Event reactions for the Halloween edition: a screen shake on death and a
// brief "BOO!" pop on every milestone. Both tick on render frames, so they
// keep playing while the simulation is frozen on game-over.

import type { CameraOffset, Renderer } from '../render.js';
import { CANVAS, HUD, PALETTE } from '../tuning.js';
import type { Game, LayerDraw } from '../types.js';

export interface SpookyDeps {
  readonly game: Pick<Game, 'on'>;
  readonly renderer: Pick<Renderer, 'addLayer' | 'setCamera'>;
}

/** Render frames the shake lasts. */
export const SHAKE_FRAMES = 24;
/** Peak amplitude of the shake in logical px. */
export const SHAKE_AMPLITUDE = 6;
/** Render frames the BOO banner stays up. */
export const BOO_FRAMES = 40;

/**
 * Pure function: camera offset for a shake that started `elapsed` frames ago.
 * Returns {0, 0} once the shake has finished. Deterministic (no `Math.random`).
 */
export function shakeOffset(elapsed: number): CameraOffset {
  if (elapsed < 0 || elapsed >= SHAKE_FRAMES) return { x: 0, y: 0 };
  const decay = 1 - elapsed / SHAKE_FRAMES;
  const amp = SHAKE_AMPLITUDE * decay;
  return {
    x: Math.sin(elapsed * 1.7) * amp,
    y: Math.cos(elapsed * 2.3) * amp * 0.6,
  };
}

export function installSpookiness({ game, renderer }: SpookyDeps): () => void {
  // Remaining render frames for each effect. The event fires in game.frame(),
  // which runs before renderer.draw() in the browser loop, so the counter is
  // already set when the first frame of the effect is drawn.
  let shakeFramesLeft = 0;
  let booFramesLeft = 0;
  let booScore = 0;

  renderer.setCamera(() => {
    if (shakeFramesLeft <= 0) return { x: 0, y: 0 };
    const elapsed = SHAKE_FRAMES - shakeFramesLeft;
    const offset = shakeOffset(elapsed);
    shakeFramesLeft -= 1;
    return offset;
  });

  const drawBoo: LayerDraw = (ctx) => {
    if (booFramesLeft <= 0) return;
    const elapsed = BOO_FRAMES - booFramesLeft;
    ctx.save();
    ctx.globalAlpha = 1 - elapsed / BOO_FRAMES;
    ctx.fillStyle = PALETTE.accent;
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      `BOO! ${String(booScore)}`,
      HUD.centreX,
      CANVAS.height / 2 - 70,
    );
    ctx.restore();
    booFramesLeft -= 1;
  };
  const removeLayer = renderer.addLayer('foreground', drawBoo);

  const offDie = game.on('die', () => {
    shakeFramesLeft = SHAKE_FRAMES;
  });
  const offMilestone = game.on('milestone', (event) => {
    booScore = event.score;
    booFramesLeft = BOO_FRAMES;
  });
  const reset = (): void => {
    shakeFramesLeft = 0;
    booFramesLeft = 0;
  };
  const offStart = game.on('start', reset);
  const offRestart = game.on('restart', reset);

  return () => {
    offDie();
    offMilestone();
    offStart();
    offRestart();
    removeLayer();
  };
}
