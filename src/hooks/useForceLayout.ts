/**
 * useForceLayout — force-directed layout simulation for the knowledge graph.
 * Respects prefers-reduced-motion by falling back to static radial layout.
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import { radialLayout, randomLayout } from '@/components/canvas/graph-layout';
import type { GraphNode, GraphEdge } from '@/types/graph-canvas';

const REPULSION = 3000;
const ATTRACTION = 0.005;
const CENTER_PULL = 0.01;
const DAMPING = 0.92;
const MIN_VELOCITY = 0.5;
const MIN_DISTANCE = 20;

interface ForceLayoutOptions { width: number; height: number; enabled: boolean }

export function useForceLayout(
  initialNodes: GraphNode[],
  edges: GraphEdge[],
  options: ForceLayoutOptions,
) {
  const [nodes, setNodes] = useState<GraphNode[]>(initialNodes);
  const nodesRef = useRef(initialNodes);
  const frameRef = useRef(0);
  const settledRef = useRef(false);

  const reducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  useEffect(() => {
    if (!options.enabled || initialNodes.length === 0) return;

    const laid = reducedMotion
      ? radialLayout(initialNodes, options.width, options.height)
      : randomLayout(initialNodes, options.width, options.height);

    nodesRef.current = laid;
    settledRef.current = reducedMotion;
    setNodes(laid);
  }, [initialNodes, options.width, options.height, options.enabled, reducedMotion]);

  // Run force simulation
  useEffect(() => {
    if (!options.enabled || reducedMotion || settledRef.current) return;
    if (nodesRef.current.length === 0) return;

    let running = true;
    const cx = options.width / 2;
    const cy = options.height / 2;

    // Build edge lookup for faster access
    const edgeMap = new Map<string, string[]>();
    for (const e of edges) {
      if (!edgeMap.has(e.from)) edgeMap.set(e.from, []);
      if (!edgeMap.has(e.to)) edgeMap.set(e.to, []);
      edgeMap.get(e.from)!.push(e.to);
      edgeMap.get(e.to)!.push(e.from);
    }

    let tickCount = 0;

    function tick() {
      if (!running) return;
      const ns = nodesRef.current;
      let maxV = 0;

      for (let i = 0; i < ns.length; i++) {
        const a = ns[i]!;
        if (a.pinned) continue;

        let fx = 0;
        let fy = 0;

        // Repulsion from all other nodes
        for (let j = 0; j < ns.length; j++) {
          if (i === j) continue;
          const b = ns[j]!;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.max(Math.sqrt(dx * dx + dy * dy), MIN_DISTANCE);
          const force = REPULSION / (dist * dist);
          fx += (dx / dist) * force;
          fy += (dy / dist) * force;
        }

        // Attraction along edges
        const neighbors = edgeMap.get(a.id) ?? [];
        for (const nId of neighbors) {
          const b = ns.find(n => n.id === nId);
          if (!b) continue;
          fx += (b.x - a.x) * ATTRACTION;
          fy += (b.y - a.y) * ATTRACTION;
        }

        // Center pull
        fx += (cx - a.x) * CENTER_PULL;
        fy += (cy - a.y) * CENTER_PULL;

        a.vx = (a.vx + fx) * DAMPING;
        a.vy = (a.vy + fy) * DAMPING;
        a.x += a.vx;
        a.y += a.vy;

        maxV = Math.max(maxV, Math.abs(a.vx), Math.abs(a.vy));
      }

      tickCount++;

      // Update React state at ~15fps during simulation
      if (tickCount % 4 === 0) {
        setNodes([...ns]);
      }

      // Settle check
      if (maxV < MIN_VELOCITY || tickCount > 300) {
        settledRef.current = true;
        setNodes([...ns]);
        return;
      }

      frameRef.current = requestAnimationFrame(tick);
    }

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(frameRef.current);
    };
  }, [edges, options.enabled, options.width, options.height, reducedMotion]);

  const pinNode = useCallback((id: string, x: number, y: number) => {
    const ns = nodesRef.current;
    const node = ns.find(n => n.id === id);
    if (node) {
      node.x = x;
      node.y = y;
      node.pinned = true;
      node.vx = 0;
      node.vy = 0;
      setNodes([...ns]);
    }
  }, []);

  return { nodes, pinNode, settled: settledRef.current };
}
