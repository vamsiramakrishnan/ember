/**
 * GraphFilters (5.x) — quiet entity-kind filter toggles for the knowledge graph.
 * Each kind shows a subtle color dot matching its accent. Peripheral, unobtrusive.
 */
import type { GraphNodeKind } from '@/types/graph-canvas';
import styles from './GraphFilters.module.css';

interface GraphFiltersProps {
  filters: Set<GraphNodeKind>;
  onToggle: (kind: GraphNodeKind) => void;
}

const KINDS: { kind: GraphNodeKind; label: string; accent: string }[] = [
  { kind: 'concept', label: 'concepts', accent: 'sage' },
  { kind: 'thinker', label: 'thinkers', accent: 'amber' },
  { kind: 'term', label: 'terms', accent: 'indigo' },
  { kind: 'curiosity', label: 'questions', accent: 'margin' },
];

export function GraphFilters({ filters, onToggle }: GraphFiltersProps) {
  return (
    <div className={styles.row} role="group" aria-label="Filter graph by entity kind">
      {KINDS.map((item) => {
        const isActive = filters.has(item.kind);
        return (
          <button
            key={item.kind}
            className={isActive ? styles.active : styles.inactive}
            onClick={() => onToggle(item.kind)}
            aria-pressed={isActive}
            type="button"
          >
            <span className={`${styles.dot} ${styles[item.accent]}`} aria-hidden="true" />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
