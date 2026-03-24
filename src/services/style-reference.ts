/**
 * Style Reference — generates a visual color palette reference image
 * for the Gemini image model (Nano Banana 2).
 *
 * NB2 is much better at style adherence with a visual example than with
 * hex codes in text. This module renders Ember's exact token colors as
 * a PNG via OffscreenCanvas, encoded as base64 for Gemini inlineData.
 *
 * The palette is generated once and cached for the session lifetime.
 */
import { colors } from '@/tokens/colors';

const W = 400;
const H = 300;

/** Render the palette swatches onto a canvas context. */
function drawPalette(ctx: OffscreenCanvasRenderingContext2D): void {
  // Paper background
  ctx.fillStyle = colors.paper;
  ctx.fillRect(0, 0, W, H);

  // Paper variants row
  fillSwatch(ctx, 20, 20, 70, 40, colors.paperWarm, colors.rule);
  fillSwatch(ctx, 100, 20, 70, 40, colors.paper, colors.rule);
  fillSwatch(ctx, 180, 20, 70, 40, colors.paperDeep, colors.rule);

  // Ink gradient row
  fillSwatch(ctx, 20, 80, 50, 40, colors.ink);
  fillSwatch(ctx, 80, 80, 50, 40, colors.inkSoft);
  fillSwatch(ctx, 140, 80, 50, 40, colors.inkFaint);
  fillSwatch(ctx, 200, 80, 50, 40, colors.inkGhost);

  // Accent colors
  fillSwatch(ctx, 20, 140, 60, 50, colors.sage);
  fillSwatch(ctx, 90, 140, 60, 50, colors.indigo);
  fillSwatch(ctx, 160, 140, 60, 50, colors.amber);
  fillSwatch(ctx, 230, 140, 60, 50, colors.margin);

  // Dim accent tints
  fillSwatch(ctx, 20, 200, 60, 30, colors.sageDim, colors.rule);
  fillSwatch(ctx, 90, 200, 60, 30, colors.indigoDim, colors.rule);
  fillSwatch(ctx, 160, 200, 60, 30, colors.amberDim, colors.rule);
  fillSwatch(ctx, 230, 200, 60, 30, colors.marginDim, colors.rule);

  // Cross-hatching texture sample
  fillSwatch(ctx, 310, 20, 70, 100, colors.paper, colors.inkFaint);
  drawCrossHatch(ctx, 315, 25, 375, 115);

  // Structural rules
  ctx.strokeStyle = colors.rule;
  ctx.lineWidth = 1;
  line(ctx, 20, 248, 380, 248);
  ctx.strokeStyle = colors.ruleLight;
  line(ctx, 20, 252, 380, 252);

  // Margin rule sample (tutor's terracotta)
  ctx.strokeStyle = colors.margin;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.35;
  line(ctx, 310, 140, 310, 230);
  ctx.globalAlpha = 1;

  // Small accent circles at small scale
  circle(ctx, 330, 160, 8, colors.sage);
  circle(ctx, 355, 160, 8, colors.indigo);
  circle(ctx, 330, 185, 8, colors.amber);
  circle(ctx, 355, 185, 8, colors.margin);

  // Warm border
  ctx.strokeStyle = colors.rule;
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, W - 2, H - 2);
}

type Ctx = OffscreenCanvasRenderingContext2D;

function fillSwatch(ctx: Ctx, x: number, y: number, w: number, h: number, fill: string, stroke?: string): void {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h); }
}

function line(ctx: Ctx, x1: number, y1: number, x2: number, y2: number): void {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}

function circle(ctx: Ctx, cx: number, cy: number, r: number, fill: string): void {
  ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
}

function drawCrossHatch(
  ctx: OffscreenCanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
): void {
  ctx.save();
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 0.5;
  ctx.globalAlpha = 0.7;
  const step = 10;
  // 45° lines
  for (let d = 0; d < (x2 - x1) + (y2 - y1); d += step) {
    const sx = x1 + Math.min(d, x2 - x1);
    const sy = y1 + Math.max(0, d - (x2 - x1));
    const ex = x1 + Math.max(0, d - (y2 - y1));
    const ey = y1 + Math.min(d, y2 - y1);
    line(ctx, sx, sy, ex, ey);
  }
  // 135° lines
  for (let d = 0; d < (x2 - x1) + (y2 - y1); d += step) {
    const sx = x2 - Math.min(d, x2 - x1);
    const sy = y1 + Math.max(0, d - (x2 - x1));
    const ex = x2 - Math.max(0, d - (y2 - y1));
    const ey = y1 + Math.min(d, y2 - y1);
    line(ctx, sx, sy, ex, ey);
  }
  ctx.restore();
}

// ─── Public API ─────────────────────────────────────────────

let cachedData: string | null = null;

/**
 * Get the style reference palette as a base64-encoded PNG.
 * Rendered via OffscreenCanvas, cached after first call.
 */
export function getStyleReferenceData(): string {
  if (!cachedData) {
    const canvas = new OffscreenCanvas(W, H);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('OffscreenCanvas 2D not available');
    drawPalette(ctx);
    // Synchronous: convertToBlob is async, but we need sync for caching.
    // Use toDataURL workaround via regular canvas if available, or
    // encode the raw pixel data as PNG manually.
    // OffscreenCanvas doesn't have toDataURL — transfer to regular canvas.
    const regular = document.createElement('canvas');
    regular.width = W;
    regular.height = H;
    const rctx = regular.getContext('2d');
    if (!rctx) throw new Error('Canvas 2D not available');
    rctx.drawImage(canvas, 0, 0);
    // toDataURL returns "data:image/png;base64,..."
    cachedData = regular.toDataURL('image/png').split(',')[1] ?? '';
  }
  return cachedData as string;
}

/** MIME type for the style reference. */
export const STYLE_REFERENCE_MIME = 'image/png';

/** Text description accompanying the palette reference. */
export const STYLE_REFERENCE_NOTE = `[STYLE REFERENCE] The image above shows the EXACT color palette and drawing style you must use. Top row: paper tones (warm ivory, never white). Second row: ink tones from darkest to lightest — use these for all line work. Third row: the ONLY four accent colors allowed (sage green, blue-grey indigo, warm amber, terracotta). Fourth row: how accents appear as subtle background tints. Right side: cross-hatching texture sample — this is how all shading should be rendered. The thin lines show structural dividers. Match these exact colors and this hand-drawn cross-hatching style.`;
