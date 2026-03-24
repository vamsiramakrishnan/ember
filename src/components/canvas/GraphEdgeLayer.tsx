/**
 * GraphEdgeLayer — SVG overlay rendering organic bezier edges between graph nodes.
 * Edges are gentle curves with optional relationship labels at midpoint.
 * Visual style varies by edge weight: heavier relations are slightly more visible.
 */
import { colors } from '@/tokens/colors';
import type { LayoutNode, GraphEdge } from '@/types/graph-canvas';
import styles from './GraphEdgeLayer.module.css';

interface GraphEdgeLayerProps {
  nodes: LayoutNode[];
  edges: GraphEdge[];
  focusId: string | null;
  hoverId: string | null;
  width: number;
  height: number;
}

function bezierPath(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const offset = Math.min(len * 0.18, 35);
  const cpX = mx + (-dy / len) * offset;
  const cpY = my + (dx / len) * offset;
  return { d: `M ${x1} ${y1} Q ${cpX} ${cpY} ${x2} ${y2}`, cpX, cpY };
}

export function GraphEdgeLayer({
  nodes, edges, focusId, hoverId, width, height,
}: GraphEdgeLayerProps) {
  const activeId = focusId ?? hoverId;
  const hasActive = activeId !== null;

  return (
    <svg
      className={styles.svg}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      aria-hidden="true"
    >
      {edges.map((edge) => {
        const from = nodes.find((n) => n.id === edge.from);
        const to = nodes.find((n) => n.id === edge.to);
        if (!from || !to) return null;

        const { d, cpX, cpY } = bezierPath(from.x, from.y, to.x, to.y);
        const isConnected = activeId === edge.from || activeId === edge.to;
        const dimmed = hasActive && !isConnected;
        const highlighted = hasActive && isConnected;

        const labelX = 0.25 * from.x + 0.5 * cpX + 0.25 * to.x;
        const labelY = 0.25 * from.y + 0.5 * cpY + 0.25 * to.y;
        const label = edge.label?.replace(/-/g, ' ');

        return (
          <g key={`${edge.from}-${edge.to}`} className={dimmed ? styles.dimmed : ''}>
            <path
              d={d}
              fill="none"
              stroke={highlighted ? colors.inkFaint : colors.rule}
              strokeWidth={highlighted ? 1.2 : 0.8}
              className={styles.edge}
            />
            {label && (highlighted || !hasActive) && (
              <text
                x={labelX} y={labelY - 5}
                className={styles.label}
              >
                {label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
