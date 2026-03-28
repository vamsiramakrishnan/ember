/**
 * Graph layout utilities — type extensions and edge classification
 * for the knowledge graph canvas rendering.
 */
import type { GraphNode as BaseGraphNode, GraphEdge, NodeType } from '@/services/knowledge-graph';

export type { GraphEdge };

/** Utility type: adds spatial coordinates to any node type. */
export type Positioned<T> = T & { x: number; y: number };

/**
 * A domain graph node with spatial position and optional mastery.
 * Extends the base GraphNode from the knowledge graph service
 * with rendering-specific fields.
 */
export interface PositionedNode extends BaseGraphNode {
  x: number;
  y: number;
  mastery?: number;
}

/** Visual category for edge styling. */
export type EdgeCategory =
  | 'knowledge'
  | 'bridge'
  | 'conversational'
  | 'contradiction'
  | 'echo';

/** Maps a relation string from GraphEdge to a visual category. */
export function edgeCategory(relation: string): EdgeCategory {
  switch (relation) {
    case 'explores':
    case 'defines':
    case 'references':
    case 'introduces':
      return 'knowledge';
    case 'bridges-to':
    case 'cross-ref':
      return 'bridge';
    case 'prompted-by':
    case 'follow-up':
    case 'extends':
    case 'confirms':
    case 'mentions':
      return 'conversational';
    case 'contradicts':
      return 'contradiction';
    case 'echoes':
      return 'echo';
    default:
      return 'knowledge';
  }
}

/**
 * Maps NodeType to the visual variant used in rendering.
 * The knowledge graph uses 'question' where the canvas renders 'curiosity'.
 */
export type VisualNodeType = 'concept' | 'thinker' | 'term' | 'curiosity';

export function visualNodeType(type: NodeType): VisualNodeType {
  switch (type) {
    case 'concept': return 'concept';
    case 'thinker': return 'thinker';
    case 'term': return 'term';
    case 'question': return 'curiosity';
    default: return 'concept';
  }
}
