/**
 * PPTX Visual Aids — rich layout helpers using native pptxgenjs features:
 * tables, timelines, relationship diagrams, two-column comparisons.
 */
import type PptxGenJS from 'pptxgenjs';
import type { ReadingSlide } from '@/types/entries';

const C = {
  paper: 'F6F1EA', ink: '2C2825', inkSoft: '5C5550',
  inkFaint: '9B9590', inkGhost: 'C8C2BA',
  margin: 'B8564F', sage: '6B8F71', indigo: '5B6B8A', amber: 'C49A3C',
  rule: 'DDD6CC', paperWarm: 'F9F4ED',
} as const;

const ACCENTS = [C.sage, C.indigo, C.amber, C.margin];

/** Two-column comparison layout. */
export function addTwoColumnLayout(s: PptxGenJS.Slide, slide: ReadingSlide): void {
  addHeading(s, slide.heading);
  const parts = splitColumns(slide.body);
  s.addText(stripMd(parts[0]), { x: 1.0, y: 1.8, w: 5.2, h: 4.8,
    fontFace: 'Georgia', fontSize: 13, color: C.inkSoft, valign: 'top', lineSpacingMultiple: 1.6 });
  s.addShape('rect' as PptxGenJS.ShapeType, { x: 6.4, y: 1.8, w: 0.02, h: 4.8, fill: { color: C.rule } });
  s.addText(stripMd(parts[1]), { x: 6.8, y: 1.8, w: 5.2, h: 4.8,
    fontFace: 'Georgia', fontSize: 13, color: C.inkSoft, valign: 'top', lineSpacingMultiple: 1.6 });
}

/** Diagram layout — connected concept boxes with accent bars and arrows. */
export function addDiagramLayout(s: PptxGenJS.Slide, slide: ReadingSlide): void {
  addHeading(s, slide.heading);
  const items = slide.diagramItems ?? extractBullets(slide.body).map((b) => {
    const lines = b.split('\n');
    return { label: lines[0] ?? b, detail: lines.slice(1).join('\n') };
  });
  const cols = Math.min(items.length, 4);
  const boxW = 2.4;
  const gap = (11 - cols * boxW) / (cols + 1);

  items.slice(0, 4).forEach((item, i) => {
    const x = 1.0 + gap + i * (boxW + gap);
    const y = 2.2;
    const accent = ACCENTS[i % 4] ?? C.rule;
    // Box
    s.addShape('rect' as PptxGenJS.ShapeType, { x, y, w: boxW, h: 3.2,
      fill: { color: C.paperWarm }, line: { color: C.rule, width: 0.5 }, rectRadius: 0.05 });
    // Accent top bar
    s.addShape('rect' as PptxGenJS.ShapeType, { x, y, w: boxW, h: 0.05, fill: { color: accent } });
    // Label
    s.addText(item.label, { x: x + 0.15, y: y + 0.2, w: boxW - 0.3, h: 0.5,
      fontFace: 'Garamond', fontSize: 14, color: C.ink, valign: 'top' });
    // Detail
    if (item.detail) {
      s.addText(item.detail, { x: x + 0.15, y: y + 0.7, w: boxW - 0.3, h: 2.3,
        fontFace: 'Georgia', fontSize: 11, color: C.inkSoft, valign: 'top', lineSpacingMultiple: 1.5 });
    }
    // Arrow connector → next box
    if (i < cols - 1) {
      const arrowX = x + boxW + gap * 0.15;
      const arrowW = gap * 0.7;
      s.addShape('rect' as PptxGenJS.ShapeType, {
        x: arrowX, y: y + 1.5, w: arrowW, h: 0.015, fill: { color: C.inkGhost } });
      // Arrowhead triangle
      s.addText('›', { x: arrowX + arrowW - 0.15, y: y + 1.35, w: 0.3, h: 0.3,
        fontFace: 'Georgia', fontSize: 16, color: C.inkGhost, align: 'center' });
    }
  });
}

/** Timeline layout — vertical timeline with periods and events. */
export function addTimelineLayout(s: PptxGenJS.Slide, slide: ReadingSlide): void {
  addHeading(s, slide.heading);
  const events = slide.timeline ?? extractTimelineFromBody(slide.body);
  const count = Math.min(events.length, 6);
  const stepH = Math.min(4.5 / count, 0.9);
  const startY = 1.8;

  // Vertical line
  s.addShape('rect' as PptxGenJS.ShapeType, {
    x: 2.2, y: startY, w: 0.02, h: count * stepH, fill: { color: C.rule } });

  events.slice(0, 6).forEach((evt, i) => {
    const y = startY + i * stepH;
    const accent = ACCENTS[i % 4] ?? C.rule;
    // Dot on timeline
    s.addShape('ellipse' as PptxGenJS.ShapeType, {
      x: 2.1, y: y + 0.05, w: 0.22, h: 0.22, fill: { color: accent } });
    // Period label (left of line)
    s.addText(evt.period, { x: 0.4, y, w: 1.6, h: 0.3,
      fontFace: 'Courier New', fontSize: 10, color: C.inkFaint, align: 'right' });
    // Event text (right of line)
    s.addText(evt.event, { x: 2.6, y, w: 5.0, h: 0.3,
      fontFace: 'Garamond', fontSize: 14, color: C.ink });
    // Detail (right, below event)
    if (evt.detail) {
      s.addText(evt.detail, { x: 2.6, y: y + 0.3, w: 5.0, h: 0.3,
        fontFace: 'Georgia', fontSize: 11, color: C.inkSoft });
    }
  });
}

