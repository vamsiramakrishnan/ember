/**
 * GraphDetail — shows metadata for the focused graph node.
 * Appears at the bottom of the canvas. Quiet, paper background, rule border.
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
      {node.kind === 'concept' && <ConceptDetail node={node} />}
      {node.kind === 'thinker' && <ThinkerDetail node={node} />}
      {node.kind === 'term' && <TermDetail node={node} />}
      {node.kind === 'curiosity' && <CuriosityDetail node={node} />}
      {neighbors.length > 0 && (
        <p className={styles.neighbors}>
          Connected to: {neighbors.map((n) => n.label).join(', ')}
        </p>
      )}
    </div>
  );
}

function ConceptDetail({ node }: { node: GraphNode }) {
  return (
    <div>
      <span className={styles.conceptLabel}>{node.label}</span>
      {node.mastery !== undefined && (
        <span className={styles.meta}>{node.mastery}% mastery</span>
      )}
    </div>
  );
}

function ThinkerDetail({ node }: { node: GraphNode }) {
  return (
    <div>
      <span className={styles.thinkerName}>{node.label}</span>
      {node.detail && <span className={styles.meta}>{node.detail}</span>}
      {node.dates && <span className={styles.meta}>{node.dates}</span>}
    </div>
  );
}

function TermDetail({ node }: { node: GraphNode }) {
  return (
    <div>
      <span className={styles.termLabel}>{node.label}</span>
      {node.detail && <span className={styles.meta}>{node.detail}</span>}
    </div>
  );
}

function CuriosityDetail({ node }: { node: GraphNode }) {
  return (
    <div>
      <span className={styles.curiosityLabel}>{node.label}</span>
    </div>
  );
}
