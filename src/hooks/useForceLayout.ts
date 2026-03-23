/**
 * useForceLayout — force-directed layout for the knowledge graph.
 * Respects prefers-reduced-motion by snapping to final positions.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import type { GraphNode, GraphEdge, LayoutNode } from '@/types/graph-canvas';

interface ForceOptions { width: number; height: number; enabled: boolean }

const REPULSION = 3000;
const ATTRACTION = 0.005;
const DAMPING = 0.85;
const MIN_VELOCITY = 0.1;
const MAX_TICKS = 300;

function initLayout(nodes: GraphNode[], width: number, height: number): LayoutNode[] {
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
      const force = REPULSION / (dist * dist);
      fx += (dx / dist) * force;
      fy += (dy / dist) * force;
    }

    // Attraction along edges
    for (const edge of edges) {
      let other: LayoutNode | undefined;
      if (edge.from === node.id) other = nodes.find((n) => n.id === edge.to);
      else if (edge.to === node.id) other = nodes.find((n) => n.id === edge.from);
      if (!other) continue;
      const dx = other.x - node.x;
      const dy = other.y - node.y;
      fx += dx * ATTRACTION;
      fy += dy * ATTRACTION;
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
  nodes: GraphNode[],
  edges: GraphEdge[],
  options: ForceOptions,
) {
  const { width, height, enabled } = options;
  const [layoutNodes, setLayoutNodes] = useState<LayoutNode[]>([]);
  const nodesRef = useRef(layoutNodes);
  const tickCount = useRef(0);
  const rafRef = useRef(0);

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
  }, [nodes, width, height]);

  // Animation loop
  useEffect(() => {
    if (!enabled || nodesRef.current.length === 0) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      // Run simulation to completion synchronously
      for (let i = 0; i < MAX_TICKS; i++) {
        tick(nodesRef.current, edges, width, height);
        if (isSettled(nodesRef.current)) break;
      }
      setLayoutNodes([...nodesRef.current]);
      return;
    }

    const step = () => {
      if (tickCount.current >= MAX_TICKS || isSettled(nodesRef.current)) return;
      tick(nodesRef.current, edges, width, height);
      tickCount.current++;
      setLayoutNodes([...nodesRef.current]);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);

    return () => cancelAnimationFrame(rafRef.current);
  }, [enabled, edges, width, height]);

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
