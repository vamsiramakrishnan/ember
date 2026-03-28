/**
 * DOCX Visual Aids — renders all slide layouts as Word document elements.
 * Dispatches to rich visual renderers or falls back to legacy structured data.
 */
import {
  Paragraph, TextRun, TableRow, TableCell, Table,
  WidthType, ShadingType, BorderStyle, AlignmentType,
} from 'docx';
import { DOCX_COLORS as C, stripMd } from './docx-constants';
import type { ReadingSlide } from '@/types/entries';

type DocxItem = Paragraph | Table;
const ACCENTS = [C.sage, C.indigo, C.amber, C.margin];
export const accentAt = (i: number) => ACCENTS[i % 4] ?? C.ink;

/** Render a single slide's content (excluding heading) to DOCX elements. */
export function renderDocxSlide(slide: ReadingSlide, accent: string): DocxItem[] {
  // Rich visual layouts
  if (slide.layout === 'stat-cards' && slide.statCards?.length) return renderStatCards(slide.statCards);
  if (slide.layout === 'process-flow' && slide.processSteps?.length) return renderSteps(slide.processSteps, '↓');
  if (slide.layout === 'pyramid' && slide.pyramidLayers?.length) return renderPyramid(slide.pyramidLayers);
  if (slide.layout === 'comparison' && slide.comparisonData) return renderComparison(slide.comparisonData);
  if (slide.layout === 'funnel' && slide.funnelStages?.length) return renderFunnel(slide.funnelStages);
  if (slide.layout === 'cycle' && slide.cycleSteps?.length) return renderCycle(slide.cycleSteps);
  if (slide.layout === 'checklist' && slide.checklistItems?.length) return renderChecklist(slide.checklistItems);
  if (slide.layout === 'matrix' && slide.matrixData) return renderMatrix(slide.matrixData);

  // Legacy structured data
  const items: DocxItem[] = [];
  if (slide.timeline?.length) {
    for (const t of slide.timeline) {
      items.push(para([
        run(`${t.period} — `, { bold: true, color: accent }), run(t.event),
      ], { indent: 360 }));
      if (t.detail) items.push(para([run(t.detail, { italics: true, color: C.inkFaint, size: 18 })], { indent: 720 }));
    }
  }
  if (slide.tableData?.headers?.length) {
    const hdr = new TableRow({ children: slide.tableData.headers.map((h) => tCell(h, true)) });
    const rows = (slide.tableData.rows ?? []).map((r) => new TableRow({ children: r.map((c) => tCell(c)) }));
    items.push(new Table({ rows: [hdr, ...rows], width: { size: 100, type: WidthType.PERCENTAGE } }));
  }
  if (slide.diagramItems?.length) {
    for (const d of slide.diagramItems) {
      items.push(para([
        run(`◇ ${d.label}`, { bold: true, color: accent }),
        ...(d.detail ? [run(` — ${d.detail}`)] : []),
      ], { indent: 360 }));
    }
  }

  // Body text fallback
  if (items.length === 0 && slide.body) {
    for (const p of stripMd(slide.body).split('\n').filter(Boolean)) {
      items.push(para([run(p)]));
    }
  }
  return items;
}

function renderStatCards(cards: NonNullable<ReadingSlide['statCards']>): DocxItem[] {
  const row = new TableRow({
    children: cards.slice(0, 4).map((c, i) => new TableCell({
      children: [
        para([run(c.value, { font: 'Georgia', size: 36, color: accentAt(i) })], { align: AlignmentType.CENTER }),
        para([run(c.label.toUpperCase(), { font: 'Courier New', size: 14, color: C.inkFaint })], { align: AlignmentType.CENTER }),
        ...(c.detail ? [para([run(c.detail, { italics: true, color: C.inkFaint, size: 16 })], { align: AlignmentType.CENTER })] : []),
      ],
      shading: { type: ShadingType.SOLID, color: C.paper },
      borders: { top: { style: BorderStyle.SINGLE, size: 6, color: accentAt(i) } },
    })),
  });
  return [new Table({ rows: [row], width: { size: 100, type: WidthType.PERCENTAGE } })];
}

function renderSteps(steps: NonNullable<ReadingSlide['processSteps']>, arrow: string): DocxItem[] {
  return steps.slice(0, 6).flatMap((s, i) => {
    const out: DocxItem[] = [para([
      run(`${i + 1}. `, { font: 'Courier New', size: 18, color: accentAt(i), bold: true }),
      run(s.step, { bold: true }), ...(s.detail ? [run(` — ${s.detail}`)] : []),
    ], { indent: 360, borderLeft: accentAt(i) })];
    if (i < steps.length - 1) out.push(para([run(`  ${arrow}`, { font: 'Courier New', size: 16, color: C.inkFaint })], { indent: 540 }));
    return out;
  });
}

function renderPyramid(layers: NonNullable<ReadingSlide['pyramidLayers']>): DocxItem[] {
  return layers.slice(0, 5).map((l, i) => {
    const indent = Math.round(1200 * (1 - i / (layers.length - 1 || 1)));
    return para([run(`▸ ${l.label}`, { bold: true }), ...(l.detail ? [run(` — ${l.detail}`)] : [])],
      { indent, align: AlignmentType.CENTER, borderBottom: accentAt(i), shading: C.paper });
  });
}

