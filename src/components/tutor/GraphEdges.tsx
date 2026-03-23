/**
 * GraphEdges — SVG bezier curves connecting nodes in graph layout.
 * Renders typed edges with distinct stroke styles per the spec:
 *   causes: solid, margin colour
 *   enables: dashed, sage
 *   contrasts: dotted, amber
 *   extends: solid thin, indigo
 *   requires: solid, ink-faint
 *   bridges: dashed, amber (cross-domain)
 *
 * See: 06-component-inventory.md, 2.4 (Edge specification).
 */
import { useState, useEffect, useCallback } from 'react';
import type { DiagramEdge } from '@/types/entries';
import styles from './GraphEdges.module.css';

interface GraphEdgesProps {
  edges: DiagramEdge[];
  nodeRefs: Map<number, HTMLDivElement>;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

interface EdgePath {
  d: string;
  label?: string;
  type: DiagramEdge['type'];
  labelX: number;
  labelY: number;
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
  causes: 'none',
  enables: '6 4',
  contrasts: '2 3',
  extends: 'none',
  requires: 'none',
  bridges: '6 4',
};

const EDGE_WIDTH: Record<string, number> = {
  causes: 1.5,
  enables: 1.2,
  contrasts: 1.2,
  extends: 0.8,
  requires: 1,
  bridges: 1.2,
};

export function GraphEdges({ edges, nodeRefs, containerRef }: GraphEdgesProps) {
  const [paths, setPaths] = useState<EdgePath[]>([]);

  const computePaths = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const cRect = container.getBoundingClientRect();

    const computed: EdgePath[] = edges.map((edge) => {
      const fromEl = nodeRefs.get(edge.from);
      const toEl = nodeRefs.get(edge.to);
      if (!fromEl || !toEl) {
        return { d: '', label: edge.label, type: edge.type, labelX: 0, labelY: 0 };
      }

      const fRect = fromEl.getBoundingClientRect();
      const tRect = toEl.getBoundingClientRect();

      // Compute center-bottom of source, center-top of target
      const x1 = fRect.left + fRect.width / 2 - cRect.left;
      const y1 = fRect.bottom - cRect.top;
      const x2 = tRect.left + tRect.width / 2 - cRect.left;
      const y2 = tRect.top - cRect.top;

      // Cubic bezier with vertical control points
      const cy = Math.abs(y2 - y1) * 0.4;
      const d = `M ${x1} ${y1} C ${x1} ${y1 + cy}, ${x2} ${y2 - cy}, ${x2} ${y2}`;

      return {
        d,
        label: edge.label,
        type: edge.type,
        labelX: (x1 + x2) / 2,
        labelY: (y1 + y2) / 2,
      };
    });

    setPaths(computed);
  }, [edges, nodeRefs, containerRef]);

  useEffect(() => {
    computePaths();
    const observer = new ResizeObserver(computePaths);
    const container = containerRef.current;
    if (container) observer.observe(container);
    return () => observer.disconnect();
  }, [computePaths, containerRef]);

  if (paths.length === 0) return null;

  return (
    <svg className={styles.svg} aria-hidden="true">
      <defs>
        <marker id="edge-arrow" markerWidth="6" markerHeight="4"
          refX="5" refY="2" orient="auto">
          <path d="M 0 0 L 6 2 L 0 4" fill="none"
            stroke="var(--ink-faint)" strokeWidth="0.8" />
        </marker>
      </defs>
      {paths.map((path, i) => {
        if (!path.d) return null;
        const edgeType = path.type ?? 'requires';
        return (
          <g key={i}>
            <path
              d={path.d}
              fill="none"
              stroke={EDGE_COLORS[edgeType] ?? 'var(--ink-faint)'}
              strokeWidth={EDGE_WIDTH[edgeType] ?? 1}
              strokeDasharray={EDGE_DASH[edgeType] ?? 'none'}
              markerEnd="url(#edge-arrow)"
              className={styles.edge}
            />
            {path.label && (
              <text
                x={path.labelX}
                y={path.labelY - 6}
                className={styles.label}
                textAnchor="middle"
              >
                {path.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
