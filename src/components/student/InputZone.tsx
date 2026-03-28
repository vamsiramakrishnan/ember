/** InputZone (7.4) — student's writing area. See: 06-component-inventory.md */
import { useState, useRef, useCallback, useEffect } from 'react';
import { inferEntryType } from '@/hooks/useEntryInference';
import { detectTrigger, replaceTrigger } from './trigger-detect';
import { SketchInput } from './SketchInput';
import { BlockInserter } from './BlockInserter';
import { InputAffordances } from './InputAffordances';
import { ChipPreviewBar } from './ChipPreviewBar';
import { MathPreview } from '@/primitives/MathPreview';
import type { StudentEntryType } from '@/types/entries';
import styles from './InputZone.module.css';

const typeLabels: Record<StudentEntryType, string> = {
  prose: '', question: 'question', hypothesis: 'hypothesis', scratch: 'note',
};

interface InputZoneProps {
  onSubmit?: (content: string) => void;
  onSubmitTyped?: (content: string, type: StudentEntryType) => void;
  onSketchSubmit?: (dataUrl: string) => void;
  onMentionTrigger?: (query: string) => void;
  onSlashTrigger?: (query: string) => void;
  onPopupClose?: () => void;
  onPaste?: (e: React.ClipboardEvent) => void;
  insertText?: string | null;
  onInsertConsumed?: () => void;
  popupOpen?: boolean;
  disabled?: boolean;
  /** Whether the last tutor entry was a Socratic question. */
  afterQuestion?: boolean;
}

export function InputZone({
  onSubmit, onSubmitTyped, onSketchSubmit,
  onMentionTrigger, onSlashTrigger, onPopupClose, onPaste,
  insertText, onInsertConsumed, popupOpen, disabled, afterQuestion,
}: InputZoneProps) {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [sketchMode, setSketchMode] = useState(false);
  const [forcedType, setForcedType] = useState<StudentEntryType | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const triggerPos = useRef(-1);
  const pendingCursorPos = useRef<number | null>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) { el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px`; }
    if (pendingCursorPos.current !== null && el) {
      const pos = pendingCursorPos.current;
      pendingCursorPos.current = null;
      requestAnimationFrame(() => {
        el.setSelectionRange(pos, pos);
        el.focus();
      });
    }
  }, [value]);

  useEffect(() => {
    if (!insertText || triggerPos.current < 0) return;
    const pos = triggerPos.current;
    pendingCursorPos.current = pos + insertText.length;
    setValue((prev) => replaceTrigger(prev, pos, insertText));
    triggerPos.current = -1;
    onInsertConsumed?.();
  }, [insertText, onInsertConsumed]);

  const submit = useCallback((text: string, type?: StudentEntryType) => {
    const resolved = type ?? forcedType;
    if (resolved && onSubmitTyped) onSubmitTyped(text, resolved);
    else onSubmit?.(text);
    setValue(''); setForcedType(null); triggerPos.current = -1; onPopupClose?.();
  }, [forcedType, onSubmit, onSubmitTyped, onPopupClose]);

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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (popupOpen && (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        e.preventDefault();
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey && value.trim()) {
        e.preventDefault(); submit(value.trim());
      }
      if (e.key === 'Escape') {
        if (forcedType) setForcedType(null);
        onPopupClose?.();
      }
    }, [value, submit, forcedType, onPopupClose, popupOpen]);

  const handleBlockSelect = useCallback(
    (type: StudentEntryType) => { setForcedType(type); textareaRef.current?.focus(); }, []);

  if (sketchMode) return <SketchInput
    onSubmit={(d) => { onSketchSubmit?.(d); setSketchMode(false); }}
    onCancel={() => setSketchMode(false)} />;

  const inferredType = value.trim() ? inferEntryType(value.trim()) : null;
  const displayType = forcedType ? typeLabels[forcedType] || forcedType : inferredType ? typeLabels[inferredType] : '';

  return (
    <div className={`${styles.container} ${afterQuestion ? styles.afterQuestion : ''}`}
      onClick={() => textareaRef.current?.focus()}>
      <BlockInserter onSelect={handleBlockSelect} />
      {forcedType && <div className={styles.forcedTypeBar}>
        <span className={styles.forcedTypeLabel}>{forcedType}</span>
        <button className={styles.forcedTypeClear} aria-label="Clear entry type"
          onClick={(e) => { e.stopPropagation(); setForcedType(null); }}>esc</button>
      </div>}
      <textarea ref={textareaRef}
        className={styles.textarea}
        value={value} onChange={handleChange}
        onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown} onPaste={onPaste}
        rows={1} disabled={disabled}
        aria-label="Write your thoughts" aria-busy={disabled} />
      <ChipPreviewBar value={value} />
      <MathPreview value={value} />
      {!isFocused && !value && !forcedType && <>
        <div className={disabled ? styles.cursorThinking : styles.cursor} aria-hidden="true" />
        {!disabled && <span className={styles.hint}>What are you thinking about?</span>}
      </>}
      <div className={styles.bottomRow}>
        {displayType && !forcedType && <span key={displayType} className={
          inferredType === 'question' ? styles.typeIndicatorQuestion
          : inferredType === 'hypothesis' ? styles.typeIndicatorHypothesis
          : inferredType === 'scratch' ? styles.typeIndicatorScratch
          : styles.typeIndicator}>{displayType}</span>}
        <button className={styles.sketchToggle} aria-label="Switch to sketch mode"
          onClick={(e) => { e.stopPropagation(); setSketchMode(true); }}>sketch</button>
      </div>
      <InputAffordances />
    </div>
  );
}
