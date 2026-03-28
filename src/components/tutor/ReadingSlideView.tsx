/**
 * ReadingSlideView — renders a single slide from a ReadingMaterial deck.
 * Dispatches to layout-specific renderers including 8 rich visual aids
 * (stat-cards, process-flow, pyramid, comparison, funnel, cycle,
 * checklist, matrix) plus timeline, table, diagram.
 */
import { MarkdownContent } from '@/primitives/MarkdownContent';
import {
  StatCardsView, ProcessFlowView, PyramidView, ComparisonView,
  FunnelView, CycleView, ChecklistView, MatrixView,
} from './SlideVisualAids';
import type { ReadingSlide } from '@/types/entries';
import styles from './ReadingMaterial.module.css';

interface Props { slide: ReadingSlide; index: number; }

const ACCENT_MAP: Record<string, string | undefined> = {
  sage: styles.accentSage, indigo: styles.accentIndigo,
  amber: styles.accentAmber, margin: styles.accentMargin,
};

export function ReadingSlideView({ slide, index }: Props) {
  const accentCls = slide.accent ? ACCENT_MAP[slide.accent] ?? '' : '';
  const layoutCls = styles[`layout_${slide.layout}`] ?? styles.layout_content;

  return (
    <article className={`${styles.slide} ${layoutCls} ${accentCls}`}
      aria-label={`Page ${index + 1}: ${slide.heading}`}>
      <div className={styles.slideRule} />
      <h4 className={styles.slideHeading}>{slide.heading}</h4>
      <SlideContent slide={slide} />
      {slide.imageUrl && (
        <img className={styles.slideIllustration} src={slide.imageUrl}
          alt={`Illustration for ${slide.heading}`} loading="lazy" />
      )}
    </article>
  );
}

/** Dispatch to the correct visual renderer based on layout + data. */
function SlideContent({ slide }: { slide: ReadingSlide }) {
  if (slide.layout === 'stat-cards' && slide.statCards?.length)
    return <StatCardsView cards={slide.statCards} />;
  if (slide.layout === 'process-flow' && slide.processSteps?.length)
    return <ProcessFlowView steps={slide.processSteps} />;
  if (slide.layout === 'pyramid' && slide.pyramidLayers?.length)
    return <PyramidView layers={slide.pyramidLayers} />;
  if (slide.layout === 'comparison' && slide.comparisonData)
    return <ComparisonView data={slide.comparisonData} />;
  if (slide.layout === 'funnel' && slide.funnelStages?.length)
    return <FunnelView stages={slide.funnelStages} />;
  if (slide.layout === 'cycle' && slide.cycleSteps?.length)
    return <CycleView steps={slide.cycleSteps} />;
  if (slide.layout === 'checklist' && slide.checklistItems?.length)
    return <ChecklistView items={slide.checklistItems} />;
  if (slide.layout === 'matrix' && slide.matrixData)
    return <MatrixView data={slide.matrixData} />;
  if (slide.layout === 'timeline' && slide.timeline?.length)
    return <TimelineView items={slide.timeline} />;
  if (slide.layout === 'table' && slide.tableData)
    return <TableView data={slide.tableData} />;
  if (slide.layout === 'diagram' && slide.diagramItems?.length)
    return <DiagramView items={slide.diagramItems} />;
  return <div className={styles.slideBody}><MarkdownContent>{slide.body}</MarkdownContent></div>;
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
