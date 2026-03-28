/**
 * useGraphCanvas — composes entity data into graph nodes and edges
 * for the knowledge graph visualization.
 *
 * Reads from the entity index and notebook relations to build
 * the node/edge arrays consumed by the force layout and SVG renderer.
 */
import { useState, useMemo, useCallback } from 'react';
import { useEntityIndex } from './useEntityIndex';
import { useNotebookGraph } from './useKnowledgeGraph';
import type { CanvasNode, GraphEdge, GraphNodeKind } from '@/types/graph-canvas';

const KIND_MAP: Record<string, GraphNodeKind | null> = {
  concept: 'concept',
  thinker: 'thinker',
  term: 'term',
  question: 'curiosity',
  notebook: null,
  session: null,
  text: null,
};

export function useGraphCanvas() {
  const { entities } = useEntityIndex();
  const { relations } = useNotebookGraph();
  const [filters, setFilters] = useState<Set<GraphNodeKind>>(
    () => new Set<GraphNodeKind>(['concept', 'thinker', 'term', 'curiosity']),
  );
  const [focusId, setFocusId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  const nodes: CanvasNode[] = useMemo(() => {
    return entities
      .map((e) => {
        const kind = KIND_MAP[e.type] ?? null;
        if (!kind) return null;
        const node: CanvasNode = {
          id: e.id,
          kind,
          label: e.name,
          detail: e.detail || undefined,
        };
        return node;
      })
      .filter((n): n is CanvasNode => n !== null);
  }, [entities]);

  const edges: GraphEdge[] = useMemo(() => {
    const nodeIds = new Set(nodes.map((n) => n.id));
    return relations
      .filter((r) => nodeIds.has(r.from) && nodeIds.has(r.to))
      .map((r) => ({
        from: r.from,
        to: r.to,
        relation: r.type,
        label: r.meta,
        weight: r.weight,
      }));
  }, [relations, nodes]);

  const filteredNodes = useMemo(
    () => nodes.filter((n) => filters.has(n.kind)),
    [nodes, filters],
  );

  const visibleNodeIds = useMemo(
    () => new Set(filteredNodes.map((n) => n.id)),
    [filteredNodes],
  );

  const visibleEdges = useMemo(
    () => edges.filter((e) => visibleNodeIds.has(e.from) && visibleNodeIds.has(e.to)),
    [edges, visibleNodeIds],
  );

  const toggleFilter = useCallback((kind: GraphNodeKind) => {
    setFilters((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
  }, []);

  return {
    nodes: filteredNodes,
    edges: visibleEdges,
    allNodes: nodes,
    filters,
    toggleFilter,
    focusId,
    setFocusId,
    hoverId,
    setHoverId,
  };
}
