/**
 * FollowUp — inline follow-up input beneath tutor entries.
 * Supports @mentions and /commands via the same popup system as InputZone.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { detectTrigger, replaceTrigger } from '@/components/student/trigger-detect';
import { ChipPreviewBar } from '@/components/student/ChipPreviewBar';
import type { EditPopupHandlers } from '@/contexts/NotebookContext';
import styles from './FollowUp.module.css';

interface FollowUpProps {
  context: string;
  onSubmit: (question: string, context: string) => void;
  popup?: EditPopupHandlers;
}

export function FollowUp({ context, onSubmit, popup }: FollowUpProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const triggerPos = useRef(-1);
  const pendingCursorPos = useRef<number | null>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Auto-grow textarea
  useEffect(() => {
    const el = inputRef.current;
    if (el) { el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px`; }
    if (pendingCursorPos.current !== null && el) {
      const pos = pendingCursorPos.current;
      pendingCursorPos.current = null;
      requestAnimationFrame(() => { el.setSelectionRange(pos, pos); el.focus(); });
    }
  }, [value]);

  // Handle pending insert from popup selection
  useEffect(() => {
    if (!popup?.pendingInsert || triggerPos.current < 0) return;
    const pos = triggerPos.current;
    pendingCursorPos.current = pos + popup.pendingInsert.length;
    setValue((prev) => replaceTrigger(prev, pos, popup.pendingInsert!));
    triggerPos.current = -1;
    popup.onInsertConsumed();
  }, [popup?.pendingInsert, popup?.onInsertConsumed]);

  const handleSubmit = useCallback(() => {
    const q = value.trim();
    if (!q) return;
    onSubmit(q, context);
    setValue('');
    setOpen(false);
    popup?.onPopupClose();
  }, [value, context, onSubmit, popup]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const cursor = e.target.selectionStart ?? text.length;
    setValue(text);
    const trigger = detectTrigger(text, cursor);
    if (trigger.type === 'mention' && popup) {
      triggerPos.current = trigger.position;
      popup.onMentionTrigger(trigger.query);
      return;
    }
    if (trigger.type === 'slash' && popup) {
      triggerPos.current = trigger.position;
      popup.onSlashTrigger(trigger.query);
      return;
    }
    triggerPos.current = -1;
    popup?.onPopupClose();
  }, [popup]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
    if (e.key === 'Escape') { setOpen(false); setValue(''); popup?.onPopupClose(); }
  }, [handleSubmit, popup]);

  if (!open) {
    return (
      <button className={styles.trigger} onClick={() => setOpen(true)}
        aria-label="Ask a follow-up question">
        ask about this
      </button>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.inputRow}>
        <span className={styles.prompt}>↳</span>
        <textarea
          ref={inputRef}
          className={styles.input}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="What about this?"
          aria-label="Follow-up question"
          rows={1}
        />
        <button className={styles.cancel}
          onClick={() => { setOpen(false); setValue(''); popup?.onPopupClose(); }}
          aria-label="Cancel">esc</button>
      </div>
      <ChipPreviewBar value={value} />
    </div>
  );
}
