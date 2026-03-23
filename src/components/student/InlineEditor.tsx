/**
 * InlineEditor — textarea that replaces entry content during editing.
 *
 * Appears on double-click of a student entry. Enter saves, Escape cancels.
 * Auto-sizes to content. Styled to match the entry's original typography
 * so the transition feels like the text became editable, not like a
 * different UI element appeared.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './InlineEditor.module.css';

interface InlineEditorProps {
  /** The current content to edit. */
  initialContent: string;
  /** Entry type — affects font styling. */
  entryType: string;
  /** Called with the new content when the user saves. */
  onSave: (content: string) => void;
  /** Called when the user cancels (Escape). */
  onCancel: () => void;
}

export function InlineEditor({
  initialContent,
  entryType,
  onSave,
  onCancel,
}: InlineEditorProps) {
  const [value, setValue] = useState(initialContent);
  const ref = useRef<HTMLTextAreaElement>(null);

  // Auto-focus and select on mount
  useEffect(() => {
    const el = ref.current;
    if (el) {
      el.focus();
      el.selectionStart = el.value.length;
    }
  }, []);

  // Auto-resize to content
  useEffect(() => {
    const el = ref.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [value]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSave(value.trim());
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  }, [value, onSave, onCancel]);

  const handleBlur = useCallback(() => {
    // Save on blur if content changed, otherwise cancel
    const trimmed = value.trim();
    if (trimmed && trimmed !== initialContent) {
      onSave(trimmed);
    } else {
      onCancel();
    }
  }, [value, initialContent, onSave, onCancel]);

  // Map entry type to a CSS modifier class
  const typeCls = entryType === 'question' ? styles.question
    : entryType === 'scratch' ? styles.scratch
    : entryType === 'hypothesis' ? styles.hypothesis
    : styles.prose;

  return (
    <textarea
      ref={ref}
      className={`${styles.editor} ${typeCls}`}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      rows={1}
      aria-label="Edit entry"
    />
  );
}