function renderComparison(d: NonNullable<ReadingSlide['comparisonData']>): DocxItem[] {
  const max = Math.max(d.leftPoints.length, d.rightPoints.length);
  const hdr = new TableRow({ children: [
    new TableCell({ children: [para([run(d.leftLabel, { bold: true, color: C.sage })], { align: AlignmentType.CENTER })], shading: { type: ShadingType.SOLID, color: C.paper } }),
    new TableCell({ children: [para([run('vs', { font: 'Courier New', size: 14, color: C.inkFaint })], { align: AlignmentType.CENTER })], width: { size: 10, type: WidthType.PERCENTAGE } }),
    new TableCell({ children: [para([run(d.rightLabel, { bold: true, color: C.indigo })], { align: AlignmentType.CENTER })], shading: { type: ShadingType.SOLID, color: C.paper } }),
  ] });
  const rows = Array.from({ length: max }, (_, i) => new TableRow({ children: [
    tCell(d.leftPoints[i] ?? ''), tCell(''), tCell(d.rightPoints[i] ?? ''),
  ] }));
  return [new Table({ rows: [hdr, ...rows], width: { size: 100, type: WidthType.PERCENTAGE } })];
}

function renderFunnel(stages: NonNullable<ReadingSlide['funnelStages']>): DocxItem[] {
  return stages.slice(0, 5).map((s, i) => {
    const indent = Math.round(i * 300);
    return para([
      run(s.stage, { bold: true }), ...(s.value ? [run(` (${s.value})`, { font: 'Courier New', size: 16, color: accentAt(i) })] : []),
      ...(s.detail ? [run(` — ${s.detail}`)] : []),
    ], { indent, borderTop: accentAt(i), shading: C.paper });
  });
}

function renderCycle(steps: NonNullable<ReadingSlide['cycleSteps']>): DocxItem[] {
  const items = renderSteps(steps.map((s) => ({ step: s.step, detail: s.detail })), '↓');
  items.push(para([run('  ↩ return to step 1', { font: 'Courier New', size: 14, color: C.inkFaint })], { indent: 540 }));
  return items;
}

function renderChecklist(items: NonNullable<ReadingSlide['checklistItems']>): DocxItem[] {
  return items.map((c) => para([
    run(c.checked ? '  ✓  ' : '  ○  ', { font: 'Courier New', size: 18, color: c.checked ? C.sage : C.inkFaint }),
    run(c.item, { color: c.checked ? C.ink : C.inkSoft }),
  ], { borderBottom: C.rule }));
}

function renderMatrix(d: NonNullable<ReadingSlide['matrixData']>): DocxItem[] {
  return [
    para([run(`↑ ${d.topLabel}`, { font: 'Courier New', size: 14, color: C.inkFaint })], { align: AlignmentType.CENTER }),
    para([run(`← ${d.leftLabel}`, { font: 'Courier New', size: 14, color: C.inkFaint })]),
    new Table({ rows: [
      new TableRow({ children: [mCell(d.quadrants[0] ?? '', 0), mCell(d.quadrants[1] ?? '', 1)] }),
      new TableRow({ children: [mCell(d.quadrants[2] ?? '', 2), mCell(d.quadrants[3] ?? '', 3)] }),
    ], width: { size: 100, type: WidthType.PERCENTAGE } }),
    para([run(`${d.rightLabel} →`, { font: 'Courier New', size: 14, color: C.inkFaint })], { align: AlignmentType.RIGHT }),
    para([run(`↓ ${d.bottomLabel}`, { font: 'Courier New', size: 14, color: C.inkFaint })], { align: AlignmentType.CENTER }),
  ];
}

// ─── Helpers ─────────────────────────────────────────────────

interface RunOpts { font?: string; size?: number; color?: string; bold?: boolean; italics?: boolean; }
function run(text: string, opts: RunOpts = {}): TextRun {
  return new TextRun({ text, font: opts.font ?? 'Georgia', size: opts.size ?? 20,
    color: opts.color ?? C.inkSoft, bold: opts.bold, italics: opts.italics });
}

interface ParaOpts { indent?: number; align?: typeof AlignmentType[keyof typeof AlignmentType]; borderLeft?: string; borderBottom?: string; borderTop?: string; shading?: string; }
function para(children: TextRun[], opts: ParaOpts = {}): Paragraph {
  return new Paragraph({
    children, spacing: { after: 80 },
    indent: opts.indent ? { left: opts.indent } : undefined,
    alignment: opts.align,
    border: {
      ...(opts.borderLeft ? { left: { style: BorderStyle.SINGLE, size: 3, color: opts.borderLeft } } : {}),
      ...(opts.borderBottom ? { bottom: { style: BorderStyle.SINGLE, size: 1, color: opts.borderBottom } } : {}),
      ...(opts.borderTop ? { top: { style: BorderStyle.SINGLE, size: 2, color: opts.borderTop } } : {}),
    },
    shading: opts.shading ? { type: ShadingType.SOLID, color: opts.shading } : undefined,
  });
}

function tCell(text: string, header = false): TableCell {
  return new TableCell({
    children: [new Paragraph({ children: [run(text, header ? { bold: true, color: C.ink, size: 18 } : { size: 18 })] })],
    ...(header ? { shading: { type: ShadingType.SOLID, color: C.paper } } : {}),
  });
}

function mCell(text: string, i: number): TableCell {
  return new TableCell({
    children: [para([run(text, { size: 18 })], { align: AlignmentType.CENTER })],
    shading: { type: ShadingType.SOLID, color: C.paper },
    borders: { top: { style: BorderStyle.SINGLE, size: 4, color: accentAt(i) } },
  });
}