/** Table layout — native PPTX table with Ember styling. */
export function addTableLayout(s: PptxGenJS.Slide, slide: ReadingSlide): void {
  addHeading(s, slide.heading);
  const data = slide.tableData ?? extractTableFromBody(slide.body);
  if (!data.headers.length) { addBodyText(s, slide.body); return; }

  const headerRow = data.headers.map((h) => ({
    text: h, options: { fontFace: 'Garamond', fontSize: 12, color: C.ink, bold: true,
      fill: { color: C.paperWarm }, border: { color: C.rule, pt: 0.5 } },
  }));

  const bodyRows = data.rows.map((row) =>
    row.map((cell) => ({
      text: cell, options: { fontFace: 'Georgia', fontSize: 11, color: C.inkSoft,
        border: { color: C.rule, pt: 0.5 } },
    })),
  );

  s.addTable([headerRow, ...bodyRows], {
    x: 1.0, y: 1.8, w: 11.0,
    colW: data.headers.map(() => 11.0 / data.headers.length),
    rowH: [0.4, ...bodyRows.map(() => 0.35)],
    margin: [4, 8, 4, 8],
  });
}

/** Summary layout — accent sidebar with key takeaways. */
export function addSummaryLayout(s: PptxGenJS.Slide, slide: ReadingSlide): void {
  s.addText(slide.heading.toUpperCase(), { x: 1.0, y: 0.8, w: 11.0, h: 0.5,
    fontFace: 'Courier New', fontSize: 12, color: C.inkFaint, charSpacing: 3 });
  s.addShape('rect' as PptxGenJS.ShapeType, { x: 0.8, y: 1.5, w: 0.04, h: 5.0, fill: { color: C.amber } });
  s.addText(stripMd(slide.body), { x: 1.2, y: 1.5, w: 10.8, h: 5.0,
    fontFace: 'Georgia', fontSize: 15, color: C.ink, valign: 'top', lineSpacingMultiple: 1.8 });
}

// ─── Helpers ─────────────────────────────────────────────────

function addHeading(s: PptxGenJS.Slide, text: string): void {
  s.addText(text, { x: 1.0, y: 0.8, w: 11.0, h: 0.7,
    fontFace: 'Garamond', fontSize: 22, color: C.ink });
}

function addBodyText(s: PptxGenJS.Slide, body: string): void {
  s.addText(stripMd(body), { x: 1.0, y: 1.7, w: 11.0, h: 5.0,
    fontFace: 'Georgia', fontSize: 14, color: C.inkSoft, valign: 'top', lineSpacingMultiple: 1.7 });
}

function splitColumns(body: string): [string, string] {
  const sep = body.indexOf('\n---\n') >= 0 ? '\n---\n' : '\n\n';
  const idx = body.indexOf(sep);
  if (idx < 0) return [body, ''];
  return [body.slice(0, idx), body.slice(idx + sep.length)];
}

function extractBullets(body: string): string[] {
  return body.split(/^[-*+•]\s+/gm).filter((s) => s.trim()).map((s) => s.trim());
}

function extractTimelineFromBody(body: string): Array<{ period: string; event: string; detail?: string }> {
  return body.split('\n').filter((l) => l.includes(':')).map((line) => {
    const [period, ...rest] = line.replace(/^[-*•]\s*/, '').split(':');
    return { period: (period ?? '').trim(), event: rest.join(':').trim() };
  }).filter((e) => e.period && e.event);
}

function extractTableFromBody(body: string): { headers: string[]; rows: string[][] } {
  const lines = body.split('\n').filter((l) => l.includes('|'));
  if (lines.length < 2) return { headers: [], rows: [] };
  const parse = (l: string) => l.split('|').map((c) => c.trim()).filter(Boolean);
  const headers = parse(lines[0] ?? '');
  const rows = lines.slice(1).filter((l) => !l.match(/^[-|:\s]+$/)).map(parse);
  return { headers, rows };
}

function stripMd(md: string): string {
  return md.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1').replace(/`(.+?)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '').replace(/^[-*+]\s+/gm, '• ').trim();
}
