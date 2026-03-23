/**
 * PPTX Visual Aids — layout helpers for richer slide content.
 * Extracted from reading-material-export for the diagram, two-column,
 * and summary layouts that need visual elements beyond text.
 */
import type PptxGenJS from 'pptxgenjs';
import type { ReadingSlide } from '@/types/entries';

/** Ember palette (no # prefix). */
const C = {
  paper: 'F6F1EA', ink: '2C2825', inkSoft: '5C5550',
  inkFaint: '9B9590', inkGhost: 'C8C2BA',
  margin: 'B8564F', sage: '6B8F71', indigo: '5B6B8A', amber: 'C49A3C',
  rule: 'DDD6CC', paperWarm: 'F9F4ED',
} as const;

/** Two-column layout — splits body at the first blank line or "---". */
export function addTwoColumnLayout(s: PptxGenJS.Slide, slide: ReadingSlide): void {
  s.addText(slide.heading, {
    x: 1.0, y: 0.8, w: 11.0, h: 0.7,
    fontFace: 'Garamond', fontSize: 22, color: C.ink, bold: false,
  });

  const parts = splitColumns(slide.body);
  // Left column
  s.addText(stripMd(parts[0]), {
    x: 1.0, y: 1.8, w: 5.2, h: 4.8,
    fontFace: 'Georgia', fontSize: 13, color: C.inkSoft,
    bold: false, valign: 'top', lineSpacingMultiple: 1.6,
  });
  // Divider
  s.addShape('rect' as PptxGenJS.ShapeType, {
    x: 6.4, y: 1.8, w: 0.02, h: 4.8,
    fill: { color: C.rule },
  });
  // Right column
  s.addText(stripMd(parts[1]), {
    x: 6.8, y: 1.8, w: 5.2, h: 4.8,
    fontFace: 'Georgia', fontSize: 13, color: C.inkSoft,
    bold: false, valign: 'top', lineSpacingMultiple: 1.6,
  });
}

/** Diagram layout — renders markdown bullet structure as connected boxes. */
export function addDiagramLayout(s: PptxGenJS.Slide, slide: ReadingSlide): void {
  s.addText(slide.heading, {
    x: 1.0, y: 0.8, w: 11.0, h: 0.7,
    fontFace: 'Garamond', fontSize: 22, color: C.ink, bold: false,
  });

  const items = extractBullets(slide.body);
  const cols = Math.min(items.length, 4);
  const boxW = 2.4;
  const gap = (11 - cols * boxW) / (cols + 1);

  items.slice(0, 4).forEach((item, i) => {
    const x = 1.0 + gap + i * (boxW + gap);
    const y = 2.2;
    // Box background
    s.addShape('rect' as PptxGenJS.ShapeType, {
      x, y, w: boxW, h: 3.2,
      fill: { color: C.paperWarm },
      line: { color: C.rule, width: 0.5 },
      rectRadius: 0.05,
    });
    // Box accent bar
    const accent = ['sage', 'indigo', 'amber', 'margin'][i % 4];
    s.addShape('rect' as PptxGenJS.ShapeType, {
      x, y, w: boxW, h: 0.05,
      fill: { color: C[accent as keyof typeof C] ?? C.rule },
    });
    // Box heading (first line)
    const lines = item.split('\n');
    s.addText(lines[0] ?? '', {
      x: x + 0.15, y: y + 0.2, w: boxW - 0.3, h: 0.5,
      fontFace: 'Garamond', fontSize: 14, color: C.ink,
      bold: false, valign: 'top',
    });
    // Box body (remaining lines)
    if (lines.length > 1) {
      s.addText(lines.slice(1).join('\n'), {
        x: x + 0.15, y: y + 0.7, w: boxW - 0.3, h: 2.3,
        fontFace: 'Georgia', fontSize: 11, color: C.inkSoft,
        bold: false, valign: 'top', lineSpacingMultiple: 1.5,
      });
    }
    // Arrow between boxes
    if (i < items.length - 1 && i < 3) {
      s.addShape('rect' as PptxGenJS.ShapeType, {
        x: x + boxW + gap * 0.3, y: y + 1.5, w: gap * 0.4, h: 0.02,
        fill: { color: C.inkGhost },
      });
    }
  });
}

/** Summary layout — key takeaways as numbered items with accent sidebar. */
export function addSummaryLayout(s: PptxGenJS.Slide, slide: ReadingSlide): void {
  s.addText(slide.heading.toUpperCase(), {
    x: 1.0, y: 0.8, w: 11.0, h: 0.5,
    fontFace: 'Courier New', fontSize: 12, color: C.inkFaint,
    bold: false, charSpacing: 3,
  });
  // Accent sidebar
  s.addShape('rect' as PptxGenJS.ShapeType, {
    x: 0.8, y: 1.5, w: 0.04, h: 5.0,
    fill: { color: C.amber },
  });
  s.addText(stripMd(slide.body), {
    x: 1.2, y: 1.5, w: 10.8, h: 5.0,
    fontFace: 'Georgia', fontSize: 15, color: C.ink,
    bold: false, valign: 'top', lineSpacingMultiple: 1.8,
  });
}

function splitColumns(body: string): [string, string] {
  const sep = body.indexOf('\n---\n') >= 0
    ? '\n---\n' : '\n\n';
  const idx = body.indexOf(sep);
  if (idx < 0) return [body, ''];
  return [body.slice(0, idx), body.slice(idx + sep.length)];
}

function extractBullets(body: string): string[] {
  return body.split(/^[-*+•]\s+/gm).filter((s) => s.trim()).map((s) => s.trim());
}

function stripMd(md: string): string {
  return md
    .replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1').replace(/`(.+?)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '').replace(/^[-*+]\s+/gm, '• ')
    .trim();
}
