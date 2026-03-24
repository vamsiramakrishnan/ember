/**
 * MentionPopup — @ mention autocomplete with "Create new" ghost row.
 * See: 06-component-inventory.md 7.4 (InputZone)
 */
import { useState, useEffect, useRef } from 'react';
import type { Entity, EntityType } from '@/hooks/useEntityIndex';
import styles from './MentionPopup.module.css';

interface MentionPopupProps {
  query: string;
  results: Entity[];
  onSelect: (entity: Entity) => void;
  onCreate?: (name: string) => void;
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
  query, results, onSelect, onCreate, onClose, position,
}: MentionPopupProps) {
  const showCreate = query.length >= 2 && !!onCreate;
  const totalItems = results.length + (showCreate ? 1 : 0);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setSelectedIdx(0), [results, query]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault(); e.stopPropagation();
        setSelectedIdx((i) => Math.min(i + 1, totalItems - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault(); e.stopPropagation();
        setSelectedIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault(); e.stopPropagation();
        if (selectedIdx < results.length) {
          const entity = results[selectedIdx];
          if (entity) onSelect(entity);
        } else if (showCreate) {
          onCreate(query);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault(); e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKey, true);
    return () => document.removeEventListener('keydown', handleKey, true);
  }, [results, selectedIdx, totalItems, showCreate, query, onSelect, onCreate, onClose]);

  useEffect(() => {
    const el = menuRef.current?.querySelector(`[data-idx="${selectedIdx}"]`) as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIdx]);

  const posStyle = position ? { top: position.top, left: position.left } : undefined;

  if (totalItems === 0 && query.length > 0) {
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

  if (totalItems === 0) return null;

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
          onClick={() => onSelect(entity)}
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
      {showCreate && (
        <button
          data-idx={results.length}
          className={`${styles.item} ${styles.createRow} ${results.length === selectedIdx ? styles.selected : ''}`}
          role="option" aria-selected={results.length === selectedIdx}
          onClick={() => onCreate(query)}
          onMouseEnter={() => setSelectedIdx(results.length)}
        >
          <span className={`${styles.icon} ${styles.iconCreate}`}>+</span>
          <div className={styles.content}>
            <span className={styles.createLabel}>Create &ldquo;{query}&rdquo;</span>
            <span className={styles.createHint}>add as new entity &amp; enrich</span>
          </div>
          <span className={styles.type}>new</span>
        </button>
      )}
      <div className={styles.footer}>
        <span className={styles.footerHint}>↑↓ navigate</span>
        <span className={styles.footerHint}>↵ select</span>
        <span className={styles.footerHint}>esc close</span>
      </div>
    </div>
  );
}
