/**
 * BlockInserter — "+" button for inserting new block types into the notebook.
 * Post-spec extension: not in the original component inventory (06).
 * Added to support structured entry creation beyond free-form prose,
 * enabling students to insert specific block types (code, images, files).
 * Menu content extracted to BlockMenu for 150-line discipline.
 * Related: 06-component-inventory.md 7.4 (InputZone),
 *          04-information-architecture.md (notebook surface)
 */
import { useState, useRef, useCallback } from 'react';
import { ContextPanel } from '@/primitives/ContextPanel';
import { BlockMenu } from './BlockMenu';
import type { StudentEntryType, InsertableBlockType } from '@/types/entries';
import styles from './BlockInserter.module.css';

interface BlockInserterProps {
  onSelect: (type: StudentEntryType) => void;
  onSelectBlock?: (type: InsertableBlockType) => void;
  onPaste?: (text: string, type: StudentEntryType) => void;
  onFileUpload?: (file: File) => void;
}

export function BlockInserter({
  onSelect, onSelectBlock, onPaste, onFileUpload,
}: BlockInserterProps) {
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextSelect = useCallback((type: StudentEntryType) => {
    setOpen(false);
    onSelect(type);
  }, [onSelect]);

  const handleContentSelect = useCallback((type: InsertableBlockType) => {
    setOpen(false);
    if ((type === 'image' || type === 'file-upload') && fileInputRef.current) {
      fileInputRef.current.accept = type === 'image'
        ? 'image/png,image/jpeg,image/gif,image/webp'
        : '*/*';
      fileInputRef.current.click();
      return;
    }
    if (type === 'embed') {
      const url = prompt('Paste a URL:');
      if (url?.trim()) onSelectBlock?.('embed');
      return;
    }
    onSelectBlock?.(type);
  }, [onSelectBlock]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileUpload) onFileUpload(file);
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
    <div className={styles.container}>
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
        <ContextPanel reveal="down" onDismiss={() => setOpen(false)}
          zIndex={10} className={styles.menu} ariaLabel="Block types" role="menu">
          <BlockMenu
            onTextSelect={handleTextSelect}
            onContentSelect={handleContentSelect}
            onPaste={onPaste ? handlePaste : undefined}
          />
        </ContextPanel>
      )}
    </div>
  );
}
