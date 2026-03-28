/**
 * Diagram Layout Engines — pure functions that compute node positions
 * and edge paths for each DiagramLayout type.
 *
 * Each engine takes:
 *   - items: DiagramNode[] (the nodes)
 *   - edges: DiagramEdge[] (the relationships)
 *   - width/height: container dimensions
 *
 * And returns:
 *   - positions: Map<index, {x, y}> — where to place each node
 *   - edgePaths: Array<{d, labelX, labelY, edge}> — SVG path data
 *
 * All positions are center-anchored (the node component offsets by -50%).
 * All engines produce viewBox-safe coordinates for SVG overlay.
 */
import type { DiagramNode, DiagramEdge, DiagramLayout } from '@/types/entries';

export interface NodePosition {
  x: number;
  y: number;
}

export interface EdgePathData {
  d: string;
  labelX: number;
  labelY: number;
  edge: DiagramEdge;
}

export interface LayoutResult {
  positions: Map<number, NodePosition>;
  edgePaths: EdgePathData[];
  /** Minimum width needed to render without clipping. */
  minWidth: number;
  /** Minimum height needed to render without clipping. */
  minHeight: number;
}

// ─── Node sizing constants ──────────────────────────────────────

const NODE_W = 160;
const NODE_H = 72;
const GAP_X = 48;
const GAP_Y = 48;
const PADDING = 40;

// ─── Main dispatcher ────────────────────────────────────────────

export function computeLayout(
  layout: DiagramLayout,
  items: DiagramNode[],
  edges: DiagramEdge[],
  width: number,
  height: number,
): LayoutResult {
  switch (layout) {
    case 'flow': return flowLayout(items, edges, width, height);
    case 'tree': return treeLayout(items, edges, width, height);
    case 'radial': return radialLayout(items, edges, width, height);
    case 'pyramid': return pyramidLayout(items, edges, width, height);
    case 'cycle': return cycleLayout(items, edges, width, height);
    case 'timeline': return timelineLayout(items, edges, width, height);
    case 'constellation': return constellationLayout(items, edges, width, height);
    case 'graph': return graphLayout(items, edges, width, height);
    default: return flowLayout(items, edges, width, height);
  }
}

// ─── Edge path computation ──────────────────────────────────────

