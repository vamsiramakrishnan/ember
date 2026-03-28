/**
 * useForceLayout — force-directed layout for the knowledge graph.
 * was: uniform attraction (0.005) regardless of edge weight
 * now: attraction scales with edge.weight, kind-based repulsion modifiers
 * reason: stronger relationships should pull nodes closer; related concepts
 *         should cluster while different kinds maintain visual separation
 *
 * Respects prefers-reduced-motion by snapping to final positions.
 */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { CanvasNode, GraphEdge, LayoutNode } from '@/types/graph-canvas';

interface ForceOptions { width: number; height: number; enabled: boolean }

/* was: REPULSION=3000, ATTRACTION=0.005 (fixed)
 * now: ATTRACTION_BASE=0.003, scaled by edge.weight (0.003–0.012)
 * reason: weighted attraction creates meaningful clusters */
const REPULSION = 3500;
const ATTRACTION_BASE = 0.003;
const ATTRACTION_WEIGHT_SCALE = 0.003;
const DAMPING = 0.85;
const MIN_VELOCITY = 0.1;
const MAX_TICKS = 300;

/** Same-kind nodes repel less — they cluster gently.
 * was: uniform repulsion, now: 0.7x for same-kind pairs
 * reason: concepts should drift toward concepts, thinkers toward thinkers */
const SAME_KIND_REPULSION_FACTOR = 0.7;

function initLayout(nodes: CanvasNode[], width: number, height: number): LayoutNode[] {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.3;
  return nodes.map((n, i) => {
    const angle = (2 * Math.PI * i) / Math.max(nodes.length, 1);
    return {
      ...n,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
      vx: 0, vy: 0, pinned: false,
    };
  });
}

function tick(nodes: LayoutNode[], edges: GraphEdge[], width: number, height: number) {
  const cx = width / 2;
  const cy = height / 2;

  for (const node of nodes) {
    if (node.pinned) continue;
    let fx = 0;
    let fy = 0;

    // Repulsion from all other nodes
    for (const other of nodes) {
      if (other.id === node.id) continue;
      const dx = node.x - other.x;
      const dy = node.y - other.y;
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
      /* Same-kind repulsion is reduced so similar nodes cluster */
      const kindFactor = node.kind === other.kind ? SAME_KIND_REPULSION_FACTOR : 1;
      const force = (REPULSION * kindFactor) / (dist * dist);
      fx += (dx / dist) * force;
      fy += (dy / dist) * force;
    }

    // Attraction along edges — scaled by weight
    for (const edge of edges) {
      let other: LayoutNode | undefined;
      if (edge.from === node.id) other = nodes.find((n) => n.id === edge.to);
      else if (edge.to === node.id) other = nodes.find((n) => n.id === edge.from);
      if (!other) continue;
      const dx = other.x - node.x;
      const dy = other.y - node.y;
      /* was: fixed 0.005, now: base + weight contribution
       * stronger edges pull nodes closer together */
      const strength = ATTRACTION_BASE + edge.weight * ATTRACTION_WEIGHT_SCALE;
      fx += dx * strength;
      fy += dy * strength;
    }

    // Centering force
    fx += (cx - node.x) * 0.001;
    fy += (cy - node.y) * 0.001;

    node.vx = (node.vx + fx) * DAMPING;
    node.vy = (node.vy + fy) * DAMPING;
  }

  // Apply velocities and clamp
  for (const node of nodes) {
    if (node.pinned) continue;
    node.x = Math.max(40, Math.min(width - 40, node.x + node.vx));
    node.y = Math.max(40, Math.min(height - 40, node.y + node.vy));
  }
}

function isSettled(nodes: LayoutNode[]): boolean {
  return nodes.every(
    (n) => n.pinned || (Math.abs(n.vx) < MIN_VELOCITY && Math.abs(n.vy) < MIN_VELOCITY),
  );
}

export function useForceLayout(
  nodes: CanvasNode[],
  edges: GraphEdge[],
  options: ForceOptions,
) {
  const { width, height, enabled } = options;
  const [layoutNodes, setLayoutNodes] = useState<LayoutNode[]>([]);
  const nodesRef = useRef(layoutNodes);
  const tickCount = useRef(0);
  const rafRef = useRef(0);

  // Stabilize node identity — only re-init when the set of IDs changes
  const nodeKey = useMemo(() => nodes.map((n) => n.id).join(','), [nodes]);

  // Re-initialize when node set changes
  useEffect(() => {
    const layout = initLayout(nodes, width, height);
    // Preserve pinned positions from previous layout
    for (const ln of layout) {
      const prev = nodesRef.current.find((p) => p.id === ln.id);
      if (prev?.pinned) { ln.x = prev.x; ln.y = prev.y; ln.pinned = true; }
    }
    nodesRef.current = layout;
    tickCount.current = 0;
    setLayoutNodes([...layout]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeKey, width, height]);

  // Keep edges in a ref to avoid unstable array reference in effect deps
  const edgesRef = useRef(edges);
  edgesRef.current = edges;
  const edgeKey = useMemo(() => edges.map((e) => `${e.from}-${e.to}`).join(','), [edges]);

  // Animation loop
  useEffect(() => {
    if (!enabled || nodesRef.current.length === 0) return;

    const currentEdges = edgesRef.current;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      for (let i = 0; i < MAX_TICKS; i++) {
        tick(nodesRef.current, currentEdges, width, height);
        if (isSettled(nodesRef.current)) break;
      }
      setLayoutNodes([...nodesRef.current]);
      return;
    }

    const step = () => {
      if (tickCount.current >= MAX_TICKS || isSettled(nodesRef.current)) return;
      tick(nodesRef.current, edgesRef.current, width, height);
      tickCount.current++;
      setLayoutNodes([...nodesRef.current]);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);

    return () => cancelAnimationFrame(rafRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, edgeKey, width, height]);

  const pinNode = useCallback((id: string, x: number, y: number) => {
    const node = nodesRef.current.find((n) => n.id === id);
    if (node) {
      node.x = x; node.y = y;
      node.vx = 0; node.vy = 0;
      node.pinned = true;
      setLayoutNodes([...nodesRef.current]);
    }
  }, []);

  return { layoutNodes, pinNode };
}
