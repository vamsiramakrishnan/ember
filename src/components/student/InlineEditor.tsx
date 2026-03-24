/**
 * InlineEditor — in-place editing overlay for existing notebook entries.
 * Post-spec extension: not in the original component inventory (06).
 * Added to support editing previously submitted entries without leaving
 * the notebook flow. Reuses @mention and /command chip rendering from InputZone.
 * Related: 06-component-inventory.md 7.4 (InputZone),
 *          04-information-architecture.md (notebook surface, permanence)
 */
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { MENTION_PATTERN } from '@/primitives/MentionChip';
import { detectTrigger, replaceTrigger } from './trigger-detect';
import { InputPreview } from './InputPreview';
import styles from './InlineEditor.module.css';

interface InlineEditorProps {
  initialContent: string;
  entryType: string;
  onSave: (content: string) => void;
  onCancel: () => void;
  /** For @ mention popup integration. */
  onMentionTrigger?: (query: string) => void;
  onSlashTrigger?: (query: string) => void;
  onPopupClose?: () => void;
  insertText?: string | null;
  onInsertConsumed?: () => void;
}

export function InlineEditor({
  initialContent, entryType, onSave, onCancel,
  onMentionTrigger, onSlashTrigger, onPopupClose,
  insertText, onInsertConsumed,
}: InlineEditorProps) {
  const [value, setValue] = useState(initialContent);
  const ref = useRef<HTMLTextAreaElement>(null);
  const triggerPos = useRef(-1);
  const pendingCursorPos = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) { el.focus(); el.selectionStart = el.value.length; }
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (el) { el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px`; }
    // After React commits the new value to the DOM, apply any pending cursor position
    if (pendingCursorPos.current !== null && el) {
      const pos = pendingCursorPos.current;
      pendingCursorPos.current = null;
      requestAnimationFrame(() => {
        el.setSelectionRange(pos, pos);
        el.focus();
      });
    }
  }, [value]);

  // Insert text from popup selection at trigger position
  useEffect(() => {
    if (!insertText || triggerPos.current < 0) return;
    const pos = triggerPos.current;
    pendingCursorPos.current = pos + insertText.length;
    setValue((prev) => replaceTrigger(prev, pos, insertText));
    triggerPos.current = -1;
    onInsertConsumed?.();
  }, [insertText, onInsertConsumed]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const cursor = e.target.selectionStart ?? text.length;
    setValue(text);
    const trigger = detectTrigger(text, cursor);
    if (trigger.type === 'mention') {
      triggerPos.current = trigger.position;
      onMentionTrigger?.(trigger.query); return;
    }
    if (trigger.type === 'slash') {
      triggerPos.current = trigger.position;
      onSlashTrigger?.(trigger.query); return;
    }
    triggerPos.current = -1;
    onPopupClose?.();
  }, [onMentionTrigger, onSlashTrigger, onPopupClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSave(value.trim()); }
    if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
  }, [value, onSave, onCancel]);

  const handleBlur = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== initialContent) onSave(trimmed);
    else onCancel();
  }, [value, initialContent, onSave, onCancel]);

  const typeCls = entryType === 'question' ? styles.question
    : entryType === 'scratch' ? styles.scratch
    : entryType === 'hypothesis' ? styles.hypothesis
    : styles.prose;

  const hasChips = useMemo(() => {
    const mentionRe = new RegExp(MENTION_PATTERN.source);
    return mentionRe.test(value) || /(?:^|\s)\/\w+\s/.test(value);
  }, [value]);

  return (
    <div className={styles.wrap}>
      <textarea ref={ref}
        className={`${hasChips ? styles.editorHidden : styles.editor} ${typeCls}`}
        value={value} onChange={handleChange}
        onKeyDown={handleKeyDown} onBlur={handleBlur}
        placeholder="Continue your thought…"
        rows={1} aria-label="Edit entry" />
      <InputPreview value={value} visible={hasChips} />
    </div>
  );
}
