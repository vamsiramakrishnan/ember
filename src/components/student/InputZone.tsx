/**
 * InputZone (7.4)
 * The student's writing area — continuous with the notebook above.
 * Supports text writing, sketch mode, and forced entry types
 * (from block inserter). No border, no placeholder, just a blinking cursor.
 * See: 06-component-inventory.md, Family 7
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { inferEntryType } from '@/hooks/useEntryInference';
import { SketchInput } from './SketchInput';
import { BlockInserter } from './BlockInserter';
import type { StudentEntryType } from '@/types/entries';
import styles from './InputZone.module.css';

const typeLabels: Record<StudentEntryType, string> = {
  prose: '',
  question: 'question',
  hypothesis: 'hypothesis',
  scratch: 'note',
};

interface InputZoneProps {
  onSubmit?: (content: string) => void;
  onSubmitTyped?: (content: string, type: StudentEntryType) => void;
  onSketchSubmit?: (dataUrl: string) => void;
}

export function InputZone({ onSubmit, onSubmitTyped, onSketchSubmit }: InputZoneProps) {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [sketchMode, setSketchMode] = useState(false);
  const [forcedType, setForcedType] = useState<StudentEntryType | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoGrow = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => { autoGrow(); }, [value, autoGrow]);

  const submit = useCallback((text: string, type?: StudentEntryType) => {
    const resolvedType = type ?? forcedType;
    if (resolvedType && onSubmitTyped) {
      onSubmitTyped(text, resolvedType);
    } else {
      onSubmit?.(text);
    }
    setValue('');
    setForcedType(null);
  }, [forcedType, onSubmit, onSubmitTyped]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey && value.trim()) {
        e.preventDefault();
        submit(value.trim());
      }
      // Escape clears forced type
      if (e.key === 'Escape' && forcedType) {
        setForcedType(null);
      }
    },
    [value, submit, forcedType],
  );

  const handleBlockSelect = useCallback((type: StudentEntryType) => {
    setForcedType(type);
    textareaRef.current?.focus();
  }, []);

  const handlePaste = useCallback((text: string, type: StudentEntryType) => {
    if (onSubmitTyped) {
      onSubmitTyped(text, type);
    } else {
      onSubmit?.(text);
    }
  }, [onSubmit, onSubmitTyped]);

  if (sketchMode) {
    return (
      <SketchInput
        onSubmit={(dataUrl) => {
          onSketchSubmit?.(dataUrl);
          setSketchMode(false);
        }}
        onCancel={() => setSketchMode(false)}
      />
    );
  }

  const displayType = forcedType
    ? typeLabels[forcedType] || forcedType
    : value.trim()
      ? typeLabels[inferEntryType(value.trim())]
      : '';

  return (
    <div
      className={styles.container}
      onClick={() => textareaRef.current?.focus()}
      role="textbox"
      aria-label="Writing area"
    >
      <BlockInserter onSelect={handleBlockSelect} onPaste={handlePaste} />
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
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        rows={1}
        aria-label="Write your thoughts"
      />
      {!isFocused && !value && !forcedType && (
        <div className={styles.cursor} aria-hidden="true" />
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
    </div>
  );
}
