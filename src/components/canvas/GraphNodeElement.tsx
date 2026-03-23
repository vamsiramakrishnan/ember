/**
 * GraphNodeElement — renders a single node in the knowledge graph SVG.
 * Concepts scale with mastery. Thinkers use italic. Terms are small. Curiosities are dashed.
 */
import React, { useCallback } from 'react';
import { colors } from '@/tokens/colors';
import { fontFamily } from '@/tokens/typography';
import type { GraphNode } from './graph-layout';
import { visualNodeType, type VisualNodeType } from './graph-layout';

interface GraphNodeElementProps {
  node: GraphNode;
  focused: boolean;
  dimmed: boolean;
  onMouseDown: (id: string, e: React.MouseEvent) => void;
  onMouseEnter: (id: string) => void;
  onMouseLeave: () => void;
  onClick: (id: string) => void;
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '\u2026' : text;
}

function nodeRadius(vtype: VisualNodeType, mastery: number): number {
  if (vtype === 'concept') return 6 + (mastery / 100) * 10;
  if (vtype === 'thinker') return 12;
  if (vtype === 'term') return 8;
  return 10; // curiosity
}

function nodeFill(vtype: VisualNodeType): string {
  if (vtype === 'concept') return colors.indigoDim;
  if (vtype === 'thinker') return colors.marginDim;
  if (vtype === 'term') return colors.paper;
  return colors.amberDim;
}

function nodeStroke(vtype: VisualNodeType): string {
  if (vtype === 'concept') return colors.indigo;
  if (vtype === 'thinker') return colors.margin;
  if (vtype === 'term') return colors.inkFaint;
  return colors.amber;
}

/** SVG arc path for mastery ring around a node. */
function masteryArc(cx: number, cy: number, r: number, mastery: number): string {
  const angle = (mastery / 100) * Math.PI * 2;
  const endX = cx + r * Math.sin(angle);
  const endY = cy - r * Math.cos(angle);
  const largeArc = angle > Math.PI ? 1 : 0;
  return `M ${cx} ${cy - r} A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY}`;
}

function labelStyle(vtype: VisualNodeType): React.CSSProperties {
  if (vtype === 'thinker') return { fontFamily: fontFamily.tutor, fontSize: '12px', fontStyle: 'italic', fill: colors.margin };
  if (vtype === 'term') return { fontFamily: fontFamily.system, fontSize: '9px', fill: colors.inkFaint };
  if (vtype === 'curiosity') return { fontFamily: fontFamily.student, fontSize: '11px', fontStyle: 'italic', fill: colors.amber };
  return { fontFamily: fontFamily.student, fontSize: '11px', fill: colors.inkSoft };
}

export function GraphNodeElement({
  node, focused, dimmed, onMouseDown, onMouseEnter, onMouseLeave, onClick,
}: GraphNodeElementProps) {
  const vtype = visualNodeType(node.type);
  const mastery = node.mastery ?? 0;
  const r = nodeRadius(vtype, mastery);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(node.id); }
  }, [onClick, node.id]);

  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      opacity={dimmed ? 0.2 : 1}
      role="button"
      tabIndex={0}
      aria-label={`${vtype}: ${node.label}`}
      onMouseDown={(e) => onMouseDown(node.id, e)}
      onMouseEnter={() => onMouseEnter(node.id)}
      onMouseLeave={onMouseLeave}
      onClick={() => onClick(node.id)}
      onKeyDown={handleKeyDown}
      style={{ cursor: 'pointer', outline: 'none' }}
    >
      {focused && (
        <circle r={r + 4} fill="none" stroke={colors.rule} strokeWidth={1} />
      )}
      <circle
        r={r}
        fill={nodeFill(vtype)}
        stroke={nodeStroke(vtype)}
        strokeOpacity={vtype === 'term' ? 1 : 0.4}
        strokeWidth={1}
        strokeDasharray={vtype === 'curiosity' ? '3 3' : undefined}
      />
      {vtype === 'concept' && mastery > 0 && (
        <path
          d={masteryArc(0, 0, r + 3, mastery)}
          fill="none"
          stroke={colors.sage}
          strokeWidth={2}
          strokeLinecap="round"
        />
      )}
      <text
        y={r + 12}
        textAnchor="middle"
        style={labelStyle(vtype)}
      >
        {truncate(node.label, 20)}
      </text>
    </g>
  );
}
