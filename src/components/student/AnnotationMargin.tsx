/**
 * AnnotationMargin — pencil notes in the right margin.
 *
 * Incremental reveal (Layer 1 → 2 → 3):
 *   Layer 1 (rest): count indicator — a ghost-quiet dot + number.
 *     "There's something here." No text, no distraction.
 *   Layer 2 (hover): the + button to add an annotation appears.
 *   Layer 3 (click): the full annotation panel expands, showing
 *     all notes and the compose textarea.
 *
 * Visual: a tiny pencil mark in the margin that, when you lean
 * closer, reveals handwritten notes from student and tutor.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { MarkdownContent } from '@/primitives/MarkdownContent';
import type { EntryAnnotation } from '@/types/entries';
import styles from './AnnotationMargin.module.css';

interface AnnotationMarginProps {
  annotations: EntryAnnotation[];
  onAdd: (content: string) => void;
}

export function AnnotationMargin({ annotations, onAdd }: AnnotationMarginProps) {
  const [expanded, setExpanded] = useState(false);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (composing) inputRef.current?.focus();
  }, [composing]);

  // Close panel when clicking outside
  useEffect(() => {
    if (!expanded) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setExpanded(false);
        setComposing(false);
        setDraft('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [expanded]);

  const handleSubmit = useCallback(() => {
    if (!draft.trim()) return;
    onAdd(draft.trim());
    setDraft('');
    setComposing(false);
  }, [draft, onAdd]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      if (composing) { setComposing(false); setDraft(''); }
      else { setExpanded(false); }
    }
  }, [handleSubmit, composing]);

  const count = annotations.length;

  // Layer 1: count indicator (always visible when annotations exist)
  if (!expanded) {
    return (
      <div className={styles.margin}>
        {count > 0 && (
          <button
            className={styles.indicator}
            onClick={() => setExpanded(true)}
            aria-label={`${count} annotation${count !== 1 ? 's' : ''} — click to expand`}
            title={`${count} annotation${count !== 1 ? 's' : ''}`}
          >
            <span className={styles.dot}>·</span>
            <span className={styles.count}>{count}</span>
          </button>
        )}
        {/* Layer 2: add button (visible on parent hover) */}
        <button
          className={styles.addButton}
          onClick={() => { setExpanded(true); setComposing(true); }}
          aria-label="Add annotation"
        >
          +
        </button>
      </div>
    );
  }

  // Layer 3: expanded panel with all annotations
  return (
    <div className={styles.panel} ref={panelRef}>
      {annotations.map((ann) => (
        <div
          key={ann.id}
          className={`${styles.note} ${
            ann.author === 'tutor' ? styles.tutorNote : styles.studentNote
          }`}
        >
          <span className={styles.author}>
            {ann.author === 'tutor' ? '¶' : '·'}
          </span>
          <span className={styles.text}>
            <MarkdownContent>{ann.content}</MarkdownContent>
          </span>
        </div>
      ))}

      {composing ? (
        <div className={styles.compose}>
          <textarea
            ref={inputRef}
            className={styles.input}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => { if (!draft.trim()) setComposing(false); }}
            placeholder="annotate..."
            rows={1}
          />
        </div>
      ) : (
        <button
          className={styles.addButtonInline}
          onClick={() => setComposing(true)}
          aria-label="Add annotation"
        >
          +
        </button>
      )}

      <button
        className={styles.collapse}
        onClick={() => { setExpanded(false); setComposing(false); setDraft(''); }}
        aria-label="Collapse annotations"
      >
        ‹
      </button>
    </div>
  );
}
