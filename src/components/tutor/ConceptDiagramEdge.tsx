/**
 * ConceptDiagramEdge — SVG connector between concept diagram nodes.
 *
 * Draws a labeled bezier curve between two nodes in the diagram.
 * Edge type determines visual treatment:
 * - causes: solid, margin colour
 * - enables: dashed, sage
 * - contrasts: dotted, amber
 * - extends: solid thin, indigo
 * - requires: solid, ink-faint
 * - bridges: dashed, amber (cross-domain connection)
 *
 * See: 06-component-inventory.md, Family 2.4 / 4.2
 */
import type { DiagramEdge } from '@/types/entries';
import styles from './ConceptDiagramEdge.module.css';

interface Props {
  edge: DiagramEdge;
  fromRect: { x: number; y: number; w: number; h: number } | null;
  toRect: { x: number; y: number; w: number; h: number } | null;
}

const EDGE_COLORS: Record<string, string> = {
  causes: 'var(--margin)',
  enables: 'var(--sage)',
  contrasts: 'var(--amber)',
  extends: 'var(--indigo)',
  requires: 'var(--ink-faint)',
  bridges: 'var(--amber)',
};

const EDGE_DASH: Record<string, string> = {
  enables: '4 3',
  contrasts: '2 2',
  bridges: '4 3',
};

export function ConceptDiagramEdge({ edge, fromRect, toRect }: Props) {
  if (!fromRect || !toRect) return null;

  const fromX = fromRect.x + fromRect.w;
  const fromY = fromRect.y + fromRect.h / 2;
  const toX = toRect.x;
  const toY = toRect.y + toRect.h / 2;

  const midX = (fromX + toX) / 2;
  const color = EDGE_COLORS[edge.type ?? 'causes'] ?? 'var(--ink-faint)';
  const dash = EDGE_DASH[edge.type ?? ''] ?? '';
  const thickness = edge.weight ? 0.5 + edge.weight * 1.5 : 1;

  // Bezier control points for a gentle curve
  const d = `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;

  return (
    <g className={styles.edge}>
      <path
        d={d}
        stroke={color}
        strokeWidth={thickness}
        strokeDasharray={dash}
        fill="none"
        opacity={0.6}
      />
      {/* Arrowhead */}
      <polygon
        points={`${toX},${toY} ${toX - 6},${toY - 3} ${toX - 6},${toY + 3}`}
        fill={color}
        opacity={0.5}
      />
      {/* Edge label */}
      {edge.label && (
        <text
          x={midX}
          y={(fromY + toY) / 2 - 6}
          className={styles.label}
          textAnchor="middle"
          fill={color}
        >
          {edge.label}
        </text>
      )}
    </g>
  );
}
