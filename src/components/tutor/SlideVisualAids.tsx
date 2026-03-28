/**
 * SlideVisualAids — data-driven visual renderers for rich slide layouts.
 * Pure CSS rendering: no images, no external dependencies.
 * Covers: stat-cards, process-flow, pyramid, comparison,
 *         funnel, cycle, checklist, matrix.
 */
import type { ReadingSlide } from '@/types/entries';
import styles from './SlideVisualAids.module.css';

const ACCENT_CLASSES = ['sage', 'indigo', 'amber', 'margin'] as const;
const accentAt = (i: number) => styles[`accent_${ACCENT_CLASSES[i % 4]}`] ?? '';

export function StatCardsView({ cards }: { cards: NonNullable<ReadingSlide['statCards']> }) {
  return (
    <div className={styles.statGrid}>
      {cards.slice(0, 4).map((c, i) => (
        <div key={i} className={`${styles.statCard} ${accentAt(i)}`}>
          <span className={styles.statValue}>{c.value}</span>
          <span className={styles.statLabel}>{c.label}</span>
          {c.detail && <span className={styles.statDetail}>{c.detail}</span>}
        </div>
      ))}
    </div>
  );
}

export function ProcessFlowView({ steps }: { steps: NonNullable<ReadingSlide['processSteps']> }) {
  return (
    <div className={styles.processFlow}>
      {steps.slice(0, 6).map((s, i) => (
        <div key={i} className={styles.processItem}>
          <span className={`${styles.processNum} ${accentAt(i)}`}>{i + 1}</span>
          <div className={styles.processContent}>
            <span className={styles.processStep}>{s.step}</span>
            {s.detail && <span className={styles.processDetail}>{s.detail}</span>}
          </div>
          {i < steps.length - 1 && <span className={styles.processArrow}>→</span>}
        </div>
      ))}
    </div>
  );
}

export function PyramidView({ layers }: { layers: NonNullable<ReadingSlide['pyramidLayers']> }) {
  const total = Math.min(layers.length, 5);
  return (
    <div className={styles.pyramid}>
      {layers.slice(0, 5).map((l, i) => (
        <div key={i} className={`${styles.pyramidLayer} ${accentAt(i)}`}
          style={{ width: `${40 + (i / (total - 1 || 1)) * 60}%` }}>
          <span className={styles.pyramidLabel}>{l.label}</span>
          {l.detail && <span className={styles.pyramidDetail}>{l.detail}</span>}
        </div>
      ))}
    </div>
  );
}

export function ComparisonView({ data }: { data: NonNullable<ReadingSlide['comparisonData']> }) {
  return (
    <div className={styles.comparison}>
      <div className={styles.compHeader}>
        <span className={`${styles.compLabel} ${styles.accent_sage}`}>{data.leftLabel}</span>
        <span className={styles.compVs}>vs</span>
        <span className={`${styles.compLabel} ${styles.accent_indigo}`}>{data.rightLabel}</span>
      </div>
      <div className={styles.compColumns}>
        <ul className={styles.compList}>
          {data.leftPoints.map((p, i) => <li key={i}>{p}</li>)}
        </ul>
        <div className={styles.compDivider} />
        <ul className={styles.compList}>
          {data.rightPoints.map((p, i) => <li key={i}>{p}</li>)}
        </ul>
      </div>
    </div>
  );
}

export function FunnelView({ stages }: { stages: NonNullable<ReadingSlide['funnelStages']> }) {
  const total = Math.min(stages.length, 5);
  return (
    <div className={styles.funnel}>
      {stages.slice(0, 5).map((s, i) => (
        <div key={i} className={`${styles.funnelStage} ${accentAt(i)}`}
          style={{ width: `${100 - (i / (total - 1 || 1)) * 50}%` }}>
          <span className={styles.funnelLabel}>{s.stage}</span>
          {s.value && <span className={styles.funnelValue}>{s.value}</span>}
          {s.detail && <span className={styles.funnelDetail}>{s.detail}</span>}
        </div>
      ))}
    </div>
  );
}

export function CycleView({ steps }: { steps: NonNullable<ReadingSlide['cycleSteps']> }) {
  return (
    <div className={styles.cycle}>
      {steps.slice(0, 6).map((s, i) => (
        <div key={i} className={`${styles.cycleStep} ${accentAt(i)}`}>
          <span className={styles.cycleNum}>{i + 1}</span>
          <span className={styles.cycleLabel}>{s.step}</span>
          {s.detail && <span className={styles.cycleDetail}>{s.detail}</span>}
          <span className={styles.cycleArrow}>↓</span>
        </div>
      ))}
      <div className={styles.cycleReturn}>↩ return to step 1</div>
    </div>
  );
}

export function ChecklistView({ items }: { items: NonNullable<ReadingSlide['checklistItems']> }) {
  return (
    <ul className={styles.checklist}>
      {items.map((c, i) => (
        <li key={i} className={`${styles.checkItem} ${c.checked ? styles.checked : ''}`}>
          <span className={styles.checkMark}>{c.checked ? '✓' : '○'}</span>
          <span className={styles.checkText}>{c.item}</span>
        </li>
      ))}
    </ul>
  );
}

export function MatrixView({ data }: { data: NonNullable<ReadingSlide['matrixData']> }) {
  return (
    <div className={styles.matrix}>
      <div className={styles.matrixTop}>{data.topLabel}</div>
      <div className={styles.matrixBody}>
        <div className={styles.matrixLeft}>{data.leftLabel}</div>
        <div className={styles.matrixGrid}>
          {data.quadrants.map((q, i) => (
            <div key={i} className={`${styles.matrixCell} ${accentAt(i)}`}>{q}</div>
          ))}
        </div>
        <div className={styles.matrixRight}>{data.rightLabel}</div>
      </div>
      <div className={styles.matrixBottom}>{data.bottomLabel}</div>
    </div>
  );
}
