/**
 * Concept Diagram (2.4)
 * Visual representation of relationships between ideas.
 * Nodes with arrows, sketched-on-paper feeling.
 * See: 06-component-inventory.md, Family 2.
 */
import type { DiagramNode } from '@/types/entries';
import styles from './ConceptDiagram.module.css';

interface ConceptDiagramProps {
  items: DiagramNode[];
}

export function ConceptDiagram({ items }: ConceptDiagramProps) {
  return (
    <div className={styles.container}>
      <div className={styles.nodes}>
        {items.map((node, i) => (
          <div key={i} className={styles.nodeGroup}>
            {i > 0 && (
              <span className={styles.arrow}>→</span>
            )}
            <div className={styles.nodeContent}>
              <div className={styles.nodeLabel}>{node.label}</div>
              {node.subLabel && (
                <div className={styles.nodeSub}>{node.subLabel}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
