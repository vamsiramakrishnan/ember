/**
 * Graph Layout — pure functions for computing initial node positions.
 * Radial layout for reduced-motion, random-seeded for force simulation.
 */
import type { GraphNode } from '@/types/graph-canvas';

/** Place nodes in a radial pattern centered on the viewport. */
export function radialLayout(
  nodes: GraphNode[],
  width: number,
  height: number,
): GraphNode[] {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.35;

  return nodes.map((node, i) => {
    if (node.pinned) return node;
    const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
    return {
      ...node,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
      vx: 0,
      vy: 0,
    };
  });
}

/** Place nodes randomly within bounds, seeded from IDs for consistency. */
export function randomLayout(
  nodes: GraphNode[],
  width: number,
  height: number,
): GraphNode[] {
  const pad = 60;
  return nodes.map((node) => {
    if (node.pinned) return node;
    // Simple hash from ID for deterministic placement
    let hash = 0;
    for (let i = 0; i < node.id.length; i++) {
      hash = ((hash << 5) - hash + node.id.charCodeAt(i)) | 0;
    }
    const hx = ((hash >>> 0) % 1000) / 1000;
    const hy = ((((hash >>> 16) ^ (hash << 3)) >>> 0) % 1000) / 1000;
    return {
      ...node,
      x: pad + hx * (width - pad * 2),
      y: pad + hy * (height - pad * 2),
      vx: 0,
      vy: 0,
    };
  });
}

/** Compute the radius of a node based on its kind and mastery. */
export function nodeRadius(node: GraphNode): number {
  switch (node.kind) {
    case 'concept': return 6 + ((node.mastery ?? 0) / 100) * 10;
    case 'thinker': return 12;
    case 'term': return 8;
    case 'curiosity': return 10;
  }
}

/** Categorize a relation type for visual styling. */
export type EdgeCategory =
  | 'knowledge'
  | 'bridge'
  | 'conversational'
  | 'contradiction'
  | 'echo';

export function edgeCategory(type: string): EdgeCategory {
  if (['bridges-to', 'cross-references'].includes(type)) return 'bridge';
  if (['prompted-by', 'follow-up', 'extends', 'confirms'].includes(type)) {
    return 'conversational';
  }
  if (type === 'contradicts') return 'contradiction';
  if (type === 'echoes') return 'echo';
  return 'knowledge';
}
