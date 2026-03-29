/**
 * DiagramCard — unified node component for concept diagrams.
 *
 * Merges the visual richness of GraphCardNode (Constellation) with the
 * interactive features of ConceptDiagramNode (notebook). Every diagram
 * layout renders through this component for consistent visual treatment.
 *
 * Visual capabilities (from GraphCardNode):
 * - SVG mastery arc (270-degree ring around concepts with mastery > 0)
 * - Density-scaled width (grows with connection count)
 * - Inline expansion with detail text and children
 *
 * Interactive capabilities (from ConceptDiagramNode):
 * - Click to expand children/detail
 * - Entity click → knowledge graph navigation
 * - Accent colour treatment per node kind
 *
 * See: 06-component-inventory.md, Family 2.4
 */
import { useState, useCallback } from 'react';
import type { DiagramNode } from '@/types/entries';
import styles from './DiagramCard.module.css';

interface DiagramCardProps {
  node: DiagramNode;
  /** Connection count — drives density scaling (wider cards for hub nodes). */
  connectionCount?: number;
  /** Depth in tree layouts — nested cards indent and shrink. */
  depth?: number;
  onNodeClick?: (entityId: string, entityKind: string) => void;
  /** Render children recursively (for tree layout, handled externally otherwise). */
  renderChildren?: boolean;
}

/** SVG mastery arc — subtle ring that fills proportional to mastery percentage. */
function MasteryArc({ percentage }: { percentage: number }) {
  if (percentage <= 0) return null;
  const r = 13;
  const circumference = 2 * Math.PI * r;
  const arcLength = (percentage / 100) * circumference * 0.75;
  return (
    <svg className={styles.masteryArc} width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
      <circle
        cx="15" cy="15" r={r}
        fill="none"
        stroke="var(--sage)"
        strokeWidth="1.5"
        strokeDasharray={`${arcLength} ${circumference}`}
        strokeDashoffset="0"
        strokeLinecap="round"
        opacity="0.45"
        transform="rotate(-135 15 15)"
      />
    </svg>
  );
}

export function DiagramCard({
  node,
  connectionCount = 0,
  depth = 0,
  onNodeClick,
  renderChildren = true,
}: DiagramCardProps) {
  const [expanded, setExpanded] = useState(depth === 0);
  const hasChildren = renderChildren && node.children && node.children.length > 0;
  const hasDetail = Boolean(node.detail);
  const isExpandable = hasChildren || hasDetail;

  const handleClick = useCallback(() => {
    if (isExpandable) setExpanded((prev) => !prev);
    if (node.entityId && node.entityKind && onNodeClick) {
      onNodeClick(node.entityId, node.entityKind);
    }
  }, [isExpandable, node.entityId, node.entityKind, onNodeClick]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  const accentClass = node.accent ? (styles[node.accent] ?? '') : '';
  const depthClass = depth > 0 ? styles.nested : '';

  // Density scaling: hub nodes get wider cards (like GraphCardNode)
  const densityWidth = connectionCount > 0
    ? Math.min(140 + connectionCount * 8, 220)
    : undefined;

  return (
    <div
      className={`${styles.card} ${accentClass} ${depthClass}`}
      style={densityWidth ? { minWidth: densityWidth } : undefined}
      role="button"
      tabIndex={0}
      aria-expanded={isExpandable ? expanded : undefined}
      aria-label={`${node.entityKind ?? 'concept'}: ${node.label}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.header}>
        {node.mastery && node.mastery.percentage > 0 && (
          <MasteryArc percentage={node.mastery.percentage} />
        )}
        <div className={styles.labelGroup}>
          <span className={styles.label}>{node.label}</span>
          {node.subLabel && <span className={styles.sub}>{node.subLabel}</span>}
        </div>
        <div className={styles.meta}>
          {node.entityKind && (
            <span className={styles.badge}>{node.entityKind}</span>
          )}
          {isExpandable && (
            <span className={`${styles.chevron} ${expanded ? styles.chevronOpen : ''}`}>
              ▾
            </span>
          )}
        </div>
      </div>

      {/* Mastery track — full-width bar below header */}
      {node.mastery && node.mastery.percentage > 0 && (
        <div className={styles.masteryTrack}>
          <div
            className={styles.masteryFill}
            style={{ width: `${node.mastery.percentage}%` }}
          />
        </div>
      )}

      {/* Expanded content: detail text and recursive children */}
      {expanded && isExpandable && (
        <div className={styles.body}>
          {node.detail && <p className={styles.detail}>{node.detail}</p>}
          {hasChildren && (
            <div className={styles.children}>
              {node.children!.map((child, i) => (
                <DiagramCard
                  key={child.entityId ?? `child-${i}`}
                  node={child}
                  depth={depth + 1}
                  onNodeClick={onNodeClick}
                  renderChildren={renderChildren}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
