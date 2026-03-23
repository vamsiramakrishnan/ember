/**
 * MentionPopup — appears when the student types @ in the InputZone.
 * Shows fuzzy-matched entities from the local index with accent-colored
 * type icons and keyboard navigation hints.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import type { Entity, EntityType } from '@/hooks/useEntityIndex';
import styles from './MentionPopup.module.css';

interface MentionPopupProps {
  query: string;
  results: Entity[];
  onSelect: (entity: Entity) => void;
  onClose: () => void;
  position?: { top: number; left: number };
}

const TYPE_ICONS: Record<EntityType, string> = {
  notebook: '◉', session: '§', thinker: '◈', concept: '◇',
  term: '≡', text: '▤', question: '?',
};

/** Map entity types to accent color classes. */
const TYPE_ACCENT: Record<EntityType, string> = {
  notebook: styles.iconMargin ?? '', session: styles.iconDefault ?? '',
  thinker: styles.iconAmber ?? '', concept: styles.iconIndigo ?? '',
  term: styles.iconSage ?? '', text: styles.iconMargin ?? '',
  question: styles.iconDefault ?? '',
};

const TYPE_LABELS: Record<EntityType, string> = {
  notebook: 'notebook', session: 'session', thinker: 'thinker',
  concept: 'concept', term: 'term', text: 'text', question: 'question',
};

export function MentionPopup({
  query, results, onSelect, onClose, position,
}: MentionPopupProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setSelectedIdx(0), [results]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIdx]) {
        e.preventDefault();
        onSelect(results[selectedIdx]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [results, selectedIdx, onSelect, onClose]);

  useEffect(() => {
    const el = menuRef.current?.querySelector(`[data-idx="${selectedIdx}"]`) as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIdx]);

  const handleClick = useCallback((entity: Entity) => onSelect(entity), [onSelect]);

  const posStyle = position ? { top: position.top, left: position.left } : undefined;

  if (results.length === 0 && query.length > 0) {
    return (
      <div className={styles.popup} style={posStyle}>
        <div className={styles.queryBar}>
          <span className={styles.queryPrefix}>@</span>
          <span className={styles.queryText}>{query}</span>
        </div>
        <div className={styles.empty}>no matches</div>
      </div>
    );
  }

  if (results.length === 0) return null;

  return (
    <div className={styles.popup} style={posStyle} ref={menuRef}
      role="listbox" aria-label="Mention suggestions">
      {query && (
        <div className={styles.queryBar}>
          <span className={styles.queryPrefix}>@</span>
          <span className={styles.queryText}>{query}</span>
        </div>
      )}
      {results.map((entity, i) => (
        <button
          key={entity.id} data-idx={i}
          className={`${styles.item} ${i === selectedIdx ? styles.selected : ''}`}
          role="option" aria-selected={i === selectedIdx}
          onClick={() => handleClick(entity)}
          onMouseEnter={() => setSelectedIdx(i)}
        >
          <span className={`${styles.icon} ${TYPE_ACCENT[entity.type]}`}>
            {TYPE_ICONS[entity.type]}
          </span>
          <div className={styles.content}>
            <span className={styles.name}>{entity.name}</span>
            {entity.detail && <span className={styles.detail}>{entity.detail}</span>}
          </div>
          <span className={styles.type}>{TYPE_LABELS[entity.type]}</span>
        </button>
      ))}
      <div className={styles.footer}>
        <span className={styles.footerHint}>↑↓ navigate</span>
        <span className={styles.footerHint}>↵ select</span>
        <span className={styles.footerHint}>esc close</span>
      </div>
    </div>
  );
}
