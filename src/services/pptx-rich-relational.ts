/**
 * PPTX Rich Relational Visuals — comparison, cycle, checklist, matrix.
 * Separated from pptx-rich-visuals.ts for file-size discipline.
 */
import type PptxGenJS from 'pptxgenjs';
import { heading, accentAt, C } from './pptx-rich-visuals';
import type { ReadingSlide } from '@/types/entries';

/** Returns true if this slide was handled. */
export function addRelationalVisual(s: PptxGenJS.Slide, slide: ReadingSlide): boolean {
  if (slide.layout === 'comparison' && slide.comparisonData) return (addComparison(s, slide), true);
  if (slide.layout === 'cycle' && slide.cycleSteps?.length) return (addCycle(s, slide), true);
  if (slide.layout === 'checklist' && slide.checklistItems?.length) return (addChecklist(s, slide), true);
  if (slide.layout === 'matrix' && slide.matrixData) return (addMatrix(s, slide), true);
  return false;
}

function addComparison(s: PptxGenJS.Slide, slide: ReadingSlide): void {
  heading(s, slide.heading);
  const d = slide.comparisonData!;
  s.addText(d.leftLabel, { x: 1.0, y: 1.6, w: 5.0, h: 0.4,
    fontFace: 'Garamond', fontSize: 16, color: C.sage, align: 'center' });
  s.addText('vs', { x: 5.8, y: 1.6, w: 1.4, h: 0.4,
    fontFace: 'Courier New', fontSize: 10, color: C.inkFaint, align: 'center' });
  s.addText(d.rightLabel, { x: 7.0, y: 1.6, w: 5.0, h: 0.4,
    fontFace: 'Garamond', fontSize: 16, color: C.indigo, align: 'center' });
  s.addShape('rect' as PptxGenJS.ShapeType, { x: 6.45, y: 2.1, w: 0.02, h: 4.5, fill: { color: C.rule } });
  const max = Math.max(d.leftPoints.length, d.rightPoints.length);
  const ptH = Math.min(4.2 / max, 0.6);
  for (let i = 0; i < max; i++) {
    const y = 2.2 + i * ptH;
    if (d.leftPoints[i]) s.addText(`• ${d.leftPoints[i]}`, { x: 1.0, y, w: 5.2, h: ptH,
      fontFace: 'Georgia', fontSize: 12, color: C.inkSoft, valign: 'top' });
    if (d.rightPoints[i]) s.addText(`• ${d.rightPoints[i]}`, { x: 7.0, y, w: 5.2, h: ptH,
      fontFace: 'Georgia', fontSize: 12, color: C.inkSoft, valign: 'top' });
  }
}

function addCycle(s: PptxGenJS.Slide, slide: ReadingSlide): void {
  heading(s, slide.heading);
  const steps = slide.cycleSteps!.slice(0, 6);
  const stepH = Math.min(4.0 / steps.length, 0.7);
  steps.forEach((st, i) => {
    const y = 1.8 + i * stepH;
    const accent = accentAt(i);
    s.addShape('rect' as PptxGenJS.ShapeType, { x: 1.0, y, w: 0.06, h: stepH - 0.1, fill: { color: accent } });
    s.addText(`[${i + 1}]`, { x: 1.2, y, w: 0.5, h: stepH - 0.1,
      fontFace: 'Courier New', fontSize: 10, color: accent, valign: 'middle' });
    s.addText(st.step, { x: 1.8, y, w: 3.5, h: stepH - 0.1,
      fontFace: 'Garamond', fontSize: 14, color: C.ink, valign: 'middle' });
    if (st.detail) s.addText(st.detail, { x: 5.5, y, w: 5.0, h: stepH - 0.1,
      fontFace: 'Georgia', fontSize: 11, color: C.inkSoft, valign: 'middle' });
  });
  s.addText('↩ return to step 1', { x: 1.2, y: 1.8 + steps.length * stepH, w: 3.0, h: 0.3,
    fontFace: 'Courier New', fontSize: 9, color: C.inkFaint });
}

function addChecklist(s: PptxGenJS.Slide, slide: ReadingSlide): void {
  heading(s, slide.heading);
  const items = slide.checklistItems!;
  const itemH = Math.min(4.5 / items.length, 0.5);
  items.forEach((c, i) => {
    const y = 1.8 + i * itemH;
    s.addText(c.checked ? '✓' : '○', { x: 1.2, y, w: 0.4, h: itemH,
      fontFace: 'Courier New', fontSize: 14, color: c.checked ? C.sage : C.inkFaint, valign: 'middle' });
    s.addText(c.item, { x: 1.8, y, w: 9.5, h: itemH,
      fontFace: 'Georgia', fontSize: 13, color: c.checked ? C.ink : C.inkSoft, valign: 'middle' });
    s.addShape('rect' as PptxGenJS.ShapeType, { x: 1.0, y: y + itemH - 0.01, w: 11.0, h: 0.01, fill: { color: C.rule } });
  });
}

function addMatrix(s: PptxGenJS.Slide, slide: ReadingSlide): void {
  heading(s, slide.heading);
  const d = slide.matrixData!;
  s.addText(`↑ ${d.topLabel}`, { x: 3.0, y: 1.6, w: 7.0, h: 0.3,
    fontFace: 'Courier New', fontSize: 9, color: C.inkFaint, align: 'center' });
  s.addText(d.leftLabel, { x: 1.0, y: 2.2, w: 1.5, h: 4.0,
    fontFace: 'Courier New', fontSize: 9, color: C.inkFaint, align: 'center', valign: 'middle', rotate: 270 });
  s.addText(d.rightLabel, { x: 10.5, y: 2.2, w: 1.5, h: 4.0,
    fontFace: 'Courier New', fontSize: 9, color: C.inkFaint, align: 'center', valign: 'middle', rotate: 90 });
  s.addText(`↓ ${d.bottomLabel}`, { x: 3.0, y: 6.3, w: 7.0, h: 0.3,
    fontFace: 'Courier New', fontSize: 9, color: C.inkFaint, align: 'center' });
  const pos = [{ x: 3.0, y: 2.2 }, { x: 7.0, y: 2.2 }, { x: 3.0, y: 4.2 }, { x: 7.0, y: 4.2 }];
  d.quadrants.forEach((q, i) => {
    const { x, y } = pos[i]!;
    const accent = accentAt(i);
    s.addShape('rect' as PptxGenJS.ShapeType, { x, y, w: 3.8, h: 1.8,
      fill: { color: C.paperWarm }, line: { color: C.rule, width: 0.5 } });
    s.addShape('rect' as PptxGenJS.ShapeType, { x, y, w: 3.8, h: 0.05, fill: { color: accent } });
    s.addText(q, { x: x + 0.2, y: y + 0.2, w: 3.4, h: 1.4,
      fontFace: 'Georgia', fontSize: 12, color: C.inkSoft, align: 'center', valign: 'middle' });
  });
}
