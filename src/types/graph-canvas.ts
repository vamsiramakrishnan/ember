/**
 * Graph canvas types — data structures for the knowledge graph visualization.
 * Nodes represent entities (concepts, thinkers, terms, curiosities).
 * Edges represent relations between them.
 */

export type GraphNodeKind = 'concept' | 'thinker' | 'term' | 'curiosity';

export interface CanvasNode {
  id: string;
  kind: GraphNodeKind;
  label: string;
  /** Mastery 0–100 for concepts/terms. */
  mastery?: number;
  /** Thinker tradition or term definition. */
  detail?: string;
  /** Thinker dates. */
  dates?: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  /** The relation type (e.g., "explores", "bridges-to") — used for edge styling. */
  relation: string;
  /** Optional descriptive label (metadata text). */
  label?: string;
  weight: number;
}

export interface LayoutNode extends CanvasNode {
  x: number;
  y: number;
  /** Whether the node has been manually pinned. */
  pinned: boolean;
  vx: number;
  vy: number;
}

export interface SavedPosition {
  id: string;
  x: number;
  y: number;
  pinned: boolean;
}
