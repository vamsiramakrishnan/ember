/**
 * MentionPopup — @ mention autocomplete popup for the InputZone.
 * Post-spec extension: not in the original component inventory (06).
 * Added to support entity linking within student prose — typing @ triggers
 * fuzzy-matched suggestions for thinkers, concepts, terms, and other entities.
 * Related: 06-component-inventory.md 7.4 (InputZone),
 *          05-ai-contract.md (student model, entity cross-referencing)
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
  entry: '¶', slide: '▸', card: '⬡', exercise: '◆',
  code: '⟨⟩', diagram: '⊞', image: '▣', file: '⎙',
  'tutor-note': '✎', podcast: '♪',
};

/** Map entity types to accent color classes. */
const TYPE_ACCENT: Record<EntityType, string> = {
  notebook: styles.iconMargin ?? '', session: styles.iconDefault ?? '',
  thinker: styles.iconAmber ?? '', concept: styles.iconIndigo ?? '',
  term: styles.iconSage ?? '', text: styles.iconMargin ?? '',
  question: styles.iconDefault ?? '',
  entry: styles.iconDefault ?? '', slide: styles.iconIndigo ?? '',
  card: styles.iconSage ?? '', exercise: styles.iconAmber ?? '',
  code: styles.iconDefault ?? '', diagram: styles.iconIndigo ?? '',
  image: styles.iconDefault ?? '', file: styles.iconDefault ?? '',
  'tutor-note': styles.iconAmber ?? '', podcast: styles.iconSage ?? '',
};

const TYPE_LABELS: Record<EntityType, string> = {
  notebook: 'notebook', session: 'session', thinker: 'thinker',
  concept: 'concept', term: 'term', text: 'text', question: 'question',
  entry: 'entry', slide: 'slide', card: 'card', exercise: 'exercise',
  code: 'code', diagram: 'diagram', image: 'image', file: 'file',
  'tutor-note': 'tutor', podcast: 'podcast',
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
        e.stopPropagation();
        setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIdx]) {
        e.preventDefault();
        e.stopPropagation();
        onSelect(results[selectedIdx]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    // Use capture phase to intercept before textarea receives the event
    document.addEventListener('keydown', handleKey, true);
    return () => document.removeEventListener('keydown', handleKey, true);
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
          {entity.meta && <span className={styles.meta}>{entity.meta}</span>}
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
