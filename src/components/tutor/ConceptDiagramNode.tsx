/**
 * ConceptDiagramNode — a single node in a concept diagram.
 *
 * Nodes are interactive:
 * - Click to expand: reveals children (nested nodes) and detail text
 * - Hover: shows mastery bar and entity kind badge
 * - Graph-linked: if entityId is set, clicking can navigate to the
 *   concept journey or trigger graph exploration
 *
 * Visual treatment adapts to:
 * - Accent colour (sage/indigo/amber/margin)
 * - Mastery level (ghost bar behind the label)
 * - Depth (nested nodes indent, shrink slightly)
 * - Children presence (expand/collapse chevron)
 *
 * See: 06-component-inventory.md, Family 2.4
 */
import { useState } from 'react';
import type { DiagramNode } from '@/types/entries';
import styles from './ConceptDiagramNode.module.css';

interface Props {
  node: DiagramNode;
  depth?: number;
  onNodeClick?: (entityId: string, entityKind: string) => void;
}

export function ConceptDiagramNode({ node, depth = 0, onNodeClick }: Props) {
  const [expanded, setExpanded] = useState(depth === 0);
  const hasChildren = node.children && node.children.length > 0;
  const hasDetail = Boolean(node.detail);
  const isExpandable = hasChildren || hasDetail;

  const handleClick = () => {
    if (isExpandable) {
      setExpanded((prev) => !prev);
    }
    if (node.entityId && node.entityKind && onNodeClick) {
      onNodeClick(node.entityId, node.entityKind);
    }
  };

  const accentClass = node.accent ? styles[node.accent] : '';
  const depthClass = depth > 0 ? styles.nested : '';

  return (
    <div className={`${styles.node} ${accentClass} ${depthClass}`}>
      <button
        className={styles.header}
        onClick={handleClick}
        aria-expanded={isExpandable ? expanded : undefined}
        type="button"
      >
        <div className={styles.labelWrap}>
          <span className={styles.label}>{node.label}</span>
          {node.subLabel && <span className={styles.sub}>{node.subLabel}</span>}
          {node.entityKind && (
            <span className={styles.badge}>{node.entityKind}</span>
          )}
        </div>
        {node.mastery && (
          <div className={styles.masteryBar}>
            <div
              className={styles.masteryFill}
              style={{ width: `${node.mastery.percentage}%` }}
            />
          </div>
        )}
        {isExpandable && (
          <span className={`${styles.chevron} ${expanded ? styles.chevronOpen : ''}`}>
            ▾
          </span>
        )}
      </button>

      {expanded && (hasDetail || hasChildren) && (
        <div className={styles.body}>
          {node.detail && <p className={styles.detail}>{node.detail}</p>}
          {hasChildren && (
            <div className={styles.children}>
              {node.children!.map((child, i) => (
                <ConceptDiagramNode
                  key={child.entityId ?? i}
                  node={child}
                  depth={depth + 1}
                  onNodeClick={onNodeClick}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
