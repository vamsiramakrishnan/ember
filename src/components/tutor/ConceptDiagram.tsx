/**
 * Concept Diagram (2.4)
 * Interactive, layout-aware relationship map between ideas.
 *
 * Layout modes (the tutor's pedagogical choice):
 * - flow: A → B → C (process, cause chain)
 * - tree: top-down hierarchy (classification, taxonomy)
 * - radial: center node with radiating connections
 * - pyramid: layered foundation-to-peak
 * - cycle: circular loop (feedback, iterative process)
 * - timeline: temporal sequence with date anchors
 * - constellation: force-directed mini-canvas
 * - graph: general typed-edge graph (default)
 *
 * All layouts render through DiagramCard for consistent visual treatment
 * (mastery arcs, density scaling, entity linking, expand/collapse).
 *
 * See: 06-component-inventory.md, Family 2.
 */
import { useMemo, useRef, useState, useEffect } from 'react';
import type { DiagramNode, DiagramEdge, DiagramLayout } from '@/types/entries';
import { computeLayout, inferLayout } from './diagram-layout-engines';
import type { EdgePathData } from './diagram-layout-engines';
import { DiagramCard } from './DiagramCard';
import styles from './ConceptDiagram.module.css';

interface ConceptDiagramProps {
  items: DiagramNode[];
  edges?: DiagramEdge[];
  title?: string;
  layout?: DiagramLayout;
  onNodeClick?: (entityId: string, entityKind: string) => void;
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

/** Count edges per node for density scaling. */
function connectionCounts(
  items: DiagramNode[], edges: DiagramEdge[],
): Map<number, number> {
  const counts = new Map<number, number>();
  for (let i = 0; i < items.length; i++) counts.set(i, 0);
  for (const e of edges) {
    counts.set(e.from, (counts.get(e.from) ?? 0) + 1);
    counts.set(e.to, (counts.get(e.to) ?? 0) + 1);
  }
  return counts;
}

export function ConceptDiagram({
  items, edges = [], title, layout: layoutProp, onNodeClick,
}: ConceptDiagramProps) {
  if (items.length === 0) return null;

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(640);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setContainerWidth(el.clientWidth || 640);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const obs = new ResizeObserver(measure);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const resolvedLayout = layoutProp ?? inferLayout(items, edges);

  // For tree layout with children, delegate to recursive DiagramCard rendering
  const isTreeWithChildren = resolvedLayout === 'tree' &&
    items.some((n) => n.children && n.children.length > 0);

  const layoutResult = useMemo(() => {
    if (isTreeWithChildren) return null; // Tree with children uses CSS, not SVG positioning
    const h = resolvedLayout === 'constellation'
      ? Math.min(containerWidth * 0.65, 480)
      : resolvedLayout === 'radial' || resolvedLayout === 'cycle'
        ? Math.min(containerWidth * 0.7, 440)
        : resolvedLayout === 'timeline'
          ? items.length * 120 + 80
          : resolvedLayout === 'pyramid'
            ? (Math.ceil((-1 + Math.sqrt(1 + 8 * items.length)) / 2)) * 120 + 80
            : 160;
    return computeLayout(resolvedLayout, items, edges, containerWidth, h);
  }, [resolvedLayout, items, edges, containerWidth, isTreeWithChildren]);

  const counts = useMemo(() => connectionCounts(items, edges), [items, edges]);

  return (
    <div
      className={styles.container}
      ref={containerRef}
      role="figure"
      aria-label={title ?? 'Concept diagram'}
      data-layout={resolvedLayout}
    >
      {title && <p className={styles.title}>{title}</p>}

      {isTreeWithChildren ? (
        <div className={styles.tree}>
          {items.map((node, i) => (
            <DiagramCard
              key={node.entityId ?? i}
              node={node}
              depth={0}
              connectionCount={counts.get(i) ?? 0}
              onNodeClick={onNodeClick}
              renderChildren
            />
          ))}
        </div>
      ) : layoutResult ? (
        <div
          className={styles.canvas}
          style={{
            minHeight: layoutResult.minHeight,
            position: 'relative',
          }}
        >
          {/* SVG edge layer */}
          <EdgeLayer edgePaths={layoutResult.edgePaths} minWidth={layoutResult.minWidth} minHeight={layoutResult.minHeight} />

          {/* Positioned nodes */}
          {items.map((node, i) => {
            const pos = layoutResult.positions.get(i);
            if (!pos) return null;
            return (
              <div
                key={node.entityId ?? i}
                className={styles.positionedNode}
                style={{
                  left: pos.x,
                  top: pos.y,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <DiagramCard
                  node={node}
                  connectionCount={counts.get(i) ?? 0}
                  onNodeClick={onNodeClick}
                  renderChildren={false}
                />
              </div>
            );
          })}

          {/* Timeline spine indicator */}
          {resolvedLayout === 'timeline' && (
            <div className={styles.timelineSpine} style={{ height: layoutResult.minHeight - 80 }} />
          )}
        </div>
      ) : null}

      {/* Edge labels — accessible text representation */}
      {edges.length > 0 && edges.some((e) => e.label) && (
        <div className={styles.edgeLabels} aria-label="Relationships">
          {edges.filter((e) => e.label).map((edge, i) => (
            <span key={i} className={styles.edgeLabel}>
              {items[edge.from]?.label ?? ''}
              <span className={styles.edgeType}>
                {edge.label ?? edge.type ?? '→'}
              </span>
              {items[edge.to]?.label ?? ''}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SVG Edge Layer ─────────────────────────────────────────────

function EdgeLayer({ edgePaths, minWidth, minHeight }: {
  edgePaths: EdgePathData[];
  minWidth: number;
  minHeight: number;
}) {
  if (edgePaths.length === 0) return null;

  return (
    <svg
      className={styles.edgeSvg}
      viewBox={`0 0 ${minWidth} ${minHeight}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <defs>
        <marker
          id="diagram-arrow"
          markerWidth="6" markerHeight="4"
          refX="5" refY="2" orient="auto"
        >
          <path d="M 0 0 L 6 2 L 0 4" fill="none"
            stroke="var(--ink-faint)" strokeWidth="0.8" />
        </marker>
      </defs>
      {edgePaths.map((path, i) => {
        if (!path.d) return null;
        const edgeType = path.edge.type ?? 'requires';
        return (
          <g key={i}>
            <path
              d={path.d}
              fill="none"
              stroke={EDGE_COLORS[edgeType] ?? 'var(--ink-faint)'}
              strokeWidth={EDGE_WIDTH[edgeType] ?? 1}
              strokeDasharray={EDGE_DASH[edgeType] ?? 'none'}
              markerEnd="url(#diagram-arrow)"
            />
            {path.edge.label && (
              <text
                x={path.labelX}
                y={path.labelY}
                textAnchor="middle"
                className={styles.edgeSvgLabel}
              >
                {path.edge.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
