/**
 * AnnotationMargin — renders annotations in the right margin
 * of any notebook block. Both student and tutor can annotate.
 *
 * Student annotations: clicking the margin opens a small textarea.
 * Tutor annotations: appear automatically when the AI responds
 * to a specific block rather than the whole conversation.
 *
 * Visual: like pencil marginalia in a library book.
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
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (composing) inputRef.current?.focus();
  }, [composing]);

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
      setComposing(false);
      setDraft('');
    }
  }, [handleSubmit]);

  return (
    <div className={styles.margin}>
      {annotations.map((ann) => (
        <div
          key={ann.id}
          className={`${styles.note} ${ann.author === 'tutor' ? styles.tutorNote : styles.studentNote}`}
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
          className={styles.addButton}
          onClick={() => setComposing(true)}
          aria-label="Add annotation"
        >
          +
        </button>
      )}
    </div>
  );
}
