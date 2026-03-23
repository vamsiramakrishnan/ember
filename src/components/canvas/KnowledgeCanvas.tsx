/**
 * KnowledgeCanvas — knowledge graph visualization surface.
 * Composes GraphSVG, GraphFilters, and GraphDetail into the canvas mode wrapper.
 */
import { useCallback, useMemo } from 'react';
import { useGraphCanvas } from '@/hooks/useGraphCanvas';
import { useForceLayout } from '@/hooks/useForceLayout';
import { useGraphPositions } from '@/hooks/useGraphPositions';
import { useStudent } from '@/contexts/StudentContext';
import { CanvasMode } from './CanvasMode';
import { GraphSVG } from './GraphSVG';
import { GraphFilters } from './GraphFilters';
import { GraphDetail } from './GraphDetail';
import type { SavedPosition } from '@/types/graph-canvas';
import styles from './KnowledgeCanvas.module.css';

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 500;

export function KnowledgeCanvas() {
  const { notebook } = useStudent();
  const notebookId = notebook?.id ?? null;

  const {
    nodes, edges, allNodes, filters, toggleFilter,
    focusId, setFocusId, hoverId, setHoverId,
  } = useGraphCanvas();

  const { layoutNodes, pinNode } = useForceLayout(nodes, edges, {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    enabled: true,
  });

  const onRestored = useCallback((positions: SavedPosition[]) => {
    for (const pos of positions) {
      pinNode(pos.id, pos.x, pos.y);
    }
  }, [pinNode]);

  const { savePositions } = useGraphPositions(notebookId, nodes, onRestored);

  const handleDrag = useCallback((id: string, x: number, y: number) => {
    pinNode(id, x, y);
    savePositions(layoutNodes);
  }, [pinNode, savePositions, layoutNodes]);

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
        const other = allNodes.find((n) => n.id === otherId);
        return other
          ? { id: other.id, label: other.label, type: other.kind }
          : null;
      })
      .filter((n): n is NonNullable<typeof n> => n !== null);
  }, [focusId, edges, allNodes]);

  const isEmpty = nodes.length === 0;

  return (
    <CanvasMode label="knowledge graph" minHeight={400}>
      <GraphFilters filters={filters} onToggle={toggleFilter} />
      {isEmpty ? (
        <p className={styles.empty}>
          Concepts, thinkers, and connections will appear here as you explore.
        </p>
      ) : (
        <GraphSVG
          nodes={layoutNodes}
          edges={edges}
          focusId={focusId}
          hoverId={hoverId}
          onNodeClick={setFocusId}
          onNodeHover={setHoverId}
          onNodeDrag={handleDrag}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
        />
      )}
      {focusNode && (
        <GraphDetail node={focusNode} neighbors={focusNeighbors} />
      )}
    </CanvasMode>
  );
}
