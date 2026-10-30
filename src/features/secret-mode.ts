// Cosmetic overlay that appears while secret mode is on.
//
// Follows the architecture 2.2 feature shape: installed from outside the game
// loop, no DOM access, draws only. The toggle lives in main.ts (DOM-level
// Konami listener); the feature reads it through `isActive`.

import type { Renderer } from '../render.js';
import { HUD, PALETTE } from '../tuning.js';
import type { LayerDraw } from '../types.js';

export interface SecretModeDeps {
  readonly renderer: Pick<Renderer, 'addLayer'>;
  readonly isActive: () => boolean;
}

/** HUD font for the secret badge; monospace so widths match the score line. */
const BADGE_FONT = 'bold 14px monospace';
/** Render-frame period of the badge blink (even/odd halves). */
const BLINK_FRAMES = 20;

export function installSecretMode({
  renderer,
  isActive,
}: SecretModeDeps): () => void {
  const draw: LayerDraw = (ctx, _state, frame) => {
    if (!isActive()) return;
    const visible = Math.floor(frame.count / BLINK_FRAMES) % 2 === 0;
    if (!visible) return;
    ctx.fillStyle = PALETTE.accent;
    ctx.font = BADGE_FONT;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('* SECRET MODE *', 10, HUD.top);
  };
  return renderer.addLayer('hud', draw);
}
