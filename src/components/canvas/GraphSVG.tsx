/**
 * GraphSVG — renders the knowledge graph as an SVG with nodes and edges.
 * Each node is a circle with a label. Edges are gentle bezier curves.
 * Supports click, hover, and drag interactions.
 */
import { useCallback, useRef } from 'react';
import { colors } from '@/tokens/colors';
import { fontFamily } from '@/tokens/typography';
import type { LayoutNode, GraphEdge } from '@/types/graph-canvas';
import styles from './GraphSVG.module.css';

interface GraphSVGProps {
  nodes: LayoutNode[];
  edges: GraphEdge[];
  focusId: string | null;
  hoverId: string | null;
  onNodeClick: (id: string | null) => void;
  onNodeHover: (id: string | null) => void;
  onNodeDrag: (id: string, x: number, y: number) => void;
  width: number;
  height: number;
}

const NODE_COLORS: Record<string, string> = {
  concept: colors.sage,
  thinker: colors.margin,
  term: colors.indigo,
  curiosity: colors.amber,
};

const NODE_RADIUS = 6;
const FOCUS_RADIUS = 8;

export function GraphSVG({
  nodes, edges, focusId, hoverId,
  onNodeClick, onNodeHover, onNodeDrag,
  width, height,
}: GraphSVGProps) {
  const dragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const toSVGCoords = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }, []);

  const onMouseDown = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const pos = toSVGCoords(e.clientX, e.clientY);
    const node = nodes.find((n) => n.id === id);
    if (!node) return;
    dragRef.current = { id, offsetX: pos.x - node.x, offsetY: pos.y - node.y };
  }, [nodes, toSVGCoords]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current) return;
    const pos = toSVGCoords(e.clientX, e.clientY);
    onNodeDrag(
      dragRef.current.id,
      pos.x - dragRef.current.offsetX,
      pos.y - dragRef.current.offsetY,
    );
  }, [onNodeDrag, toSVGCoords]);

  const onMouseUp = useCallback(() => {
    if (dragRef.current) {
      onNodeClick(dragRef.current.id);
      dragRef.current = null;
    }
  }, [onNodeClick]);

  const onBgClick = useCallback(() => { onNodeClick(null); }, [onNodeClick]);

  return (
    <svg
      ref={svgRef}
      className={styles.svg}
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onClick={onBgClick}
      role="img"
      aria-label="Knowledge graph"
    >
      {/* Edges */}
      {edges.map((edge) => {
        const from = nodes.find((n) => n.id === edge.from);
        const to = nodes.find((n) => n.id === edge.to);
        if (!from || !to) return null;
        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2;
        const cp = Math.abs(to.y - from.y) * 0.25 + 15;
        const d = `M ${from.x} ${from.y} Q ${mx} ${my - cp} ${to.x} ${to.y}`;
        return (
          <path
            key={`${edge.from}-${edge.to}`}
            d={d}
            stroke={colors.inkGhost}
            strokeWidth={1}
            fill="none"
            className={styles.edge}
          />
        );
      })}
      {/* Nodes */}
      {nodes.map((node) => {
        const isFocused = node.id === focusId;
        const isHovered = node.id === hoverId;
        const r = isFocused ? FOCUS_RADIUS : NODE_RADIUS;
        const fill = NODE_COLORS[node.kind] ?? colors.inkFaint;
        const opacity = isFocused || isHovered ? 1 : 0.7;
        return (
          <g
            key={node.id}
            onMouseDown={(e) => onMouseDown(node.id, e)}
            onMouseEnter={() => onNodeHover(node.id)}
            onMouseLeave={() => onNodeHover(null)}
            className={styles.node}
            tabIndex={0}
            role="button"
            aria-label={`${node.kind}: ${node.label}`}
          >
            <circle cx={node.x} cy={node.y} r={r} fill={fill} opacity={opacity} />
            <text
              x={node.x}
              y={node.y + r + 12}
              textAnchor="middle"
              style={{
                fontFamily: fontFamily.system,
                fontSize: '10px',
                fontWeight: 300,
                fill: isFocused ? colors.ink : colors.inkFaint,
                letterSpacing: '0.5px',
              }}
            >
              {node.label.length > 20 ? node.label.slice(0, 18) + '...' : node.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
