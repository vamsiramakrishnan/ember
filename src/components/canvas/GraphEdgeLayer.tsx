/**
 * GraphEdgeLayer — SVG overlay rendering organic bezier edges between graph nodes.
 * was: all edges identical grey lines, now: category-based stroke styles
 * reason: relationships have semantic meaning that must be visually encoded
 *
 * Edge categories (from graph-layout.ts):
 *   knowledge: solid, ink-faint — the strongest visible connection
 *   bridge: dashed 4-4, amber — cross-domain links, warm highlight
 *   conversational: light dashed 2-2, ink-ghost — dialogue references
 *   contradiction: dashed 2-6, margin — tension/conflict
 *   echo: dotted 1-3, ink-ghost — faint resonance
 *
 * See: 06-component-inventory.md, Family 4.
 */
import { colors } from '@/tokens/colors';
import { edgeCategory, type EdgeCategory } from './graph-layout';
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

/** Stroke style per edge category.
 * was: all edges colors.rule at 0.8px
 * now: category-specific stroke, width, and dash patterns */
interface StrokeStyle {
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
  opacity: number;
}

function strokeFor(cat: EdgeCategory, weight: number): StrokeStyle {
  /* Weight scales stroke width: 0.6 base + weight contribution.
   * was: fixed 0.8, now: 0.6–1.8 based on weight
   * reason: stronger relations should be more visible */
  const w = Math.min(0.6 + weight * 0.3, 1.8);
  switch (cat) {
    case 'knowledge':
      return { stroke: colors.inkFaint, strokeWidth: w, opacity: 0.7 };
    case 'bridge':
      return { stroke: colors.amber, strokeWidth: w, strokeDasharray: '4 4', opacity: 0.35 };
    case 'conversational':
      return { stroke: colors.inkGhost, strokeWidth: Math.max(w * 0.6, 0.5), strokeDasharray: '2 2', opacity: 0.5 };
    case 'contradiction':
      return { stroke: colors.margin, strokeWidth: w, strokeDasharray: '2 6', opacity: 0.4 };
    case 'echo':
      return { stroke: colors.inkGhost, strokeWidth: 0.5, strokeDasharray: '1 3', opacity: 0.3 };
  }
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

        /* was: edge.label used as-is, now: use relation field for category */
        const cat = edgeCategory(edge.relation);
        const style = strokeFor(cat, edge.weight);

        const labelX = 0.25 * from.x + 0.5 * cpX + 0.25 * to.x;
        const labelY = 0.25 * from.y + 0.5 * cpY + 0.25 * to.y;
        const label = edge.relation.replace(/-/g, ' ');

        return (
          <g key={`${edge.from}-${edge.to}`} className={dimmed ? styles.dimmed : ''}>
            <path
              d={d}
              fill="none"
              stroke={highlighted ? colors.inkSoft : style.stroke}
              strokeWidth={highlighted ? style.strokeWidth + 0.4 : style.strokeWidth}
              strokeDasharray={style.strokeDasharray}
              strokeOpacity={highlighted ? 0.9 : style.opacity}
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
