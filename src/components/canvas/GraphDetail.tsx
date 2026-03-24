/**
 * GraphDetail — metadata panel for the focused graph node.
 * Warm, typographically refined, appears below the graph field.
 */
import type { GraphNode } from '@/types/graph-canvas';
import styles from './GraphDetail.module.css';

interface Neighbor {
  id: string;
  label: string;
  type: string;
}

interface GraphDetailProps {
  node: GraphNode;
  neighbors: Neighbor[];
}

export function GraphDetail({ node, neighbors }: GraphDetailProps) {
  return (
    <div className={styles.container} role="region" aria-label={`Details for ${node.label}`}>
      <div className={styles.header}>
        <span className={styles.name}>{node.label}</span>
        <span className={styles.kind}>{node.kind}</span>
      </div>
      {node.detail && <p className={styles.detail}>{node.detail}</p>}
      {node.dates && <span className={styles.meta}>{node.dates}</span>}
      {node.mastery !== undefined && node.mastery > 0 && (
        <div className={styles.masteryRow}>
          <div className={styles.masteryTrack}>
            <div className={styles.masteryFill} style={{ width: `${node.mastery}%` }} />
          </div>
          <span className={styles.masteryLabel}>{node.mastery}%</span>
        </div>
      )}
      {neighbors.length > 0 && (
        <p className={styles.neighbors}>
          {neighbors.map((n) => n.label).join(' · ')}
        </p>
      )}
    </div>
  );
}
