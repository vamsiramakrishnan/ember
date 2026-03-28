/**
 * KnowledgeCanvas — relationship-driven knowledge graph visualization.
 * was: fixed 900x520px, no inline expansion, no density encoding
 * now: responsive container, inline card expansion, edge-weight styling,
 *      connection-count density scaling on cards
 *
 * See: 06-component-inventory.md, Family 4.
 */
import { useCallback, useRef, useMemo, useState, useEffect } from 'react';
import { useGraphCanvas } from '@/hooks/useGraphCanvas';
import { useForceLayout } from '@/hooks/useForceLayout';
import { useGraphPositions } from '@/hooks/useGraphPositions';
import { useStudent } from '@/contexts/StudentContext';
import { CanvasMode } from './CanvasMode';
import { GraphCardNode } from './GraphCardNode';
import { GraphEdgeLayer } from './GraphEdgeLayer';
import { GraphFilters } from './GraphFilters';
import type { SavedPosition } from '@/types/graph-canvas';
import styles from './KnowledgeCanvas.module.css';

/** was: fixed 900x520, now: measured from container, min 600x400 */
const MIN_WIDTH = 600;
const MIN_HEIGHT = 400;

export function KnowledgeCanvas() {
  const { notebook } = useStudent();
  const notebookId = notebook?.id ?? null;
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 520 });

  /* Responsive: measure container on mount and resize.
   * was: hardcoded CANVAS_WIDTH/HEIGHT
   * now: fills available space, minimum 600x400 */
  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setDimensions({
        width: Math.max(rect.width, MIN_WIDTH),
        height: Math.max(Math.min(rect.width * 0.58, 640), MIN_HEIGHT),
      });
    };
    measure();
    const obs = new ResizeObserver(measure);
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const {
    nodes, edges, allNodes, filters, toggleFilter,
    focusId, setFocusId, hoverId, setHoverId,
  } = useGraphCanvas();

  const { layoutNodes, pinNode } = useForceLayout(nodes, edges, {
    width: dimensions.width, height: dimensions.height, enabled: true,
  });

  const onRestored = useCallback((positions: SavedPosition[]) => {
    for (const pos of positions) pinNode(pos.id, pos.x, pos.y);
  }, [pinNode]);

  const { savePositions } = useGraphPositions(notebookId, nodes, onRestored);

  /* Precompute per-node data: connection count + neighbor list.
   * was: computed only for focused node, now: available for all nodes */
  const nodeData = useMemo(() => {
    const map = new Map<string, { count: number; neighbors: { id: string; label: string; kind: string }[] }>();
    for (const node of allNodes) {
      const connected = edges.filter((e) => e.from === node.id || e.to === node.id);
      const neighbors = connected.map((e) => {
        const otherId = e.from === node.id ? e.to : e.from;
        const o = allNodes.find((n) => n.id === otherId);
        return o ? { id: o.id, label: o.label, kind: o.kind } : null;
      }).filter((n): n is NonNullable<typeof n> => n !== null);
      map.set(node.id, { count: connected.length, neighbors });
    }
    return map;
  }, [allNodes, edges]);

  const dragRef = useRef<{ id: string; ox: number; oy: number } | null>(null);

  const onNodeMouseDown = useCallback((id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const node = layoutNodes.find((n) => n.id === id);
    if (!node || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    dragRef.current = { id, ox: e.clientX - rect.left - node.x, oy: e.clientY - rect.top - node.y };
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current || !containerRef.current) return;
      const r = containerRef.current.getBoundingClientRect();
      pinNode(dragRef.current.id, ev.clientX - r.left - dragRef.current.ox, ev.clientY - r.top - dragRef.current.oy);
    };
    const onUp = () => {
      if (dragRef.current) savePositions(layoutNodes);
      dragRef.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [layoutNodes, pinNode, savePositions]);

  const onBgClick = useCallback(() => setFocusId(null), [setFocusId]);
  const onNodeHoverIn = useCallback((id: string) => setHoverId(id), [setHoverId]);
  const onNodeHoverOut = useCallback(() => setHoverId(null), [setHoverId]);

  const activeId = focusId ?? hoverId;
  const activeSet = useMemo(() => {
    if (!activeId) return null;
    const ids = new Set([activeId]);
    edges.forEach((e) => {
      if (e.from === activeId) ids.add(e.to);
      if (e.to === activeId) ids.add(e.from);
    });
    return ids;
  }, [activeId, edges]);

  const isEmpty = nodes.length === 0;

  return (
    <CanvasMode label="knowledge graph" minHeight={dimensions.height + 80}>
      <GraphFilters filters={filters} onToggle={toggleFilter} />
      {isEmpty ? (
        <p className={styles.empty}>
          Concepts, thinkers, and connections will appear here as you explore.
        </p>
      ) : (
        <div
          ref={containerRef}
          className={styles.field}
          onClick={onBgClick}
          style={{ height: dimensions.height }}
        >
          <GraphEdgeLayer
            nodes={layoutNodes} edges={edges}
            focusId={focusId} hoverId={hoverId}
            width={dimensions.width} height={dimensions.height}
          />
          {layoutNodes.map((node) => {
            const data = nodeData.get(node.id);
            return (
              <GraphCardNode key={node.id} node={node}
                focused={focusId === node.id}
                dimmed={activeSet !== null && !activeSet.has(node.id)}
                connectionCount={data?.count ?? 0}
                neighbors={data?.neighbors ?? []}
                onMouseDown={onNodeMouseDown}
                onMouseEnter={onNodeHoverIn}
                onMouseLeave={onNodeHoverOut}
                onClick={setFocusId}
              />
            );
          })}
        </div>
      )}
    </CanvasMode>
  );
}
