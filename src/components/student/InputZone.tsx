/**
 * InputZone (7.4)
 * The student's writing area — continuous with the notebook above.
 * No border, no placeholder, just a blinking cursor that becomes a textarea on focus.
 * See: 06-component-inventory.md, Family 7
 */
import { useState, useRef, useCallback } from 'react';
import styles from './InputZone.module.css';

interface InputZoneProps {
  onSubmit?: (content: string) => void;
}

export function InputZone({ onSubmit }: InputZoneProps) {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const handleContainerClick = useCallback(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <div
      className={styles.container}
      onClick={handleContainerClick}
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
    </div>
  );
}
