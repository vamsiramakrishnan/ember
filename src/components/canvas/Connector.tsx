/**
 * Connector (4.2)
 * A line between two canvas elements. Gentle bezier, not straight.
 * See: 06-component-inventory.md, Family 4.
 */
import { colors } from '@/tokens/colors';
import { fontFamily } from '@/tokens/typography';

interface ConnectorProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label?: string;
  showArrow?: boolean;
}

export function Connector({
  x1,
  y1,
  x2,
  y2,
  label,
  showArrow,
}: ConnectorProps) {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const cpOffset = Math.abs(y2 - y1) * 0.3 + 20;

  const d = `M ${x1} ${y1} Q ${midX} ${midY - cpOffset} ${x2} ${y2}`;

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'visible',
      }}
    >
      <path
        d={d}
        stroke={colors.inkSoft}
        strokeWidth={1}
        fill="none"
      />
      {showArrow && (
        <text
          x={x2 - 6}
          y={y2}
          style={{
            fontFamily: fontFamily.student,
            fontSize: '8px',
            fill: colors.inkSoft,
          }}
        >
          ›
        </text>
      )}
      {label && (
        <text
          x={midX}
          y={midY - cpOffset / 2}
          textAnchor="middle"
          style={{
            fontFamily: fontFamily.student,
            fontSize: '12px',
            fontWeight: 300,
            fontStyle: 'italic',
            fill: colors.inkFaint,
          }}
        >
          {label}
        </text>
      )}
    </svg>
  );
}
