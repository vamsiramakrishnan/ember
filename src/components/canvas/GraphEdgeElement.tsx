/**
 * GraphEdgeElement — renders a relationship edge as a bezier curve.
 * Line style varies by relation category (knowledge, bridge, conversational, etc.)
 */
import { colors } from '@/tokens/colors';
import { fontFamily } from '@/tokens/typography';
import { edgeCategory, type GraphEdge, type EdgeCategory } from './graph-layout';

interface GraphEdgeElementProps {
  edge: GraphEdge;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  dimmed: boolean;
  showLabel: boolean;
}

interface StrokeStyle {
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
}

function strokeForCategory(cat: EdgeCategory): StrokeStyle {
  switch (cat) {
    case 'knowledge':
      return { stroke: colors.inkFaint, strokeWidth: 1 };
    case 'bridge':
      return { stroke: colors.amber, strokeWidth: 1, strokeDasharray: '4 4' };
    case 'conversational':
      return { stroke: colors.inkGhost, strokeWidth: 0.5, strokeDasharray: '2 2' };
    case 'contradiction':
      return { stroke: colors.margin, strokeWidth: 1, strokeDasharray: '2 6' };
    case 'echo':
      return { stroke: colors.inkGhost, strokeWidth: 0.5, strokeDasharray: '1 3' };
  }
}

function strokeOpacityForCategory(cat: EdgeCategory): number {
  if (cat === 'bridge' || cat === 'contradiction') return 0.3;
  return 1;
}

export function GraphEdgeElement({
  edge, x1, y1, x2, y2, dimmed, showLabel,
}: GraphEdgeElementProps) {
  const cat = edgeCategory(edge.relation);
  const style = strokeForCategory(cat);

  // Control point perpendicular to the line for a gentle curve
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const offset = Math.min(len * 0.15, 30);
  // Perpendicular direction
  const cpX = midX + (-dy / len) * offset;
  const cpY = midY + (dx / len) * offset;

  const d = `M ${x1} ${y1} Q ${cpX} ${cpY} ${x2} ${y2}`;

  // Midpoint on the quadratic bezier: B(0.5) = 0.25*P0 + 0.5*CP + 0.25*P2
  const labelX = 0.25 * x1 + 0.5 * cpX + 0.25 * x2;
  const labelY = 0.25 * y1 + 0.5 * cpY + 0.25 * y2;

  const readableLabel = edge.relation.replace(/-/g, ' ');

  return (
    <g opacity={dimmed ? 0.1 : 1}>
      <path
        d={d}
        fill="none"
        stroke={style.stroke}
        strokeWidth={style.strokeWidth}
        strokeDasharray={style.strokeDasharray}
        strokeOpacity={strokeOpacityForCategory(cat)}
      />
      {showLabel && edge.relation && (
        <text
          x={labelX}
          y={labelY - 4}
          textAnchor="middle"
          style={{
            fontFamily: fontFamily.student,
            fontSize: '10px',
            fontStyle: 'italic',
            fill: colors.inkFaint,
          }}
        >
          {readableLabel}
        </text>
      )}
    </g>
  );
}
