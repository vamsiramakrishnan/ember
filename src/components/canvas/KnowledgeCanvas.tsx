/**
 * KnowledgeCanvas — relationship-driven knowledge graph visualization.
 * Renders warm paper cards (GraphCardNode) over organic SVG edges (GraphEdgeLayer),
 * driven by force-directed layout. Drag cards to rearrange; click to focus.
 * See: 06-component-inventory.md, Family 4.
 */
import { useCallback, useRef, useMemo } from 'react';
import { useGraphCanvas } from '@/hooks/useGraphCanvas';
import { useForceLayout } from '@/hooks/useForceLayout';
import { useGraphPositions } from '@/hooks/useGraphPositions';
import { useStudent } from '@/contexts/StudentContext';
import { CanvasMode } from './CanvasMode';
import { GraphCardNode } from './GraphCardNode';
import { GraphEdgeLayer } from './GraphEdgeLayer';
import { GraphFilters } from './GraphFilters';
import { GraphDetail } from './GraphDetail';
import type { SavedPosition } from '@/types/graph-canvas';
import styles from './KnowledgeCanvas.module.css';

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 520;

export function KnowledgeCanvas() {
  const { notebook } = useStudent();
  const notebookId = notebook?.id ?? null;
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    nodes, edges, allNodes, filters, toggleFilter,
    focusId, setFocusId, hoverId, setHoverId,
  } = useGraphCanvas();

  const { layoutNodes, pinNode } = useForceLayout(nodes, edges, {
    width: CANVAS_WIDTH, height: CANVAS_HEIGHT, enabled: true,
  });

  const onRestored = useCallback((positions: SavedPosition[]) => {
    for (const pos of positions) pinNode(pos.id, pos.x, pos.y);
  }, [pinNode]);

  const { savePositions } = useGraphPositions(notebookId, nodes, onRestored);

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

  const focusNode = useMemo(
    () => (focusId ? allNodes.find((n) => n.id === focusId) ?? null : null),
    [focusId, allNodes],
  );
  const focusNeighbors = useMemo(() => {
    if (!focusId) return [];
    return edges
      .filter((e) => e.from === focusId || e.to === focusId)
      .map((e) => {
        const otherId = e.from === focusId ? e.to : e.from;
        const o = allNodes.find((n) => n.id === otherId);
        return o ? { id: o.id, label: o.label, type: o.kind } : null;
      })
      .filter((n): n is NonNullable<typeof n> => n !== null);
  }, [focusId, edges, allNodes]);

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
    <CanvasMode label="knowledge graph" minHeight={CANVAS_HEIGHT + 80}>
      <GraphFilters filters={filters} onToggle={toggleFilter} />
      {isEmpty ? (
        <p className={styles.empty}>
          Concepts, thinkers, and connections will appear here as you explore.
        </p>
      ) : (
        <div ref={containerRef} className={styles.field} onClick={onBgClick}
          style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
          <GraphEdgeLayer
            nodes={layoutNodes} edges={edges}
            focusId={focusId} hoverId={hoverId}
            width={CANVAS_WIDTH} height={CANVAS_HEIGHT}
          />
          {layoutNodes.map((node) => (
            <GraphCardNode key={node.id} node={node}
              focused={focusId === node.id}
              dimmed={activeSet !== null && !activeSet.has(node.id)}
              onMouseDown={onNodeMouseDown}
              onMouseEnter={onNodeHoverIn}
              onMouseLeave={onNodeHoverOut}
              onClick={setFocusId}
            />
          ))}
        </div>
      )}
      {focusNode && <GraphDetail node={focusNode} neighbors={focusNeighbors} />}
    </CanvasMode>
  );
}
