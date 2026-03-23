/**
 * GraphFilters (5.x) — quiet entity-kind filter toggles for the knowledge graph.
 * Follows the peripheral element pattern: small, faint, unobtrusive.
 */
import type { GraphNodeKind } from '@/types/graph-canvas';
import styles from './GraphFilters.module.css';

interface GraphFiltersProps {
  filters: Set<GraphNodeKind>;
  onToggle: (kind: GraphNodeKind) => void;
}

const KINDS: { kind: GraphNodeKind; label: string }[] = [
  { kind: 'concept', label: 'concepts' },
  { kind: 'thinker', label: 'thinkers' },
  { kind: 'term', label: 'terms' },
  { kind: 'curiosity', label: 'questions' },
];

export function GraphFilters({ filters, onToggle }: GraphFiltersProps) {
  return (
    <div className={styles.row} role="group" aria-label="Filter graph by entity kind">
      {KINDS.map((item, i) => (
        <span key={item.kind} className={styles.item}>
          {i > 0 && <span className={styles.separator} aria-hidden="true">&middot;</span>}
          <button
            className={filters.has(item.kind) ? styles.active : styles.inactive}
            onClick={() => onToggle(item.kind)}
            aria-pressed={filters.has(item.kind)}
            type="button"
          >
            {item.label}
          </button>
        </span>
      ))}
    </div>
  );
}
