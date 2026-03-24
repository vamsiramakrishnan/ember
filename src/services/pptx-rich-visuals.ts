/**
 * PPTX Rich Visuals — dispatcher + structure-based visual layouts.
 * Covers: stat-cards, process-flow, pyramid, funnel.
 * Relational layouts delegated to pptx-rich-relational.ts.
 */
import type PptxGenJS from 'pptxgenjs';
import { addRelationalVisual } from './pptx-rich-relational';
import type { ReadingSlide } from '@/types/entries';

const C = {
  paper: 'F6F1EA', paperWarm: 'F9F4ED', ink: '2C2825',
  inkSoft: '5C5550', inkFaint: '9B9590', inkGhost: 'C8C2BA',
  sage: '6B8F71', indigo: '5B6B8A', amber: 'C49A3C', margin: 'B8564F',
  rule: 'DDD6CC',
} as const;

const ACCENTS = [C.sage, C.indigo, C.amber, C.margin];
export const accentAt = (i: number) => ACCENTS[i % 4] ?? C.rule;
export { C };

export function heading(s: PptxGenJS.Slide, text: string): void {
  s.addText(text, { x: 1.0, y: 0.8, w: 11.0, h: 0.7,
    fontFace: 'Garamond', fontSize: 22, color: C.ink });
}

/** Returns true if this slide was handled by a rich visual layout. */
export function addRichVisual(s: PptxGenJS.Slide, slide: ReadingSlide): boolean {
  if (slide.layout === 'stat-cards' && slide.statCards?.length) return (addStatCards(s, slide), true);
  if (slide.layout === 'process-flow' && slide.processSteps?.length) return (addProcessFlow(s, slide), true);
  if (slide.layout === 'pyramid' && slide.pyramidLayers?.length) return (addPyramid(s, slide), true);
  if (slide.layout === 'funnel' && slide.funnelStages?.length) return (addFunnel(s, slide), true);
  return addRelationalVisual(s, slide);
}

function addStatCards(s: PptxGenJS.Slide, slide: ReadingSlide): void {
  heading(s, slide.heading);
  const cards = slide.statCards!.slice(0, 4);
  const cardW = 2.5;
  const gap = (11 - cards.length * cardW) / (cards.length + 1);
  cards.forEach((c, i) => {
    const x = 1.0 + gap + i * (cardW + gap);
    const accent = accentAt(i);
    s.addShape('rect' as PptxGenJS.ShapeType, { x, y: 2.0, w: cardW, h: 3.0,
      fill: { color: C.paperWarm }, line: { color: C.rule, width: 0.5 }, rectRadius: 0.05 });
    s.addShape('rect' as PptxGenJS.ShapeType, { x, y: 2.0, w: cardW, h: 0.06, fill: { color: accent } });
    s.addText(c.value, { x, y: 2.5, w: cardW, h: 1.0,
      fontFace: 'Garamond', fontSize: 32, color: accent, align: 'center', valign: 'middle' });
    s.addText(c.label.toUpperCase(), { x, y: 3.5, w: cardW, h: 0.4,
      fontFace: 'Courier New', fontSize: 9, color: C.inkFaint, align: 'center', charSpacing: 2 });
    if (c.detail) s.addText(c.detail, { x: x + 0.2, y: 4.0, w: cardW - 0.4, h: 0.8,
      fontFace: 'Georgia', fontSize: 10, color: C.inkFaint, align: 'center', italic: true });
  });
}

function addProcessFlow(s: PptxGenJS.Slide, slide: ReadingSlide): void {
  heading(s, slide.heading);
  const steps = slide.processSteps!.slice(0, 6);
  const stepH = Math.min(4.5 / steps.length, 0.8);
  steps.forEach((st, i) => {
    const y = 1.8 + i * stepH;
    const accent = accentAt(i);
    s.addShape('ellipse' as PptxGenJS.ShapeType, { x: 1.2, y: y + 0.05, w: 0.3, h: 0.3, fill: { color: accent } });
    s.addText(`${i + 1}`, { x: 1.2, y: y + 0.05, w: 0.3, h: 0.3,
      fontFace: 'Courier New', fontSize: 10, color: 'FFFFFF', align: 'center', valign: 'middle' });
    s.addText(st.step, { x: 1.8, y, w: 4.0, h: 0.35, fontFace: 'Garamond', fontSize: 14, color: C.ink });
    if (st.detail) s.addText(st.detail, { x: 1.8, y: y + 0.3, w: 6.0, h: 0.3,
      fontFace: 'Georgia', fontSize: 11, color: C.inkSoft });
    if (i < steps.length - 1) s.addShape('rect' as PptxGenJS.ShapeType, {
      x: 1.35, y: y + 0.35, w: 0.015, h: stepH - 0.35, fill: { color: C.rule } });
  });
}

function addPyramid(s: PptxGenJS.Slide, slide: ReadingSlide): void {
  heading(s, slide.heading);
  const layers = slide.pyramidLayers!.slice(0, 5);
  const total = layers.length;
  const layerH = Math.min(4.0 / total, 0.9);
  layers.forEach((l, i) => {
    const pct = i / (total - 1 || 1);
    const w = 3 + pct * 7;
    const x = 6.5 - w / 2;
    const y = 1.8 + i * layerH;
    const accent = accentAt(i);
    s.addShape('rect' as PptxGenJS.ShapeType, { x, y, w, h: layerH - 0.1,
      fill: { color: C.paperWarm }, line: { color: C.rule, width: 0.5 } });
    s.addShape('rect' as PptxGenJS.ShapeType, { x, y, w: 0.06, h: layerH - 0.1, fill: { color: accent } });
    s.addText(l.label, { x: x + 0.2, y, w: w - 0.4, h: (layerH - 0.1) * 0.5,
      fontFace: 'Garamond', fontSize: 13, color: C.ink, valign: 'bottom' });
    if (l.detail) s.addText(l.detail, { x: x + 0.2, y: y + (layerH - 0.1) * 0.5, w: w - 0.4, h: (layerH - 0.1) * 0.5,
      fontFace: 'Georgia', fontSize: 10, color: C.inkSoft, valign: 'top' });
  });
}

function addFunnel(s: PptxGenJS.Slide, slide: ReadingSlide): void {
  heading(s, slide.heading);
  const stages = slide.funnelStages!.slice(0, 5);
  const total = stages.length;
  const stageH = Math.min(4.0 / total, 0.9);
  stages.forEach((st, i) => {
    const pct = i / (total - 1 || 1);
    const w = 10 - pct * 5;
    const x = 6.5 - w / 2;
    const y = 1.8 + i * stageH;
    const accent = accentAt(i);
    s.addShape('rect' as PptxGenJS.ShapeType, { x, y, w, h: stageH - 0.1,
      fill: { color: C.paperWarm }, line: { color: C.rule, width: 0.5 } });
    s.addShape('rect' as PptxGenJS.ShapeType, { x, y, w, h: 0.05, fill: { color: accent } });
    s.addText(st.stage, { x: x + 0.2, y, w: w * 0.6, h: stageH - 0.1,
      fontFace: 'Garamond', fontSize: 13, color: C.ink, valign: 'middle' });
    if (st.value) s.addText(st.value, { x: x + w - 1.5, y, w: 1.3, h: stageH - 0.1,
      fontFace: 'Courier New', fontSize: 12, color: accent, align: 'right', valign: 'middle' });
  });
}
