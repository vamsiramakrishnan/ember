/**
 * useForceLayout — d3-force-powered layout for the knowledge graph.
 *
 * Replaced hand-rolled physics with d3-force which provides:
 * - Proper collision detection (prevents card overlap)
 * - Configurable link distance based on edge weight
 * - Many-body repulsion that scales correctly
 * - Centering force that keeps the graph visible
 *
 * Respects prefers-reduced-motion by running simulation to completion
 * synchronously instead of animating frame-by-frame.
 */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  forceSimulation, forceLink, forceManyBody,
  forceCenter, forceCollide, forceX, forceY,
  type Simulation, type SimulationNodeDatum, type SimulationLinkDatum,
} from 'd3-force';
import type { CanvasNode, GraphEdge, LayoutNode } from '@/types/graph-canvas';

interface ForceOptions { width: number; height: number; enabled: boolean }

/** Collision radius — half-card-width plus margin. Prevents overlap. */
const COLLISION_RADIUS = 65;
/** How far apart linked nodes sit — shorter = tighter clusters. */
const LINK_DISTANCE_BASE = 100;
const LINK_DISTANCE_WEIGHT_SCALE = 40;
/** Many-body strength: negative = repulsion. Stronger pushes nodes apart. */
const CHARGE_STRENGTH = -400;
/** How quickly the simulation cools. Higher = settles faster. */
const ALPHA_DECAY = 0.015;

interface D3Node extends SimulationNodeDatum {
  id: string;
  kind: string;
  pinned: boolean;
  /** Original CanvasNode data for pass-through to LayoutNode. */
  data: CanvasNode;
}

interface D3Link extends SimulationLinkDatum<D3Node> {
  weight: number;
}

function toLayoutNodes(d3nodes: D3Node[], width: number, height: number): LayoutNode[] {
  return d3nodes.map((n) => ({
    ...n.data,
    x: Math.max(80, Math.min(width - 80, n.x ?? width / 2)),
    y: Math.max(80, Math.min(height - 80, n.y ?? height / 2)),
    vx: n.vx ?? 0,
    vy: n.vy ?? 0,
    pinned: n.pinned,
  }));
}

export function useForceLayout(
  nodes: CanvasNode[],
  edges: GraphEdge[],
  options: ForceOptions,
) {
  const { width, height, enabled } = options;
  const [layoutNodes, setLayoutNodes] = useState<LayoutNode[]>([]);
  const simRef = useRef<Simulation<D3Node, D3Link> | null>(null);

  // Stabilize identity — only re-init when the set of IDs changes
  const nodeKey = useMemo(() => nodes.map((n) => n.id).sort().join(','), [nodes]);
  const edgeKey = useMemo(() => edges.map((e) => `${e.from}-${e.to}`).join(','), [edges]);

  // Previous positions for continuity across re-inits
  const prevPositions = useRef<Map<string, { x: number; y: number; pinned: boolean }>>(new Map());

  useEffect(() => {
    if (!enabled || nodes.length === 0) {
      setLayoutNodes([]);
      return;
    }

    // Stop any previous simulation
    simRef.current?.stop();

    // Create d3 nodes, preserving previous positions
    const cx = width / 2;
    const cy = height / 2;
    const d3nodes: D3Node[] = nodes.map((n, i) => {
      const prev = prevPositions.current.get(n.id);
      const angle = (2 * Math.PI * i) / Math.max(nodes.length, 1);
      const radius = Math.min(width, height) * 0.3;
      return {
        id: n.id,
        kind: n.kind,
        pinned: prev?.pinned ?? false,
        data: n,
        x: prev?.x ?? cx + radius * Math.cos(angle),
        y: prev?.y ?? cy + radius * Math.sin(angle),
        // Pin previously pinned nodes
        ...(prev?.pinned ? { fx: prev.x, fy: prev.y } : {}),
      };
    });

    // Create d3 links
    const d3links: D3Link[] = edges
      .filter((e) => d3nodes.some((n) => n.id === e.from) && d3nodes.some((n) => n.id === e.to))
      .map((e) => ({
        source: e.from,
        target: e.to,
        weight: e.weight,
      }));

    const sim = forceSimulation(d3nodes)
      .alphaDecay(ALPHA_DECAY)
      .force('link', forceLink<D3Node, D3Link>(d3links)
        .id((d) => d.id)
        .distance((d) => LINK_DISTANCE_BASE + (1 - d.weight) * LINK_DISTANCE_WEIGHT_SCALE)
        .strength(0.4),
      )
      .force('charge', forceManyBody<D3Node>()
        .strength(CHARGE_STRENGTH)
        .distanceMax(400),
      )
      .force('center', forceCenter(cx, cy).strength(0.05))
      .force('collision', forceCollide<D3Node>(COLLISION_RADIUS))
      .force('x', forceX<D3Node>(cx).strength(0.02))
      .force('y', forceY<D3Node>(cy).strength(0.02));

    simRef.current = sim;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      // Run to completion synchronously
      sim.stop();
      for (let i = 0; i < 300; i++) {
        sim.tick();
        if (sim.alpha() < sim.alphaMin()) break;
      }
      const result = toLayoutNodes(d3nodes, width, height);
      prevPositions.current = new Map(result.map((n) => [n.id, { x: n.x, y: n.y, pinned: n.pinned }]));
      setLayoutNodes(result);
    } else {
      sim.on('tick', () => {
        const result = toLayoutNodes(d3nodes, width, height);
        prevPositions.current = new Map(result.map((n) => [n.id, { x: n.x, y: n.y, pinned: n.pinned }]));
        setLayoutNodes(result);
      });
    }

    return () => { sim.stop(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeKey, edgeKey, width, height, enabled]);

  const pinNode = useCallback((id: string, x: number, y: number) => {
    const sim = simRef.current;
    if (!sim) return;
    const d3node = sim.nodes().find((n) => n.id === id);
    if (d3node) {
      d3node.fx = x;
      d3node.fy = y;
      d3node.pinned = true;
      // Reheat slightly so other nodes adjust
      sim.alpha(0.1).restart();
    }
    prevPositions.current.set(id, { x, y, pinned: true });
  }, []);

  return { layoutNodes, pinNode };
}
