/**
 * MentionPopup — appears when the student types @ in the InputZone.
 * Shows fuzzy-matched entities from the local index.
 * Zero latency — all search happens in-memory.
 *
 * Navigation: arrow keys to select, Enter to insert, Escape to close.
 * Renders as a positioned overlay anchored to the cursor position.
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
  notebook: '◉',
  session: '§',
  thinker: '◈',
  concept: '◇',
  term: '≡',
  text: '▤',
  question: '?',
};

const TYPE_LABELS: Record<EntityType, string> = {
  notebook: 'notebook',
  session: 'session',
  thinker: 'thinker',
  concept: 'concept',
  term: 'term',
  text: 'text',
  question: 'question',
};

export function MentionPopup({
  query, results, onSelect, onClose, position,
}: MentionPopupProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  // Reset selection when results change
  useEffect(() => setSelectedIdx(0), [results]);

  // Keyboard navigation
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

  // Scroll selected item into view
  useEffect(() => {
    const el = menuRef.current?.children[selectedIdx] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIdx]);

  const handleClick = useCallback((entity: Entity) => {
    onSelect(entity);
  }, [onSelect]);

  if (results.length === 0 && query.length > 0) {
    return (
      <div
        className={styles.popup}
        style={position ? { top: position.top, left: position.left } : undefined}
      >
        <div className={styles.empty}>no matches</div>
      </div>
    );
  }

  if (results.length === 0) return null;

  return (
    <div
      className={styles.popup}
      style={position ? { top: position.top, left: position.left } : undefined}
      ref={menuRef}
      role="listbox"
      aria-label="Mention suggestions"
    >
      {results.map((entity, i) => (
        <button
          key={entity.id}
          className={`${styles.item} ${i === selectedIdx ? styles.selected : ''}`}
          role="option"
          aria-selected={i === selectedIdx}
          onClick={() => handleClick(entity)}
          onMouseEnter={() => setSelectedIdx(i)}
        >
          <span className={styles.icon}>{TYPE_ICONS[entity.type]}</span>
          <div className={styles.content}>
            <span className={styles.name}>{entity.name}</span>
            {entity.detail && (
              <span className={styles.detail}>{entity.detail}</span>
            )}
          </div>
          <span className={styles.type}>{TYPE_LABELS[entity.type]}</span>
        </button>
      ))}
    </div>
  );
}
