/**
 * InputZone (7.4)
 * The student's writing area — continuous with the notebook above.
 * Supports text writing and sketch mode.
 * No border, no placeholder, just a blinking cursor.
 * See: 06-component-inventory.md, Family 7
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { inferEntryType } from '@/hooks/useEntryInference';
import { SketchInput } from './SketchInput';
import styles from './InputZone.module.css';

const typeLabels = {
  prose: '',
  question: 'question',
  hypothesis: 'hypothesis',
  scratch: 'note',
} as const;

interface InputZoneProps {
  onSubmit?: (content: string) => void;
  onSketchSubmit?: (dataUrl: string) => void;
}

export function InputZone({ onSubmit, onSketchSubmit }: InputZoneProps) {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [sketchMode, setSketchMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoGrow = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => { autoGrow(); }, [value, autoGrow]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey && value.trim()) {
        e.preventDefault();
        onSubmit?.(value.trim());
        setValue('');
      }
    },
    [value, onSubmit],
  );

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

  const inferred = value.trim() ? inferEntryType(value.trim()) : null;
  const label = inferred ? typeLabels[inferred] : '';

  return (
    <div
      className={styles.container}
      onClick={() => textareaRef.current?.focus()}
      role="textbox"
      aria-label="Writing area"
    >
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
      {!isFocused && !value && (
        <div className={styles.cursor} aria-hidden="true" />
      )}
      <div className={styles.bottomRow}>
        {label && <span className={styles.typeIndicator}>{label}</span>}
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
