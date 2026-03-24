/**
 * FollowUp — inline follow-up input beneath tutor entries.
 * Renders its own MentionPopup and SlashCommandPopup locally
 * so popups appear near the cursor, not at the page bottom.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { detectTrigger, replaceTrigger } from '@/components/student/trigger-detect';
import { MentionPopup } from '@/components/student/MentionPopup';
import { SlashCommandPopup } from '@/components/student/SlashCommandPopup';
import type { SlashCommand } from '@/components/student/SlashCommandPopup';
import { ChipPreviewBar } from '@/components/student/ChipPreviewBar';
import { useEntityIndex } from '@/hooks/useEntityIndex';
import { createMentionSyntax } from '@/primitives/MentionChip';
import styles from './FollowUp.module.css';

interface FollowUpProps {
  context: string;
  onSubmit: (question: string, context: string) => void;
}

export function FollowUp({ context, onSubmit }: FollowUpProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [slashQuery, setSlashQuery] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const triggerPos = useRef(-1);
  const pendingCursorPos = useRef<number | null>(null);
  const { search } = useEntityIndex();

  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  useEffect(() => {
    const el = inputRef.current;
    if (el) { el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px`; }
    if (pendingCursorPos.current !== null && el) {
      const pos = pendingCursorPos.current;
      pendingCursorPos.current = null;
      requestAnimationFrame(() => { el.setSelectionRange(pos, pos); el.focus(); });
    }
  }, [value]);

  const insertText = useCallback((text: string) => {
    if (triggerPos.current < 0) return;
    const pos = triggerPos.current;
    pendingCursorPos.current = pos + text.length;
    setValue((prev) => replaceTrigger(prev, pos, text));
    triggerPos.current = -1;
    setMentionQuery(null);
    setSlashQuery(null);
  }, []);

  const closePopups = useCallback(() => {
    setMentionQuery(null); setSlashQuery(null); triggerPos.current = -1;
  }, []);

  const handleSubmit = useCallback(() => {
    const q = value.trim();
    if (!q) return;
    onSubmit(q, context);
    setValue(''); setOpen(false); closePopups();
  }, [value, context, onSubmit, closePopups]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const cursor = e.target.selectionStart ?? text.length;
    setValue(text);
    const trigger = detectTrigger(text, cursor);
    if (trigger.type === 'mention') {
      triggerPos.current = trigger.position;
      setMentionQuery(trigger.query); setSlashQuery(null);
      return;
    }
    if (trigger.type === 'slash') {
      triggerPos.current = trigger.position;
      setSlashQuery(trigger.query); setMentionQuery(null);
      return;
    }
    closePopups();
  }, [closePopups]);

  const popupOpen = mentionQuery !== null || slashQuery !== null;

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (popupOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter')) {
      return; // let popup handle these via its own document listener
    }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
    if (e.key === 'Escape') {
      if (popupOpen) { closePopups(); return; }
      setOpen(false); setValue('');
    }
  }, [handleSubmit, popupOpen, closePopups]);

  if (!open) {
    return (
      <button className={styles.trigger} onClick={() => setOpen(true)}
        aria-label="Ask a follow-up question">
        ask about this
      </button>
    );
  }

  const mentionResults = mentionQuery !== null ? search(mentionQuery).slice(0, 6) : [];

  return (
    <div className={styles.container}>
      <div className={styles.inputRow}>
        <span className={styles.prompt}>↳</span>
        <div className={styles.inputWrap}>
          <textarea ref={inputRef} className={styles.input} value={value}
            onChange={handleChange} onKeyDown={handleKeyDown}
            placeholder="What about this?" aria-label="Follow-up question" rows={1} />
          {mentionQuery !== null && (
            <MentionPopup query={mentionQuery} results={mentionResults}
              onSelect={(entity) => insertText(createMentionSyntax(entity.name, entity.type, entity.id) + ' ')}
              onClose={() => setMentionQuery(null)} />
          )}
          {slashQuery !== null && (
            <SlashCommandPopup query={slashQuery}
              onSelect={(cmd: SlashCommand) => insertText(`/${cmd.label} `)}
              onClose={() => setSlashQuery(null)} />
          )}
        </div>
        <button className={styles.cancel}
          onClick={() => { setOpen(false); setValue(''); closePopups(); }}
          aria-label="Cancel">esc</button>
      </div>
      <ChipPreviewBar value={value} />
    </div>
  );
}
