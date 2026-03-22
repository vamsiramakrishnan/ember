/**
 * BlockInserter — Notion-style "+" button that appears between entries
 * and at the left margin of the InputZone. Opens a quiet popover
 * to select the entry type before writing.
 *
 * Appears on hover in the left margin. Stays invisible otherwise.
 * The notebook metaphor: turning to a fresh page and deciding
 * whether to write prose, a question, a hypothesis, or a note.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import type { StudentEntryType } from '@/types/entries';
import styles from './BlockInserter.module.css';

interface BlockInserterProps {
  onSelect: (type: StudentEntryType) => void;
  onPaste?: (text: string, type: StudentEntryType) => void;
}

const BLOCK_TYPES: { type: StudentEntryType; label: string; hint: string }[] = [
  { type: 'prose', label: 'prose', hint: 'a considered thought' },
  { type: 'question', label: 'question', hint: 'something you wonder' },
  { type: 'hypothesis', label: 'hypothesis', hint: 'a tentative idea' },
  { type: 'scratch', label: 'note', hint: 'a quick fragment' },
];

export function BlockInserter({ onSelect, onPaste }: BlockInserterProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  const handleSelect = useCallback((type: StudentEntryType) => {
    setOpen(false);
    onSelect(type);
  }, [onSelect]);

  const handlePaste = useCallback(async (type: StudentEntryType) => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        setOpen(false);
        onPaste?.(text.trim(), type);
      }
    } catch {
      // Clipboard access denied — just select the type
      handleSelect(type);
    }
  }, [onPaste, handleSelect]);

  return (
    <div className={styles.container} ref={menuRef}>
      <button
        ref={buttonRef}
        className={styles.trigger}
        onClick={() => setOpen(!open)}
        aria-label="Insert a new block"
        aria-expanded={open}
      >
        <span className={styles.plus}>+</span>
      </button>

      {open && (
        <div className={styles.menu} role="menu" aria-label="Block types">
          {BLOCK_TYPES.map((bt) => (
            <div key={bt.type} className={styles.menuItem}>
              <button
                className={styles.typeButton}
                role="menuitem"
                onClick={() => handleSelect(bt.type)}
              >
                <span className={styles.typeLabel}>{bt.label}</span>
                <span className={styles.typeHint}>{bt.hint}</span>
              </button>
              {onPaste && (
                <button
                  className={styles.pasteAction}
                  onClick={() => handlePaste(bt.type)}
                  title={`Paste as ${bt.label}`}
                  aria-label={`Paste clipboard as ${bt.label}`}
                >
                  paste
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