function bezierPath(
  x1: number, y1: number, x2: number, y2: number,
): string {
  const cy = Math.abs(y2 - y1) * 0.4;
  const cx = Math.abs(x2 - x1) * 0.2;
  if (Math.abs(y2 - y1) > Math.abs(x2 - x1)) {
    // More vertical: use vertical control points
    return `M ${x1} ${y1} C ${x1} ${y1 + cy}, ${x2} ${y2 - cy}, ${x2} ${y2}`;
  }
  // More horizontal: use horizontal control points
  const dx = x2 > x1 ? cx : -cx;
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

function computeEdgePaths(
  edges: DiagramEdge[],
  positions: Map<number, NodePosition>,
): EdgePathData[] {
  return edges.map((edge) => {
    const from = positions.get(edge.from);
    const to = positions.get(edge.to);
    if (!from || !to) {
      return { d: '', labelX: 0, labelY: 0, edge };
    }
    const d = bezierPath(from.x, from.y + NODE_H / 2, to.x, to.y - NODE_H / 2);
    return {
      d,
      labelX: (from.x + to.x) / 2,
      labelY: (from.y + to.y) / 2,
      edge,
    };
  });
}

/** Horizontal edge path for flow layout. */
function horizontalBezier(
  x1: number, y1: number, x2: number, y2: number,
): string {
  const cx = Math.abs(x2 - x1) * 0.4;
  return `M ${x1} ${y1} C ${x1 + cx} ${y1}, ${x2 - cx} ${y2}, ${x2} ${y2}`;
}

function computeHorizontalEdgePaths(
  edges: DiagramEdge[],
  positions: Map<number, NodePosition>,
): EdgePathData[] {
  return edges.map((edge) => {
    const from = positions.get(edge.from);
    const to = positions.get(edge.to);
    if (!from || !to) {
      return { d: '', labelX: 0, labelY: 0, edge };
    }
    const d = horizontalBezier(
      from.x + NODE_W / 2, from.y,
      to.x - NODE_W / 2, to.y,
    );
    return {
      d,
      labelX: (from.x + to.x) / 2,
      labelY: Math.min(from.y, to.y) - 12,
      edge,
    };
  });
}

// ─── FLOW: A → B → C → D ───────────────────────────────────────

function flowLayout(
  items: DiagramNode[],
  edges: DiagramEdge[],
  width: number,
  _height: number,
): LayoutResult {
  const positions = new Map<number, NodePosition>();
  const totalW = items.length * NODE_W + (items.length - 1) * GAP_X;
  const startX = Math.max(PADDING, (width - totalW) / 2) + NODE_W / 2;
  const cy = PADDING + NODE_H / 2;

  for (let i = 0; i < items.length; i++) {
    positions.set(i, { x: startX + i * (NODE_W + GAP_X), y: cy });
  }

  // Auto-generate sequential edges if none provided
  const effectiveEdges = edges.length > 0 ? edges : items.slice(1).map((_, i) => ({
    from: i, to: i + 1, type: 'enables' as const,
  }));

  return {
    positions,
    edgePaths: computeHorizontalEdgePaths(effectiveEdges, positions),
    minWidth: totalW + PADDING * 2,
    minHeight: NODE_H + PADDING * 2,
  };
}

// ─── TREE: top-down hierarchy ───────────────────────────────────

function treeLayout(
  items: DiagramNode[],
  edges: DiagramEdge[],
  width: number,
  _height: number,
): LayoutResult {
  const positions = new Map<number, NodePosition>();

  // Build layers from children structure
  const layers: number[][] = [];
  const queue: Array<{ index: number; depth: number }> = [];

  // Find root nodes (those not appearing as children of others)
  const childIndices = new Set<number>();
  for (const item of items) {
    if (item.children) {
      for (let ci = 0; ci < item.children.length; ci++) {
        // Find child index in items array
        const childLabel = item.children[ci]?.label;
        const idx = items.findIndex((it, ii) => ii > 0 && it.label === childLabel);
        if (idx >= 0) childIndices.add(idx);
      }
    }
  }
  // Also use edges to determine hierarchy
  for (const e of edges) childIndices.add(e.to);

  const roots = items.map((_, i) => i).filter((i) => !childIndices.has(i));
  if (roots.length === 0 && items.length > 0) roots.push(0);

  for (const r of roots) queue.push({ index: r, depth: 0 });

  const visited = new Set<number>();
  while (queue.length > 0) {
    const { index, depth } = queue.shift()!;
    if (visited.has(index)) continue;
    visited.add(index);

    if (!layers[depth]) layers[depth] = [];
    layers[depth].push(index);

    // Children from edges
    for (const e of edges) {
      if (e.from === index && !visited.has(e.to)) {
        queue.push({ index: e.to, depth: depth + 1 });
      }
    }
  }

  // Add any unvisited nodes to the last layer
  for (let i = 0; i < items.length; i++) {
    if (!visited.has(i)) {
      if (!layers[layers.length - 1]) layers.push([]);
      layers[layers.length - 1]!.push(i);
    }
  }

  // Position nodes in layers
  let maxLayerWidth = 0;
  for (let d = 0; d < layers.length; d++) {
    const layer = layers[d]!;
    const layerW = layer.length * NODE_W + (layer.length - 1) * GAP_X;
    maxLayerWidth = Math.max(maxLayerWidth, layerW);
    const startX = Math.max(PADDING, (width - layerW) / 2) + NODE_W / 2;
    const y = PADDING + NODE_H / 2 + d * (NODE_H + GAP_Y);

    for (let i = 0; i < layer.length; i++) {
      positions.set(layer[i]!, { x: startX + i * (NODE_W + GAP_X), y });
    }
  }

  return {
    positions,
    edgePaths: computeEdgePaths(edges, positions),
    minWidth: maxLayerWidth + PADDING * 2,
    minHeight: layers.length * (NODE_H + GAP_Y) - GAP_Y + PADDING * 2,
  };
}

// ─── RADIAL: center node with radiating connections ─────────────

function radialLayout(
  items: DiagramNode[],
  edges: DiagramEdge[],
  width: number,
  height: number,
): LayoutResult {
  const positions = new Map<number, NodePosition>();
  if (items.length === 0) return { positions, edgePaths: [], minWidth: 0, minHeight: 0 };

  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) / 2 - NODE_W / 2 - PADDING;

  // Center node is items[0]
  positions.set(0, { x: cx, y: cy });

  // Remaining nodes arranged in a circle
  const rest = items.length - 1;
  for (let i = 1; i < items.length; i++) {
    const angle = (2 * Math.PI * (i - 1)) / Math.max(rest, 1) - Math.PI / 2;
    positions.set(i, {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
  }

  // Auto-generate radial edges if none provided
  const effectiveEdges = edges.length > 0 ? edges : items.slice(1).map((_, i) => ({
    from: 0, to: i + 1, type: 'enables' as const,
  }));

  // Straight lines for radial (not bezier)
  const edgePaths: EdgePathData[] = effectiveEdges.map((edge) => {
    const from = positions.get(edge.from);
    const to = positions.get(edge.to);
    if (!from || !to) return { d: '', labelX: 0, labelY: 0, edge };
    return {
      d: `M ${from.x} ${from.y} L ${to.x} ${to.y}`,
      labelX: (from.x + to.x) / 2,
      labelY: (from.y + to.y) / 2 - 8,
      edge,
    };
  });

  const size = radius * 2 + NODE_W + PADDING * 2;
  return { positions, edgePaths, minWidth: size, minHeight: size };
}

// ─── PYRAMID: layered foundation-to-peak ────────────────────────

function pyramidLayout(
  items: DiagramNode[],
  edges: DiagramEdge[],
  width: number,
  _height: number,
): LayoutResult {
  const positions = new Map<number, NodePosition>();
  if (items.length === 0) return { positions, edgePaths: [], minWidth: 0, minHeight: 0 };

  // Distribute items into pyramid layers: 1, 2, 3, 4...
  // items[0] is the peak
  const layers: number[][] = [];
  let idx = 0;
  let layerSize = 1;
  while (idx < items.length) {
    const layer: number[] = [];
    for (let i = 0; i < layerSize && idx < items.length; i++, idx++) {
      layer.push(idx);
    }
    layers.push(layer);
    layerSize++;
  }

  // Position: peak at top, widening downward
  const totalHeight = layers.length * (NODE_H + GAP_Y) - GAP_Y;
  const maxLayerCount = layers[layers.length - 1]?.length ?? 1;
  const maxLayerWidth = maxLayerCount * NODE_W + (maxLayerCount - 1) * GAP_X;

  for (let d = 0; d < layers.length; d++) {
    const layer = layers[d]!;
    const layerW = layer.length * NODE_W + (layer.length - 1) * GAP_X;
    const startX = Math.max(PADDING, (width - layerW) / 2) + NODE_W / 2;
    const y = PADDING + NODE_H / 2 + d * (NODE_H + GAP_Y);

    for (let i = 0; i < layer.length; i++) {
      positions.set(layer[i]!, { x: startX + i * (NODE_W + GAP_X), y });
    }
  }

  // Auto-generate edges from each layer to the next if none provided
  const effectiveEdges = edges.length > 0 ? edges : (() => {
    const auto: DiagramEdge[] = [];
    for (let d = 0; d < layers.length - 1; d++) {
      for (const from of layers[d]!) {
        for (const to of layers[d + 1]!) {
          auto.push({ from, to, type: 'requires' });
        }
      }
    }
    return auto;
  })();

  return {
    positions,
    edgePaths: computeEdgePaths(effectiveEdges, positions),
    minWidth: maxLayerWidth + PADDING * 2,
    minHeight: totalHeight + PADDING * 2,
  };
}

// ─── CYCLE: circular loop ───────────────────────────────────────

function cycleLayout(
  items: DiagramNode[],
  edges: DiagramEdge[],
  width: number,
  height: number,
): LayoutResult {
  const positions = new Map<number, NodePosition>();
  if (items.length === 0) return { positions, edgePaths: [], minWidth: 0, minHeight: 0 };

  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) / 2 - NODE_W / 2 - PADDING;

  // All nodes in a circle, starting from top
  for (let i = 0; i < items.length; i++) {
    const angle = (2 * Math.PI * i) / items.length - Math.PI / 2;
    positions.set(i, {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
  }

  // Auto-generate cycle edges if none provided
  const effectiveEdges = edges.length > 0 ? edges : items.map((_, i) => ({
    from: i, to: (i + 1) % items.length, type: 'enables' as const,
  }));

  // Arc paths following the circle
  const edgePaths: EdgePathData[] = effectiveEdges.map((edge) => {
    const from = positions.get(edge.from);
    const to = positions.get(edge.to);
    if (!from || !to) return { d: '', labelX: 0, labelY: 0, edge };

    // Use a quadratic bezier that curves outward from the circle center
    const mx = (from.x + to.x) / 2;
    const my = (from.y + to.y) / 2;
    // Push control point away from center
    const dx = mx - cx;
    const dy = my - cy;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const bulge = radius * 0.15;
    const ctrlX = mx + (dx / dist) * bulge;
    const ctrlY = my + (dy / dist) * bulge;

    return {
      d: `M ${from.x} ${from.y} Q ${ctrlX} ${ctrlY} ${to.x} ${to.y}`,
      labelX: ctrlX,
      labelY: ctrlY - 10,
      edge,
    };
  });

  const size = radius * 2 + NODE_W + PADDING * 2;
  return { positions, edgePaths, minWidth: size, minHeight: size };
}

// ─── TIMELINE: temporal sequence ────────────────────────────────

function timelineLayout(
  items: DiagramNode[],
  edges: DiagramEdge[],
  width: number,
  _height: number,
): LayoutResult {
  const positions = new Map<number, NodePosition>();
  if (items.length === 0) return { positions, edgePaths: [], minWidth: 0, minHeight: 0 };

  // Vertical timeline: nodes stacked vertically with alternating left/right offset
  const centerX = width / 2;
  const offset = NODE_W / 2 + 24; // Left/right offset from center line

  for (let i = 0; i < items.length; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const y = PADDING + NODE_H / 2 + i * (NODE_H + GAP_Y);
    positions.set(i, { x: centerX + side * offset, y });
  }

  // Timeline spine: vertical line connecting all points
  const firstY = PADDING + NODE_H / 2;
  const lastY = PADDING + NODE_H / 2 + (items.length - 1) * (NODE_H + GAP_Y);
  const spinePath: EdgePathData = {
    d: `M ${centerX} ${firstY} L ${centerX} ${lastY}`,
    labelX: 0,
    labelY: 0,
    edge: { from: 0, to: items.length - 1, type: 'enables' },
  };

  // Horizontal connectors from spine to each node
  const connectors: EdgePathData[] = items.map((_, i) => {
    const pos = positions.get(i)!;
    const side = i % 2 === 0 ? -1 : 1;
    const nodeEdgeX = pos.x + (side > 0 ? -NODE_W / 2 : NODE_W / 2);
    return {
      d: `M ${centerX} ${pos.y} L ${nodeEdgeX} ${pos.y}`,
      labelX: 0,
      labelY: 0,
      edge: { from: i, to: i },
    };
  });

  return {
    positions,
    edgePaths: [spinePath, ...connectors, ...computeEdgePaths(edges, positions)],
    minWidth: NODE_W * 2 + offset * 2 + PADDING * 2,
    minHeight: items.length * (NODE_H + GAP_Y) - GAP_Y + PADDING * 2,
  };
}

// ─── CONSTELLATION: force-directed (simplified for inline) ──────

function constellationLayout(
  items: DiagramNode[],
  edges: DiagramEdge[],
  width: number,
  height: number,
): LayoutResult {
  const positions = new Map<number, NodePosition>();
  if (items.length === 0) return { positions, edgePaths: [], minWidth: 0, minHeight: 0 };

  const cx = width / 2;
  const cy = height / 2;

  // Initialize positions in a circle
  const radius = Math.min(width, height) / 2 - NODE_W / 2 - PADDING;
  const nodes: Array<{ x: number; y: number; vx: number; vy: number }> = items.map((_, i) => {
    const angle = (2 * Math.PI * i) / items.length;
    return {
      x: cx + radius * Math.cos(angle) * 0.6,
      y: cy + radius * Math.sin(angle) * 0.6,
      vx: 0, vy: 0,
    };
  });

  // Run simplified force simulation (60 ticks)
  const REPULSION = 2500;
  const ATTRACTION = 0.008;
  const DAMPING = 0.85;

  for (let tick = 0; tick < 60; tick++) {
    // Repulsion between all pairs
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i]!.x - nodes[j]!.x;
        const dy = nodes[i]!.y - nodes[j]!.y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const force = REPULSION / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        nodes[i]!.vx += fx; nodes[i]!.vy += fy;
        nodes[j]!.vx -= fx; nodes[j]!.vy -= fy;
      }
    }

    // Attraction along edges
    for (const edge of edges) {
      const a = nodes[edge.from];
      const b = nodes[edge.to];
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const force = dist * ATTRACTION;
      a.vx += (dx / dist) * force;
      a.vy += (dy / dist) * force;
      b.vx -= (dx / dist) * force;
      b.vy -= (dy / dist) * force;
    }

    // Center gravity
    for (const node of nodes) {
      node.vx += (cx - node.x) * 0.001;
      node.vy += (cy - node.y) * 0.001;
    }

    // Apply velocity with damping
    for (const node of nodes) {
      node.vx *= DAMPING;
      node.vy *= DAMPING;
      node.x += node.vx;
      node.y += node.vy;
      // Contain within bounds
      node.x = Math.max(PADDING + NODE_W / 2, Math.min(width - PADDING - NODE_W / 2, node.x));
      node.y = Math.max(PADDING + NODE_H / 2, Math.min(height - PADDING - NODE_H / 2, node.y));
    }
  }

  for (let i = 0; i < nodes.length; i++) {
    positions.set(i, { x: nodes[i]!.x, y: nodes[i]!.y });
  }

  // Straight lines for constellation (cleaner at small scale)
  const edgePaths: EdgePathData[] = edges.map((edge) => {
    const from = positions.get(edge.from);
    const to = positions.get(edge.to);
    if (!from || !to) return { d: '', labelX: 0, labelY: 0, edge };
    return {
      d: `M ${from.x} ${from.y} L ${to.x} ${to.y}`,
      labelX: (from.x + to.x) / 2,
      labelY: (from.y + to.y) / 2 - 8,
      edge,
    };
  });

  const size = radius * 2 + NODE_W + PADDING * 2;
  return { positions, edgePaths, minWidth: size, minHeight: size };
}

