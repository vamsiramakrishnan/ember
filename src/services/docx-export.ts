/**
 * DOCX Export — generates a downloadable Word document from reading materials.
 * Reuses the same ReadingSlide[] pipeline as PPTX export.
 * Ember visual language: warm serif typography, quiet structure.
 */
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  BorderStyle, TableRow, TableCell, Table,
  WidthType, ShadingType,
} from 'docx';
import type { ReadingSlide } from '@/types/entries';

const COLORS = {
  ink: '2C2825', inkSoft: '5C5550', inkFaint: '9B9590',
  paper: 'F6F1EA', sage: '6B8F71', indigo: '5B6B8A',
  amber: 'C49A3C', margin: 'B8564F', rule: 'DDD6CC',
};

const ACCENT_HEX: Record<string, string> = {
  sage: COLORS.sage, indigo: COLORS.indigo, amber: COLORS.amber, margin: COLORS.margin,
};

function stripMd(md: string): string {
  return md
    .replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1').replace(/`(.+?)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '').replace(/^[-*+]\s+/gm, '• ')
    .trim();
}

export async function exportToDocx(
  title: string, subtitle: string | undefined, slides: ReadingSlide[],
): Promise<void> {
  const children: Paragraph[] = [];

  // Title page
  children.push(new Paragraph({
    text: title, heading: HeadingLevel.TITLE,
    spacing: { after: 200 },
    run: { color: COLORS.ink, font: 'Georgia' },
  }));
  if (subtitle) {
    children.push(new Paragraph({
      text: subtitle, spacing: { after: 600 },
      run: { color: COLORS.inkSoft, font: 'Georgia', italics: true, size: 24 },
    }));
  }
  children.push(new Paragraph({ text: '', spacing: { after: 400 } }));

  for (const slide of slides) {
    const accent = slide.accent ? ACCENT_HEX[slide.accent] : COLORS.ink;

    // Section heading with accent rule
    children.push(new Paragraph({
      text: slide.heading,
      heading: slide.layout === 'title' ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: accent ?? COLORS.rule } },
      run: { color: COLORS.ink, font: 'Georgia' },
    }));

    // Body text
    if (slide.body) {
      for (const para of stripMd(slide.body).split('\n').filter(Boolean)) {
        children.push(new Paragraph({
          children: [new TextRun({ text: para, color: COLORS.inkSoft, font: 'Georgia', size: 22 })],
          spacing: { after: 120 },
        }));
      }
    }

    // Timeline entries
    if (slide.timeline?.length) {
      for (const t of slide.timeline) {
        children.push(new Paragraph({
          children: [
            new TextRun({ text: `${t.period} — `, bold: true, color: accent ?? COLORS.ink, font: 'Georgia', size: 20 }),
            new TextRun({ text: t.event, color: COLORS.inkSoft, font: 'Georgia', size: 20 }),
          ],
          spacing: { after: 80 },
          indent: { left: 360 },
        }));
        if (t.detail) {
          children.push(new Paragraph({
            children: [new TextRun({ text: t.detail, italics: true, color: COLORS.inkFaint, font: 'Georgia', size: 18 })],
            indent: { left: 720 }, spacing: { after: 60 },
          }));
        }
      }
    }

    // Table data
    if (slide.tableData?.headers?.length) {
      const headerRow = new TableRow({
        children: slide.tableData.headers.map((h) => new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: COLORS.ink, font: 'Georgia', size: 18 })] })],
          shading: { type: ShadingType.SOLID, color: COLORS.paper },
        })),
      });
      const dataRows = (slide.tableData.rows ?? []).map((row) => new TableRow({
        children: row.map((cell) => new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: cell, color: COLORS.inkSoft, font: 'Georgia', size: 18 })] })],
        })),
      }));
      children.push(new Paragraph({ text: '', spacing: { after: 100 } }));
      const table = new Table({
        rows: [headerRow, ...dataRows],
        width: { size: 100, type: WidthType.PERCENTAGE },
      });
      children.push(table as unknown as Paragraph);
    }

    // Diagram items
    if (slide.diagramItems?.length) {
      for (const d of slide.diagramItems) {
        children.push(new Paragraph({
          children: [
            new TextRun({ text: `◇ ${d.label}`, bold: true, color: accent ?? COLORS.ink, font: 'Georgia', size: 20 }),
            ...(d.detail ? [new TextRun({ text: ` — ${d.detail}`, color: COLORS.inkSoft, font: 'Georgia', size: 20 })] : []),
          ],
          indent: { left: 360 }, spacing: { after: 80 },
        }));
      }
    }
  }

  const doc = new Document({
    styles: { default: { document: { run: { font: 'Georgia', color: COLORS.ink } } } },
    sections: [{ children }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[^a-zA-Z0-9 ]/g, '').trim()}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
