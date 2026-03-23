/**
 * ReadingSlideView — renders a single slide from a reading material deck.
 * Layout-aware: title, content, two-column, quote, diagram, summary.
 * Uses MarkdownContent for rich text rendering.
 */
import { MarkdownContent } from '@/primitives/MarkdownContent';
import type { ReadingSlide } from '@/types/entries';
import styles from './ReadingMaterial.module.css';

interface Props {
  slide: ReadingSlide;
  index: number;
}

const ACCENT_MAP: Record<string, string | undefined> = {
  sage: styles.accentSage,
  indigo: styles.accentIndigo,
  amber: styles.accentAmber,
  margin: styles.accentMargin,
};

export function ReadingSlideView({ slide, index }: Props) {
  const accentCls = slide.accent ? ACCENT_MAP[slide.accent] ?? '' : '';
  const layoutCls = styles[`layout_${slide.layout}`] ?? styles.layout_content;

  return (
    <article className={`${styles.slide} ${layoutCls} ${accentCls}`}
      aria-label={`Page ${index + 1}: ${slide.heading}`}>
      <div className={styles.slideRule} />
      <h4 className={styles.slideHeading}>{slide.heading}</h4>
      <div className={styles.slideBody}>
        <MarkdownContent>{slide.body}</MarkdownContent>
      </div>
    </article>
  );
}
