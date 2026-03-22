/**
 * Concept Diagram (2.4)
 * Visual relationship map between ideas.
 * Renders as connected cards with SVG arrows between them.
 * See: 06-component-inventory.md, Family 2.
 */
import type { DiagramNode } from '@/types/entries';
import styles from './ConceptDiagram.module.css';

interface ConceptDiagramProps {
  items: DiagramNode[];
}

export function ConceptDiagram({ items }: ConceptDiagramProps) {
  if (items.length === 0) return null;

  return (
    <div className={styles.container}>
      <div className={styles.flow}>
        {items.map((node, i) => (
          <div key={i} className={styles.step}>
            {i > 0 && (
              <svg className={styles.connector} viewBox="0 0 32 24" aria-hidden="true">
                <path d="M 0 12 L 24 12" stroke="currentColor" strokeWidth="1" fill="none" />
                <path d="M 20 7 L 27 12 L 20 17" stroke="currentColor" strokeWidth="1" fill="none" />
              </svg>
            )}
            <div className={styles.card}>
              <span className={styles.label}>{node.label}</span>
              {node.subLabel && (
                <span className={styles.sub}>{node.subLabel}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
