/**
 * ReadingSlideView — renders a single slide from a ReadingMaterial deck.
 * Handles layout variants (title, content, two-column, quote,
 * diagram, summary, timeline, table) with structured data rendering.
 * Supports optional AI-generated inline illustrations per slide.
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

      {/* Structured layout renderers */}
      {slide.layout === 'timeline' && slide.timeline && slide.timeline.length > 0 ? (
        <TimelineView items={slide.timeline} />
      ) : slide.layout === 'table' && slide.tableData ? (
        <TableView data={slide.tableData} />
      ) : slide.layout === 'diagram' && slide.diagramItems ? (
        <DiagramView items={slide.diagramItems} />
      ) : (
        <div className={styles.slideBody}>
          <MarkdownContent>{slide.body}</MarkdownContent>
        </div>
      )}

      {/* AI-generated inline illustration */}
      {slide.imageUrl && (
        <img className={styles.slideIllustration} src={slide.imageUrl}
          alt={`Illustration for ${slide.heading}`} loading="lazy" />
      )}
    </article>
  );
}

function TimelineView({ items }: { items: Array<{ period: string; event: string; detail?: string }> }) {
  return (
    <div className={styles.timeline}>
      {items.map((evt, i) => (
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
  );
}

function TableView({ data }: { data: { headers: string[]; rows: string[][] } }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>{data.headers.map((h, i) => <th key={i} className={styles.th}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {data.rows.map((row, ri) => (
            <tr key={ri}>{row.map((cell, ci) => <td key={ci} className={styles.td}>{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DiagramView({ items }: { items: Array<{ label: string; detail?: string }> }) {
  return (
    <div className={styles.diagramGrid}>
      {items.map((item, i) => (
        <div key={i} className={styles.diagramCard}>
          <span className={styles.diagramLabel}>{item.label}</span>
          {item.detail && <span className={styles.diagramDetail}>{item.detail}</span>}
        </div>
      ))}
    </div>
  );
}
