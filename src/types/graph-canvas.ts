/**
 * Graph Canvas types — nodes, edges, and canvas state
 * for the knowledge graph visualization.
 */
import type { MasteryLevel } from './mastery';

export type GraphNodeKind = 'concept' | 'thinker' | 'term' | 'curiosity';

export interface GraphNode {
  id: string;
  kind: GraphNodeKind;
  label: string;
  /** 0-100 for concepts and terms. */
  mastery?: number;
  masteryLevel?: MasteryLevel;
  /** Thinker's intellectual tradition. */
  tradition?: string;
  /** Thinker status. */
  status?: 'active' | 'dormant' | 'bridged' | 'pending';
  /** Whether this curiosity is resolved. */
  resolved?: boolean;
  x: number;
  y: number;
  /** Velocity for force simulation. */
  vx: number;
  vy: number;
  /** User has manually positioned this node. */
  pinned: boolean;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  type: string;
  weight: number;
  label?: string;
}

export interface GraphCanvasState {
  nodes: GraphNode[];
  edges: GraphEdge[];
  filters: Set<GraphNodeKind>;
  focusId: string | null;
  hoverId: string | null;
}
