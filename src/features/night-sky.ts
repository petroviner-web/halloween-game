// Halloween night sky: a pixel-art moon, three drifting clouds, and a tint
// that progressively darkens as the run gets longer.
//
// Follows the feature contract (architecture 2.2): no DOM, no wall clock, no
// Math.random. All motion is a pure function of `state.tick`.

import type { Renderer } from '../render.js';
import { CANVAS, PALETTE } from '../tuning.js';
import type { DrawContext, Game, LayerDraw } from '../types.js';

export interface NightSkyDeps {
  readonly game: Pick<Game, 'on'>;
  readonly renderer: Pick<Renderer, 'addLayer'>;
}

/** Alpha gained per running tick; capped at MAX_DARKNESS. */
export const DARKNESS_PER_TICK = 1 / 12000;
/** Hard cap on the darkening overlay so the game stays playable. */
export const MAX_DARKNESS = 0.55;

/** Pure function: darkening overlay alpha for a given running tick. */
export function darknessFor(tick: number): number {
  if (tick <= 0) return 0;
  return Math.min(MAX_DARKNESS, tick * DARKNESS_PER_TICK);
}

/** Moon pixel-art rows: each entry is {x, width} relative to the moon origin. */
const MOON = { x: 680, y: 40 } as const;
const MOON_ROWS: readonly { readonly x: number; readonly width: number }[] = [
  { x: 3, width: 6 },
  { x: 1, width: 10 },
  { x: 0, width: 12 },
  { x: 0, width: 12 },
  { x: 0, width: 12 },
  { x: 0, width: 12 },
  { x: 1, width: 10 },
  { x: 3, width: 6 },
];

interface Cloud {
  readonly baseX: number;
  readonly y: number;
  readonly speed: number;
}

const CLOUD_WIDTH = 44;
const CLOUDS: readonly Cloud[] = [
  { baseX: 60, y: 25, speed: 0.35 },
  { baseX: 320, y: 60, speed: 0.5 },
  { baseX: 540, y: 15, speed: 0.22 },
];

/** Pure function: cloud x position at a tick, wrapping across the canvas. */
export function cloudX(baseX: number, speed: number, tick: number): number {
  const period = CANVAS.width + CLOUD_WIDTH;
  const raw = (baseX + tick * speed) % period;
  return raw - CLOUD_WIDTH;
}

const CLOUD_STYLE = 'rgba(240, 230, 210, 0.28)';

function drawMoon(ctx: DrawContext): void {
  ctx.fillStyle = PALETTE.fg;
  MOON_ROWS.forEach((row, index) => {
    ctx.fillRect(MOON.x + row.x, MOON.y + index, row.width, 1);
  });
}

function drawCloud(ctx: DrawContext, x: number, y: number): void {
  ctx.fillStyle = CLOUD_STYLE;
  ctx.fillRect(x, y + 2, CLOUD_WIDTH, 3);
  ctx.fillRect(x + 6, y, 12, 2);
  ctx.fillRect(x + 24, y, 14, 2);
}

export function installNightSky({ renderer }: NightSkyDeps): () => void {
  const drawSky: LayerDraw = (ctx, state) => {
    drawMoon(ctx);
    for (const cloud of CLOUDS) {
      drawCloud(ctx, cloudX(cloud.baseX, cloud.speed, state.tick), cloud.y);
    }
  };
  const drawDarkness: LayerDraw = (ctx, state) => {
    const alpha = darknessFor(state.tick);
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
    ctx.restore();
  };
  const removeSky = renderer.addLayer('background', drawSky);
  const removeDarkness = renderer.addLayer('foreground', drawDarkness);
  return () => {
    removeSky();
    removeDarkness();
  };
}
