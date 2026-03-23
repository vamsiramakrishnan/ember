/**
 * Reading Material PPTX Export — generates a downloadable presentation
 * from a ReadingSlide[] deck. Ember visual language: warm tones, quiet type.
 */
import PptxGenJS from 'pptxgenjs';
import {
  addTwoColumnLayout, addDiagramLayout, addSummaryLayout,
  addTimelineLayout, addTableLayout,
} from './pptx-visual-aids';
import type { ReadingSlide } from '@/types/entries';

/** Ember palette mapped to PPTX hex values (no # prefix). */
const C = {
  paper: 'F6F1EA',
  paperWarm: 'F9F4ED',
  ink: '2C2825',
  inkSoft: '5C5550',
  inkFaint: '9B9590',
  inkGhost: 'C8C2BA',
  margin: 'B8564F',
  sage: '6B8F71',
  indigo: '5B6B8A',
  amber: 'C49A3C',
  rule: 'DDD6CC',
} as const;

const ACCENT_HEX: Record<string, string> = {
  sage: C.sage, indigo: C.indigo, amber: C.amber, margin: C.margin,
};

/** Strip basic markdown for plain-text PPTX output. */
function stripMd(md: string): string {
  return md
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-*+]\s+/gm, '• ')
    .replace(/^\d+\.\s+/gm, '')
    .trim();
}

export async function exportToPptx(
  title: string,
  subtitle: string | undefined,
  slides: ReadingSlide[],
): Promise<void> {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'Ember Tutor';

  // Title slide
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: C.paper };
  addDecoRule(titleSlide, C.amber);
  titleSlide.addText(title, {
    x: 1.2, y: 2.0, w: 10.6, h: 1.2,
    fontFace: 'Garamond', fontSize: 36, color: C.ink,
    bold: false, align: 'center', valign: 'middle',
  });
  if (subtitle) {
    titleSlide.addText(subtitle, {
      x: 1.2, y: 3.2, w: 10.6, h: 0.6,
      fontFace: 'Georgia', fontSize: 16, color: C.inkFaint,
      bold: false, align: 'center', valign: 'top',
    });
  }

  // Content slides
  for (const slide of slides) {
    const s = pptx.addSlide();
    s.background = { color: C.paper };

    const accent = slide.accent ? ACCENT_HEX[slide.accent] ?? C.rule : C.rule;
    addDecoRule(s, accent);

    if (slide.layout === 'title') {
      addTitleLayout(s, slide);
    } else if (slide.layout === 'quote') {
      addQuoteLayout(s, slide);
    } else if (slide.layout === 'two-column') {
      addTwoColumnLayout(s, slide);
    } else if (slide.layout === 'diagram') {
      addDiagramLayout(s, slide);
    } else if (slide.layout === 'summary') {
      addSummaryLayout(s, slide);
    } else if (slide.layout === 'timeline') {
      addTimelineLayout(s, slide);
    } else if (slide.layout === 'table') {
      addTableLayout(s, slide);
    } else {
      addContentLayout(s, slide);
    }

    // Page number
    s.addText(`${slides.indexOf(slide) + 1}`, {
      x: 12.0, y: 7.0, w: 0.8, h: 0.3,
      fontFace: 'Courier New', fontSize: 9, color: C.inkGhost,
      align: 'right',
    });
  }

  const fileName = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
  await pptx.writeFile({ fileName: `${fileName}.pptx` });
}

function addDecoRule(
  slide: PptxGenJS.Slide, color: string,
): void {
  slide.addShape('rect' as PptxGenJS.ShapeType, {
    x: 0.6, y: 0.5, w: 0.4, h: 0.03,
    fill: { color },
  });
}

function addTitleLayout(s: PptxGenJS.Slide, slide: ReadingSlide): void {
  s.addText(slide.heading, {
    x: 1.2, y: 2.4, w: 10.6, h: 1.0,
    fontFace: 'Garamond', fontSize: 30, color: C.ink,
    bold: false, align: 'center', valign: 'middle',
  });
  s.addText(stripMd(slide.body), {
    x: 2.0, y: 3.5, w: 9.0, h: 2.5,
    fontFace: 'Georgia', fontSize: 15, color: C.inkSoft,
    bold: false, align: 'center', valign: 'top',
    lineSpacingMultiple: 1.6,
  });
}

function addQuoteLayout(s: PptxGenJS.Slide, slide: ReadingSlide): void {
  // Left accent bar
  s.addShape('rect' as PptxGenJS.ShapeType, {
    x: 1.2, y: 1.8, w: 0.04, h: 2.5,
    fill: { color: C.margin },
  });
  s.addText(slide.heading, {
    x: 1.0, y: 0.8, w: 11.0, h: 0.6,
    fontFace: 'Garamond', fontSize: 20, color: C.ink,
    bold: false,
  });
  s.addText(stripMd(slide.body), {
    x: 1.6, y: 1.8, w: 10.0, h: 3.5,
    fontFace: 'Garamond', fontSize: 20, color: C.ink,
    bold: false, italic: true, valign: 'top',
    lineSpacingMultiple: 1.7,
  });
}

function addContentLayout(s: PptxGenJS.Slide, slide: ReadingSlide): void {
  s.addText(slide.heading, {
    x: 1.0, y: 0.8, w: 11.0, h: 0.7,
    fontFace: 'Garamond', fontSize: 22, color: C.ink,
    bold: false,
  });
  s.addText(stripMd(slide.body), {
    x: 1.0, y: 1.7, w: 11.0, h: 5.0,
    fontFace: 'Georgia', fontSize: 14, color: C.inkSoft,
    bold: false, valign: 'top',
    lineSpacingMultiple: 1.7,
  });
}
