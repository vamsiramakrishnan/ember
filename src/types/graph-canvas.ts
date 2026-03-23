/**
 * Graph canvas types — shapes for the knowledge graph visualization.
 * Used by useGraphCanvas and KnowledgeCanvas components.
 */
import type { MasteryLevel } from './mastery';

/** The four kinds of entities that appear as nodes on the graph canvas. */
export type GraphNodeKind = 'concept' | 'thinker' | 'term' | 'curiosity';

/** A node in the knowledge graph canvas. */
export interface GraphNode {
  id: string;
  kind: GraphNodeKind;
  label: string;

  /** Mastery percentage (concepts and terms only). */
  mastery?: number;
  /** Mastery level (concepts and terms only). */
  masteryLevel?: MasteryLevel;
  /** Intellectual tradition (thinkers only). */
  tradition?: string;
  /** Encounter status (thinkers only). */
  status?: 'active' | 'dormant' | 'bridged' | 'pending';

  /** Spatial position — updated by force simulation or drag. */
  x: number;
  y: number;
  /** Velocity — used by force simulation. */
  vx: number;
  vy: number;
  /** Whether the user has manually positioned this node. */
  pinned: boolean;
}

/** A directed edge in the knowledge graph canvas. */
export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  type: string;
  weight: number;
  label?: string;
}
