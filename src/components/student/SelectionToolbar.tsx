/**
 * SelectionToolbar — floating toolbar that appears when text is selected.
 * Post-spec extension: not in the original component inventory (06).
 * Added to support text-level interactions (linking, annotating, highlighting,
 * asking) triggered by selecting prose within notebook entries.
 * Related: 03-interaction-language.md (tutor voice, interaction modes),
 *          06-component-inventory.md Family 1 (student elements context)
 *
 * Actions:
 * - @ Link: connect selected text to an entity (thinker, concept, term)
 * - Annotate: add a margin note about the selected text
 * - Highlight: mark text as important
 * - Ask: send selected text as a question to the tutor
 *
 * Appears above the selection with a subtle fade-in.
 * Positioned using the Selection API's bounding rect.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import styles from './SelectionToolbar.module.css';

export interface SelectionAction {
  type: 'link' | 'annotate' | 'highlight' | 'ask';
  selectedText: string;
  entryId: string;
}

interface SelectionToolbarProps {
  containerRef: React.RefObject<HTMLElement | null>;
  onAction: (action: SelectionAction) => void;
  entryId: string;
}

interface Position {
  top: number;
  left: number;
  visible: boolean;
}

export function SelectionToolbar({
  containerRef, onAction, entryId,
}: SelectionToolbarProps) {
  const [pos, setPos] = useState<Position>({ top: 0, left: 0, visible: false });
  const [text, setText] = useState('');
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleSelection = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) {
        setPos((p) => ({ ...p, visible: false }));
        return;
      }

      // Only show if selection is within this container
      const range = sel.getRangeAt(0);
      if (!container.contains(range.commonAncestorContainer)) {
        setPos((p) => ({ ...p, visible: false }));
        return;
      }

      const rect = range.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      setText(sel.toString().trim());

      // Compute position with boundary clamping
      const rawLeft = rect.left - containerRect.left + rect.width / 2;
      const toolbarWidth = 180; // approximate width of 4 buttons
      const halfToolbar = toolbarWidth / 2;
      const minLeft = halfToolbar + 8;
      const maxLeft = containerRect.width - halfToolbar - 8;
      const clampedLeft = Math.max(minLeft, Math.min(maxLeft, rawLeft));

      setPos({
        top: rect.top - containerRect.top - 44,
        left: clampedLeft,
        visible: true,
      });
    };

    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, [containerRef]);

  const handleAction = useCallback((type: SelectionAction['type']) => {
    if (!text) return;
    onAction({ type, selectedText: text, entryId });
    window.getSelection()?.removeAllRanges();
    setPos((p) => ({ ...p, visible: false }));
  }, [text, entryId, onAction]);

  if (!pos.visible || !text) return null;

  return (
    <div
      ref={toolbarRef}
      className={styles.toolbar}
      style={{ top: `${pos.top}px`, left: `${pos.left}px` }}
      role="toolbar"
      aria-label="Text actions"
    >
      <button
        className={styles.action}
        onClick={() => handleAction('link')}
        title="Link to entity (@)"
      >
        @
      </button>
      <button
        className={styles.action}
        onClick={() => handleAction('annotate')}
        title="Annotate"
      >
        ¶
      </button>
      <button
        className={styles.action}
        onClick={() => handleAction('highlight')}
        title="Highlight"
      >
        ◇
      </button>
      <button
        className={styles.action}
        onClick={() => handleAction('ask')}
        title="Ask tutor about this"
      >
        ?
      </button>
    </div>
  );
}
