/**
 * GraphSVG — SVG container for the knowledge graph.
 * Handles pan (drag on background), zoom (wheel), and node drag.
 */
import { useRef } from 'react';
import type { GraphNode, GraphEdge } from './graph-layout';
import { GraphNodeElement } from './GraphNodeElement';
import { GraphEdgeElement } from './GraphEdgeElement';
import { useGraphInteraction } from './useGraphInteraction';
import styles from './GraphSVG.module.css';

interface GraphSVGProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  focusId: string | null;
  hoverId: string | null;
  onNodeClick: (id: string) => void;
  onNodeHover: (id: string | null) => void;
  onNodeDrag: (id: string, x: number, y: number) => void;
  width: number;
  height: number;
}

/** Node IDs connected to a given focus node (including itself). */
function connectedIds(edges: GraphEdge[], focusId: string): Set<string> {
  const ids = new Set<string>([focusId]);
  for (const e of edges) {
    if (e.from === focusId) ids.add(e.to);
    if (e.to === focusId) ids.add(e.from);
  }
  return ids;
}

function edgeTouchesNode(edge: GraphEdge, nodeId: string): boolean {
  return edge.from === nodeId || edge.to === nodeId;
}

export function GraphSVG({
  nodes, edges, focusId, hoverId,
  onNodeClick, onNodeHover, onNodeDrag, width, height,
}: GraphSVGProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const {
    viewBox, onWheel, onBgMouseDown, onNodeMouseDown, onMouseMove, onMouseUp,
  } = useGraphInteraction(width, height, nodes, onNodeDrag);

  const focusSet = focusId ? connectedIds(edges, focusId) : null;

  return (
    <div className={styles.container} style={{ height }}>
      <svg
        ref={svgRef}
        className={styles.svg}
        width={width}
        height={height}
        viewBox={viewBox}
        onWheel={onWheel}
        onMouseDown={onBgMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        role="img"
        aria-label="Knowledge graph canvas"
      >
        <rect x="-5000" y="-5000" width="10000" height="10000" fill="transparent" />

        {edges.map((edge) => {
          const fromN = nodes.find((n) => n.id === edge.from);
          const toN = nodes.find((n) => n.id === edge.to);
          if (!fromN || !toN) return null;
          const dimmed = focusSet
            ? !(focusSet.has(edge.from) && focusSet.has(edge.to))
            : false;
          const showLabel = !!(
            (focusId && edgeTouchesNode(edge, focusId)) ||
            (hoverId && edgeTouchesNode(edge, hoverId))
          );
          return (
            <GraphEdgeElement
              key={`${edge.from}-${edge.to}-${edge.relation}`}
              edge={edge} x1={fromN.x} y1={fromN.y} x2={toN.x} y2={toN.y}
              dimmed={dimmed} showLabel={showLabel}
            />
          );
        })}

        {nodes.map((node) => (
          <GraphNodeElement
            key={node.id}
            node={node}
            focused={focusId === node.id}
            dimmed={focusSet ? !focusSet.has(node.id) : false}
            onMouseDown={onNodeMouseDown}
            onMouseEnter={(id) => onNodeHover(id)}
            onMouseLeave={() => onNodeHover(null)}
            onClick={onNodeClick}
          />
        ))}
      </svg>
    </div>
  );
}
