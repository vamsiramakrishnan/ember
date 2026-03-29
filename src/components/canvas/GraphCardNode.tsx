/**
 * GraphCardNode — warm paper card for knowledge graph nodes.
 * was: uniform size, no density encoding, click goes to external panel
 * now: size scales with connection count, mastery arc on concepts,
 *      click expands inline with detail + neighbors
 *
 * See: 06-component-inventory.md, Family 4.
 */
import { useState, useCallback } from 'react';
import type { LayoutNode } from '@/types/graph-canvas';
import styles from './GraphCardNode.module.css';

interface Neighbor {
  id: string;
  label: string;
  kind: string;
}

interface GraphCardNodeProps {
  node: LayoutNode;
  focused: boolean;
  dimmed: boolean;
  /** Number of edges connected to this node — drives visual density. */
  connectionCount: number;
  neighbors: Neighbor[];
  onMouseDown: (id: string, e: React.MouseEvent) => void;
  onMouseEnter: (id: string) => void;
  onMouseLeave: () => void;
  onClick: (id: string) => void;
}

const ACCENT_CLASS: Record<string, string> = {
  concept: 'sage',
  thinker: 'amber',
  term: 'indigo',
  curiosity: 'margin',
};

function subLabel(node: LayoutNode): string {
  if (node.kind === 'thinker' && node.dates) return node.dates;
  if (node.kind === 'term') return 'term';
  if (node.kind === 'curiosity') return 'question';
  if (node.kind === 'concept' && node.mastery) return `${node.mastery}% mastery`;
  return node.kind;
}

/** SVG mastery arc — subtle ring around concepts with mastery > 0.
 * was: no visual mastery on the card itself, now: 270-degree arc
 * Enhanced: thicker stroke, semantic color by mastery level, subtle glow on high mastery */
function MasteryArc({ mastery }: { mastery: number }) {
  if (mastery <= 0) return null;
  const r = 14;
  const circumference = 2 * Math.PI * r;
  const arcLength = (mastery / 100) * circumference * 0.75;
  const color = mastery >= 80 ? 'var(--sage)' : mastery >= 50 ? 'var(--ink)' : 'var(--indigo)';
  const opacity = mastery >= 80 ? 0.6 : 0.45;
  return (
    <svg className={styles.masteryArc} width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
      {/* Track ring — faint background */}
      <circle cx="16" cy="16" r={r} fill="none"
        stroke="var(--rule-light)" strokeWidth="2"
        transform="rotate(-135 16 16)"
        strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
      />
      {/* Progress arc */}
      <circle cx="16" cy="16" r={r} fill="none"
        stroke={color} strokeWidth="2.5"
        strokeDasharray={`${arcLength} ${circumference}`}
        strokeDashoffset="0" strokeLinecap="round"
        opacity={opacity}
        transform="rotate(-135 16 16)"
        style={{ transition: 'stroke-dasharray 1s ease' }}
      />
    </svg>
  );
}

export function GraphCardNode({
  node, focused, dimmed, connectionCount, neighbors,
  onMouseDown, onMouseEnter, onMouseLeave, onClick,
}: GraphCardNodeProps) {
  const [expanded, setExpanded] = useState(false);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((prev) => !prev);
    onClick(node.id);
  }, [onClick, node.id]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setExpanded((prev) => !prev);
      onClick(node.id);
    }
  }, [onClick, node.id]);

  const accent = ACCENT_CLASS[node.kind] ?? '';

  /* Density scaling: cards with more connections are wider.
   * was: fixed min-width 80px / max-width 160px
   * now: base 90px + 8px per connection, capped at 200px
   * reason: highly-connected concepts should draw more visual weight */
  const densityWidth = Math.min(90 + connectionCount * 8, 200);

  const cls = [
    styles.card,
    accent ? styles[accent] : '',
    focused ? styles.focused : '',
    dimmed ? styles.dimmed : '',
    expanded ? styles.expanded : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cls}
      style={{
        left: node.x,
        top: node.y,
        transform: 'translate(-50%, -50%)',
        minWidth: densityWidth,
        animationDelay: `${Math.random() * 0.3}s`,
      }}
      role="button"
      tabIndex={0}
      aria-label={`${node.kind}: ${node.label}`}
      aria-expanded={expanded}
      title={node.label.length > 28 ? node.label : undefined}
      onMouseDown={(e) => onMouseDown(node.id, e)}
      onMouseEnter={() => onMouseEnter(node.id)}
      onMouseLeave={onMouseLeave}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.header}>
        {node.kind === 'concept' && node.mastery !== undefined && node.mastery > 0 && (
          <MasteryArc mastery={node.mastery} />
        )}
        <span className={styles.label}>
          {node.label.length > 28 ? node.label.slice(0, 26) + '\u2026' : node.label}
        </span>
      </div>
      <span className={styles.sub}>{subLabel(node)}</span>

      {/* Inline expansion: detail + neighbors inside the card.
        * was: separate GraphDetail panel below canvas
        * now: expands inline, preserving spatial context */}
      {expanded && focused && (
        <div className={styles.expandedContent}>
          {node.detail && <p className={styles.detail}>{node.detail}</p>}
          {node.dates && node.kind === 'thinker' && (
            <span className={styles.meta}>{node.dates}</span>
          )}
          {node.mastery !== undefined && node.mastery > 0 && (
            <div className={styles.masteryRow}>
              <div className={styles.masteryTrack}>
                <div className={styles.masteryFill} style={{ width: `${node.mastery}%` }} />
              </div>
              <span className={styles.masteryLabel}>{node.mastery}%</span>
            </div>
          )}
          {neighbors.length > 0 && (
            <p className={styles.neighbors}>
              {neighbors.map((n) => n.label).join(' · ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
