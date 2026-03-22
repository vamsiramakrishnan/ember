/**
 * BlockInserter — Notion-style "+" button that appears between entries
 * and at the left margin of the InputZone. Opens a quiet popover
 * to select the entry type before writing.
 *
 * Two sections: text blocks (prose, question, hypothesis, note)
 * and content blocks (code, image, file, link).
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import type { StudentEntryType, InsertableBlockType } from '@/types/entries';
import styles from './BlockInserter.module.css';

interface BlockInserterProps {
  onSelect: (type: StudentEntryType) => void;
  onSelectBlock?: (type: InsertableBlockType) => void;
  onPaste?: (text: string, type: StudentEntryType) => void;
  onFileUpload?: (file: File) => void;
}

const TEXT_BLOCKS: { type: StudentEntryType; label: string; hint: string }[] = [
  { type: 'prose', label: 'prose', hint: 'a considered thought' },
  { type: 'question', label: 'question', hint: 'something you wonder' },
  { type: 'hypothesis', label: 'hypothesis', hint: 'a tentative idea' },
  { type: 'scratch', label: 'note', hint: 'a quick fragment' },
];

const CONTENT_BLOCKS: { type: InsertableBlockType; label: string; hint: string }[] = [
  { type: 'code-cell', label: 'code', hint: 'a code snippet' },
  { type: 'image', label: 'image', hint: 'upload or paste' },
  { type: 'file-upload', label: 'file', hint: 'pdf, document, data' },
  { type: 'embed', label: 'link', hint: 'paste a url' },
];

export function BlockInserter({
  onSelect, onSelectBlock, onPaste, onFileUpload,
}: BlockInserterProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  const handleTextSelect = useCallback((type: StudentEntryType) => {
    setOpen(false);
    onSelect(type);
  }, [onSelect]);

  const handleContentSelect = useCallback((type: InsertableBlockType) => {
    setOpen(false);

    // Image and file need the file picker
    if ((type === 'image' || type === 'file-upload') && fileInputRef.current) {
      fileInputRef.current.accept = type === 'image'
        ? 'image/png,image/jpeg,image/gif,image/webp'
        : '*/*';
      fileInputRef.current.click();
      return;
    }

    // Link: prompt for URL
    if (type === 'embed') {
      const url = prompt('Paste a URL:');
      if (url?.trim()) {
        onSelectBlock?.('embed');
      }
      return;
    }

    onSelectBlock?.(type);
  }, [onSelectBlock]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileUpload) {
      onFileUpload(file);
    }
    // Reset so the same file can be re-selected
    if (e.target) e.target.value = '';
  }, [onFileUpload]);

  const handlePaste = useCallback(async (type: StudentEntryType) => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        setOpen(false);
        onPaste?.(text.trim(), type);
      }
    } catch {
      handleTextSelect(type);
    }
  }, [onPaste, handleTextSelect]);

  return (
    <div className={styles.container} ref={menuRef}>
      <button
        className={styles.trigger}
        onClick={() => setOpen(!open)}
        aria-label="Insert a new block"
        aria-expanded={open}
      >
        <span className={styles.plus}>+</span>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {open && (
        <div className={styles.menu} role="menu" aria-label="Block types">
          <div className={styles.sectionLabel}>text</div>
          {TEXT_BLOCKS.map((bt) => (
            <div key={bt.type} className={styles.menuItem}>
              <button
                className={styles.typeButton}
                role="menuitem"
                onClick={() => handleTextSelect(bt.type)}
              >
                <span className={styles.typeLabel}>{bt.label}</span>
                <span className={styles.typeHint}>{bt.hint}</span>
              </button>
              {onPaste && (
                <button
                  className={styles.pasteAction}
                  onClick={() => handlePaste(bt.type)}
                  aria-label={`Paste as ${bt.label}`}
                >
                  paste
                </button>
              )}
            </div>
          ))}

          <div className={styles.sectionLabel}>content</div>
          {CONTENT_BLOCKS.map((bt) => (
            <button
              key={bt.type}
              className={styles.typeButton}
              role="menuitem"
              onClick={() => handleContentSelect(bt.type)}
            >
              <span className={styles.typeLabel}>{bt.label}</span>
              <span className={styles.typeHint}>{bt.hint}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
