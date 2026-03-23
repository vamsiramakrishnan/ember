/**
 * BlockMenu — popover menu content for the BlockInserter.
 * Post-spec extension: not in the original component inventory (06).
 * Added as a decomposition of BlockInserter to maintain 150-line discipline.
 * Lists available text blocks (prose, question, hypothesis, note) and
 * content blocks (code, image, file, link).
 * Related: 06-component-inventory.md Family 1 (student elements),
 *          04-information-architecture.md (notebook surface)
 */
import type { StudentEntryType, InsertableBlockType } from '@/types/entries';
import styles from './BlockInserter.module.css';

interface BlockMenuProps {
  onTextSelect: (type: StudentEntryType) => void;
  onContentSelect: (type: InsertableBlockType) => void;
  onPaste?: (type: StudentEntryType) => void;
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

export function BlockMenu({ onTextSelect, onContentSelect, onPaste }: BlockMenuProps) {
  return (
    <>
      <div className={styles.sectionLabel}>text</div>
      {TEXT_BLOCKS.map((bt) => (
        <div key={bt.type} className={styles.menuItem}>
          <button
            className={styles.typeButton}
            role="menuitem"
            onClick={() => onTextSelect(bt.type)}
          >
            <span className={styles.typeLabel}>{bt.label}</span>
            <span className={styles.typeHint}>{bt.hint}</span>
          </button>
          {onPaste && (
            <button
              className={styles.pasteAction}
              onClick={() => onPaste(bt.type)}
              aria-label={`Paste as ${bt.label}`}
            >paste</button>
          )}
        </div>
      ))}
      <div className={styles.sectionLabel}>content</div>
      {CONTENT_BLOCKS.map((bt) => (
        <button
          key={bt.type}
          className={styles.typeButton}
          role="menuitem"
          onClick={() => onContentSelect(bt.type)}
        >
          <span className={styles.typeLabel}>{bt.label}</span>
          <span className={styles.typeHint}>{bt.hint}</span>
        </button>
      ))}
    </>
  );
}