// ─── GRAPH: general typed-edge graph (existing behavior, improved) ──

function graphLayout(
  items: DiagramNode[],
  edges: DiagramEdge[],
  width: number,
  height: number,
): LayoutResult {
  // If few nodes and no edges, use flow
  if (edges.length === 0 && items.length <= 5) {
    return flowLayout(items, edges, width, height);
  }
  // If edges present, use the constellation force layout for better positioning
  if (edges.length > 0) {
    return constellationLayout(items, edges, width, height);
  }
  // Fallback: grid arrangement
  const positions = new Map<number, NodePosition>();
  const cols = Math.ceil(Math.sqrt(items.length));
  for (let i = 0; i < items.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    positions.set(i, {
      x: PADDING + NODE_W / 2 + col * (NODE_W + GAP_X),
      y: PADDING + NODE_H / 2 + row * (NODE_H + GAP_Y),
    });
  }
  const rows = Math.ceil(items.length / cols);
  return {
    positions,
    edgePaths: computeEdgePaths(edges, positions),
    minWidth: cols * (NODE_W + GAP_X) - GAP_X + PADDING * 2,
    minHeight: rows * (NODE_H + GAP_Y) - GAP_Y + PADDING * 2,
  };
}

// ─── Layout auto-detection (backward compat) ────────────────────

/**
 * Infer the best layout from data shape when no layout is specified.
 * Preserves backward compatibility with existing concept-diagram entries.
 */
export function inferLayout(
  items: DiagramNode[],
  edges?: DiagramEdge[],
): DiagramLayout {
  const hasChildren = items.some((n) => n.children && n.children.length > 0);
  const hasEdges = edges && edges.length > 0;

  if (hasChildren) return 'tree';
  if (hasEdges) return 'graph';
  if (items.length <= 5) return 'flow';
  return 'graph';
}
