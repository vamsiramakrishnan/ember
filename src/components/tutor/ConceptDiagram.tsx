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
 * Auto zoom-to-fit: measures the bounding box of positioned nodes
 * and scales the canvas so all nodes are visible without scrolling.
 * Enlarge modal: users can open the diagram in a full-screen overlay
 * with native scroll for exploration.
 *
 * See: 06-component-inventory.md, Family 2.
 */
import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
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

/** Compute a CSS scale to fit content within the container. */
function computeZoomToFit(
  positions: Map<number, { x: number; y: number }>,
  containerWidth: number,
  cardWidth: number,
): { scale: number; contentWidth: number; contentHeight: number } {
  if (positions.size === 0) return { scale: 1, contentWidth: containerWidth, contentHeight: 200 };

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const pos of positions.values()) {
    minX = Math.min(minX, pos.x - cardWidth / 2);
    maxX = Math.max(maxX, pos.x + cardWidth / 2);
    minY = Math.min(minY, pos.y - 40);
    maxY = Math.max(maxY, pos.y + 40);
  }

  const contentWidth = maxX - minX + 40; // 20px padding each side
  const contentHeight = maxY - minY + 40;
  const scaleX = containerWidth / contentWidth;
  const scale = Math.min(scaleX, 1); // Never zoom in, only out

  return { scale: Math.max(scale, 0.45), contentWidth, contentHeight };
}

export function ConceptDiagram({
  items, edges = [], title, layout: layoutProp, onNodeClick,
}: ConceptDiagramProps) {
  if (items.length === 0) return null;

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(640);
  const [modalOpen, setModalOpen] = useState(false);

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

  const isTreeWithChildren = resolvedLayout === 'tree' &&
    items.some((n) => n.children && n.children.length > 0);

  // Compute layout at a generous internal width (never cramped)
  const internalWidth = Math.max(containerWidth, items.length * 120, 600);

  const layoutResult = useMemo(() => {
    if (isTreeWithChildren) return null;
    const h = resolvedLayout === 'constellation'
      ? Math.min(internalWidth * 0.65, 520)
      : resolvedLayout === 'radial' || resolvedLayout === 'cycle'
        ? Math.min(internalWidth * 0.7, 480)
        : resolvedLayout === 'timeline'
          ? items.length * 120 + 80
          : resolvedLayout === 'pyramid'
            ? (Math.ceil((-1 + Math.sqrt(1 + 8 * items.length)) / 2)) * 120 + 80
            : Math.max(items.length * 80, 200);
    return computeLayout(resolvedLayout, items, edges, internalWidth, h);
  }, [resolvedLayout, items, edges, internalWidth, isTreeWithChildren]);

  // Auto zoom-to-fit: scale the diagram so all nodes fit without scrolling
  const zoomInfo = useMemo(() => {
    if (!layoutResult) return null;
    return computeZoomToFit(layoutResult.positions, containerWidth, 160);
  }, [layoutResult, containerWidth]);

  const counts = useMemo(() => connectionCounts(items, edges), [items, edges]);

  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  // Close modal on Escape
  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [modalOpen, closeModal]);

  const renderDiagramContent = (isModal: boolean) => {
    const scale = isModal ? 1 : (zoomInfo?.scale ?? 1);
    const needsScale = scale < 0.95;

    return (
      <>
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
            className={styles.canvasScaler}
            style={needsScale && !isModal ? {
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              width: `${100 / scale}%`,
            } : undefined}
          >
            <div
              className={styles.canvas}
              style={{
                minHeight: layoutResult.minHeight,
                minWidth: layoutResult.minWidth,
                position: 'relative',
              }}
            >
              <EdgeLayer edgePaths={layoutResult.edgePaths} minWidth={layoutResult.minWidth} minHeight={layoutResult.minHeight} />
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
              {resolvedLayout === 'timeline' && (
                <div className={styles.timelineSpine} style={{ height: layoutResult.minHeight - 80 }} />
              )}
            </div>
          </div>
        ) : null}
      </>
    );
  };

  return (
    <>
      <div
        className={styles.container}
        ref={containerRef}
        role="figure"
        aria-label={title ?? 'Concept diagram'}
        data-layout={resolvedLayout}
      >
        <div className={styles.headerRow}>
          {title && <p className={styles.title}>{title}</p>}
          {!isTreeWithChildren && items.length > 2 && (
            <button
              className={styles.enlargeButton}
              onClick={openModal}
              aria-label="Enlarge diagram"
              title="View full size"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
                <path d="M8.5 1.5h4v4M5.5 12.5h-4v-4M12.5 1.5l-4 4M1.5 12.5l4-4" />
              </svg>
            </button>
          )}
        </div>

        {renderDiagramContent(false)}

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

      {/* Full-screen modal for enlarged view */}
      {modalOpen && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              {title && <p className={styles.modalTitle}>{title}</p>}
              <button className={styles.modalClose} onClick={closeModal} aria-label="Close">
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              {renderDiagramContent(true)}
            </div>
          </div>
        </div>
      )}
    </>
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
