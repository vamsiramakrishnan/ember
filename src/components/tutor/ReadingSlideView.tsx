/**
 * ReadingSlideView — renders a single slide from a reading material deck.
 * Layout-aware: title, content, two-column, quote, diagram, summary,
 * timeline, table. Uses MarkdownContent for rich text, plus structured
 * data rendering for timelines, tables, and diagram items.
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

      {/* Timeline rendering */}
      {slide.layout === 'timeline' && slide.timeline && slide.timeline.length > 0 ? (
        <div className={styles.timeline}>
          {slide.timeline.map((evt, i) => (
            <div key={i} className={styles.timelineItem}>
              <span className={styles.timelinePeriod}>{evt.period}</span>
              <span className={styles.timelineDot} />
              <div className={styles.timelineContent}>
                <span className={styles.timelineEvent}>{evt.event}</span>
                {evt.detail && <span className={styles.timelineDetail}>{evt.detail}</span>}
              </div>
            </div>
          ))}
        </div>
      ) : slide.layout === 'table' && slide.tableData ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>{slide.tableData.headers.map((h, i) => (
                <th key={i} className={styles.th}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {slide.tableData.rows.map((row, ri) => (
                <tr key={ri}>{row.map((cell, ci) => (
                  <td key={ci} className={styles.td}>{cell}</td>
                ))}</tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : slide.layout === 'diagram' && slide.diagramItems ? (
        <div className={styles.diagramGrid}>
          {slide.diagramItems.map((item, i) => (
            <div key={i} className={styles.diagramCard}>
              <span className={styles.diagramLabel}>{item.label}</span>
              {item.detail && <span className={styles.diagramDetail}>{item.detail}</span>}
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.slideBody}>
          <MarkdownContent>{slide.body}</MarkdownContent>
        </div>
      )}
    </article>
  );
}
