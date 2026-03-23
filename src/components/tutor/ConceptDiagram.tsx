/**
 * Concept Diagram (2.4)
 * Interactive, nestable, graph-linked relationship map between ideas.
 *
 * Three layout modes:
 * 1. Linear flow: nodes connected left-to-right (default for ≤5 nodes)
 * 2. Graph layout: nodes with typed edges rendered as SVG bezier curves
 * 3. Tree layout: nodes with children rendered as expandable tree
 *
 * Every node can:
 * - Expand to reveal children and detail text
 * - Show mastery level as a ghost bar
 * - Link to the knowledge graph via entityId
 * - Display typed badges (concept/thinker/term/question)
 *
 * See: 06-component-inventory.md, Family 2.
 */
import { useRef, useCallback } from 'react';
import type { DiagramNode, DiagramEdge } from '@/types/entries';
import { ConceptDiagramNode } from './ConceptDiagramNode';
import { GraphEdges } from './GraphEdges';
import styles from './ConceptDiagram.module.css';

interface ConceptDiagramProps {
  items: DiagramNode[];
  edges?: DiagramEdge[];
  title?: string;
  onNodeClick?: (entityId: string, entityKind: string) => void;
}

export function ConceptDiagram({ items, edges, title, onNodeClick }: ConceptDiagramProps) {
  if (items.length === 0) return null;

  const hasTree = items.some((n) => n.children && n.children.length > 0);
  const hasEdges = edges && edges.length > 0;

  // Choose layout: tree if nested, graph if edges, linear otherwise
  const layout = hasTree ? 'tree' : hasEdges ? 'graph' : 'linear';

  return (
    <div className={styles.container} role="figure" aria-label={title ?? 'Concept diagram'}>
      {title && <p className={styles.title}>{title}</p>}

      {layout === 'tree' && (
        <TreeLayout items={items} onNodeClick={onNodeClick} />
      )}

      {layout === 'graph' && (
        <GraphLayout items={items} edges={edges!} onNodeClick={onNodeClick} />
      )}

      {layout === 'linear' && (
        <LinearLayout items={items} onNodeClick={onNodeClick} />
      )}
    </div>
  );
}

// ─── Linear layout (original, upgraded) ───────────────────

function LinearLayout({ items, onNodeClick }: {
  items: DiagramNode[];
  onNodeClick?: (id: string, kind: string) => void;
}) {
  return (
    <div className={styles.flow}>
      {items.map((node, i) => (
        <div key={node.entityId ?? i} className={styles.step}>
          {i > 0 && <LinearConnector />}
          <ConceptDiagramNode node={node} onNodeClick={onNodeClick} />
        </div>
      ))}
    </div>
  );
}

function LinearConnector() {
  return (
    <svg className={styles.connector} viewBox="0 0 32 24" aria-hidden="true">
      <path d="M 0 12 L 24 12" stroke="currentColor" strokeWidth="1" fill="none" />
      <path d="M 20 7 L 27 12 L 20 17" stroke="currentColor" strokeWidth="1" fill="none" />
    </svg>
  );
}

// ─── Tree layout (for nested nodes) ──────────────────────

function TreeLayout({ items, onNodeClick }: {
  items: DiagramNode[];
  onNodeClick?: (id: string, kind: string) => void;
}) {
  return (
    <div className={styles.tree}>
      {items.map((node, i) => (
        <ConceptDiagramNode
          key={node.entityId ?? i}
          node={node}
          depth={0}
          onNodeClick={onNodeClick}
        />
      ))}
    </div>
  );
}

// ─── Graph layout (nodes + typed edges) ──────────────────

function GraphLayout({ items, edges, onNodeClick }: {
  items: DiagramNode[];
  edges: DiagramEdge[];
  onNodeClick?: (id: string, kind: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<Map<number, HTMLDivElement>>(new Map());

  const setNodeRef = useCallback((index: number, el: HTMLDivElement | null) => {
    if (el) nodesRef.current.set(index, el);
    else nodesRef.current.delete(index);
  }, []);

  return (
    <div className={styles.graph} ref={containerRef}>
      <GraphEdges
        edges={edges}
        nodeRefs={nodesRef.current}
        containerRef={containerRef}
      />
      <div className={styles.graphNodes}>
        {items.map((node, i) => (
          <div
            key={node.entityId ?? i}
            ref={(el) => setNodeRef(i, el)}
            className={styles.graphNode}
          >
            <ConceptDiagramNode node={node} onNodeClick={onNodeClick} />
          </div>
        ))}
      </div>
      {/* Text fallback for edge labels — remains for accessibility */}
      {edges.some((e) => e.label) && (
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
