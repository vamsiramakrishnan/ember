/**
 * DOCX Export — generates a downloadable Word document from reading materials.
 * Renders all 16 slide layouts via docx-visual-aids helpers.
 */
import {
  Document, Packer, Paragraph, HeadingLevel, BorderStyle,
} from 'docx';
import { renderDocxSlide } from './docx-visual-aids';
import { DOCX_COLORS } from './docx-constants';
import type { ReadingSlide } from '@/types/entries';

// Re-export for existing consumers
export { DOCX_COLORS, stripMd } from './docx-constants';

const ACCENT_HEX: Record<string, string> = {
  sage: DOCX_COLORS.sage, indigo: DOCX_COLORS.indigo,
  amber: DOCX_COLORS.amber, margin: DOCX_COLORS.margin,
};

export async function exportToDocx(
  title: string, subtitle: string | undefined, slides: ReadingSlide[],
): Promise<void> {
  const children: Paragraph[] = [];

  // Title page
  children.push(new Paragraph({
    text: title, heading: HeadingLevel.TITLE,
    spacing: { after: 200 },
    run: { color: DOCX_COLORS.ink, font: 'Georgia' },
  }));
  if (subtitle) {
    children.push(new Paragraph({
      text: subtitle, spacing: { after: 600 },
      run: { color: DOCX_COLORS.inkSoft, font: 'Georgia', italics: true, size: 24 },
    }));
  }
  children.push(new Paragraph({ text: '', spacing: { after: 400 } }));

  for (const slide of slides) {
    const accent = slide.accent ? ACCENT_HEX[slide.accent] : DOCX_COLORS.ink;

    // Section heading
    children.push(new Paragraph({
      text: slide.heading,
      heading: slide.layout === 'title' ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: accent ?? DOCX_COLORS.rule } },
      run: { color: DOCX_COLORS.ink, font: 'Georgia' },
    }));

    // Render slide body + structured data via unified helper
    const items = renderDocxSlide(slide, accent ?? DOCX_COLORS.ink);
    children.push(...(items as Paragraph[]));
  }

  const doc = new Document({
    styles: { default: { document: { run: { font: 'Georgia', color: DOCX_COLORS.ink } } } },
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
