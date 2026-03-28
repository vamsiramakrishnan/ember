/**
 * GraphCardNode — warm paper card for knowledge graph nodes.
 * Replaces SVG circles with cards matching the LandingDemoCanvas aesthetic:
 * paper background, semantic accent border, Cormorant label, Plex Mono sub.
 * See: 06-component-inventory.md, Family 4.
 */
import { useCallback } from 'react';
import type { LayoutNode } from '@/types/graph-canvas';
import styles from './GraphCardNode.module.css';

interface GraphCardNodeProps {
  node: LayoutNode;
  focused: boolean;
  dimmed: boolean;
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

export function GraphCardNode({
  node, focused, dimmed, onMouseDown, onMouseEnter, onMouseLeave, onClick,
}: GraphCardNodeProps) {
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(node.id); }
  }, [onClick, node.id]);

  const accent = ACCENT_CLASS[node.kind] ?? '';
  const cls = [
    styles.card,
    accent ? styles[accent] : '',
    focused ? styles.focused : '',
    dimmed ? styles.dimmed : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cls}
      style={{ left: node.x, top: node.y, transform: 'translate(-50%, -50%)' }}
      role="button"
      tabIndex={0}
      aria-label={`${node.kind}: ${node.label}`}
      onMouseDown={(e) => onMouseDown(node.id, e)}
      onMouseEnter={() => onMouseEnter(node.id)}
      onMouseLeave={onMouseLeave}
      onClick={(e) => { e.stopPropagation(); onClick(node.id); }}
      onKeyDown={handleKeyDown}
    >
      <span className={styles.label}>
        {node.label.length > 28 ? node.label.slice(0, 26) + '\u2026' : node.label}
      </span>
      <span className={styles.sub}>{subLabel(node)}</span>
    </div>
  );
}
