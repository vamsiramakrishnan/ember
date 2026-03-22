/**
 * FollowUp — inline follow-up input that appears beneath any tutor entry.
 * The student taps "ask about this" → a compact input slides in.
 * Enter submits a contextual question that references the parent entry.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './FollowUp.module.css';

interface FollowUpProps {
  /** The tutor's text that the student is responding to. */
  context: string;
  /** Called with the follow-up question and the tutor context. */
  onSubmit: (question: string, context: string) => void;
}

export function FollowUp({ context, onSubmit }: FollowUpProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const handleSubmit = useCallback(() => {
    const q = value.trim();
    if (!q) return;
    onSubmit(q, context);
    setValue('');
    setOpen(false);
  }, [value, context, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); }
      if (e.key === 'Escape') { setOpen(false); setValue(''); }
    },
    [handleSubmit],
  );

  if (!open) {
    return (
      <button
        className={styles.trigger}
        onClick={() => setOpen(true)}
        aria-label="Ask a follow-up question"
      >
        ask about this
      </button>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.inputRow}>
        <span className={styles.prompt}>↳</span>
        <input
          ref={inputRef}
          className={styles.input}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What about this?"
          aria-label="Follow-up question"
        />
        <button
          className={styles.cancel}
          onClick={() => { setOpen(false); setValue(''); }}
          aria-label="Cancel"
        >
          esc
        </button>
      </div>
    </div>
  );
}
