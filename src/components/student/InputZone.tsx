/** InputZone (7.4) — student's writing area. See: 06-component-inventory.md */
import { useState, useRef, useCallback, useEffect } from 'react';
import { inferEntryType } from '@/hooks/useEntryInference';
import { SketchInput } from './SketchInput';
import { BlockInserter } from './BlockInserter';
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
  /** Text to insert at the current @ or / trigger position. */
  insertText?: string | null;
  /** Called after insertText is consumed. */
  onInsertConsumed?: () => void;
}

export function InputZone({
  onSubmit, onSubmitTyped, onSketchSubmit,
  onMentionTrigger, onSlashTrigger, onPopupClose, onPaste,
  insertText, onInsertConsumed,
}: InputZoneProps) {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [sketchMode, setSketchMode] = useState(false);
  const [forcedType, setForcedType] = useState<StudentEntryType | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) { el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px`; }
  }, [value]);

  // Insert text from mention/slash selection
  useEffect(() => {
    if (!insertText) return;
    setValue((prev) => {
      // Replace @query or /query at end of text with the insertion
      const replaced = prev.replace(/@\w*$/, insertText).replace(/^\/\w*$/, insertText);
      return replaced === prev ? prev + insertText : replaced;
    });
    onInsertConsumed?.();
    textareaRef.current?.focus();
  }, [insertText, onInsertConsumed]);

  const submit = useCallback((text: string, type?: StudentEntryType) => {
    const resolved = type ?? forcedType;
    if (resolved && onSubmitTyped) {
      onSubmitTyped(text, resolved);
    } else {
      onSubmit?.(text);
    }
    setValue('');
    setForcedType(null);
    onPopupClose?.();
  }, [forcedType, onSubmit, onSubmitTyped, onPopupClose]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setValue(text);

    const atMatch = text.match(/@(\w*)$/);
    if (atMatch) { onMentionTrigger?.(atMatch[1] ?? ''); return; }
    const slashMatch = text.match(/^\/(\w*)$/);
    if (slashMatch) { onSlashTrigger?.(slashMatch[1] ?? ''); return; }
    onPopupClose?.();
  }, [onMentionTrigger, onSlashTrigger, onPopupClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey && value.trim()) {
        e.preventDefault();
        submit(value.trim());
      }
      if (e.key === 'Escape') {
        if (forcedType) setForcedType(null);
        onPopupClose?.();
      }
    },
    [value, submit, forcedType, onPopupClose],
  );

  const handleBlockSelect = useCallback((type: StudentEntryType) => {
    setForcedType(type);
    textareaRef.current?.focus();
  }, []);

  if (sketchMode) return (
    <SketchInput
      onSubmit={(d) => { onSketchSubmit?.(d); setSketchMode(false); }}
      onCancel={() => setSketchMode(false)}
    />
  );

  const displayType = forcedType ? typeLabels[forcedType] || forcedType
    : value.trim() ? typeLabels[inferEntryType(value.trim())] : '';

  return (
    <div
      className={styles.container}
      onClick={() => textareaRef.current?.focus()}
      role="textbox"
      aria-label="Writing area"
    >
      <BlockInserter onSelect={handleBlockSelect} />
      {forcedType && (
        <div className={styles.forcedTypeBar}>
          <span className={styles.forcedTypeLabel}>{forcedType}</span>
          <button
            className={styles.forcedTypeClear}
            onClick={(e) => { e.stopPropagation(); setForcedType(null); }}
            aria-label="Clear entry type"
          >
            esc
          </button>
        </div>
      )}
      <textarea
        ref={textareaRef}
        className={styles.textarea}
        value={value}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        onPaste={onPaste}
        rows={1}
        aria-label="Write your thoughts"
      />
      {!isFocused && !value && !forcedType && (
        <>
          <div className={styles.cursor} aria-hidden="true" />
          <span className={styles.hint}>What are you thinking about?</span>
        </>
      )}
      <div className={styles.bottomRow}>
        {displayType && !forcedType && (
          <span className={styles.typeIndicator}>{displayType}</span>
        )}
        <button
          className={styles.sketchToggle}
          onClick={(e) => { e.stopPropagation(); setSketchMode(true); }}
          aria-label="Switch to sketch mode"
        >
          sketch
        </button>
      </div>
      <InputAffordances />
    </div>
  );
}

const AFFORDANCE_HINTS = ['@mention', '/command', '? asks the tutor', 'paste images'];
function InputAffordances() {
  return (
    <div className={styles.affordances} aria-hidden="true">
      {AFFORDANCE_HINTS.map((h) => <span key={h} className={styles.affordance}>{h}</span>)}
    </div>
  );
}
