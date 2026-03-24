/**
 * SelectionToolbar — floating toolbar that appears when text is selected.
 * Post-spec extension.
 *
 * UX design decisions:
 * - Appears 200ms AFTER mouseup/touchend (not during selection) to avoid
 *   fighting with Chrome's native selection handles and mini-menu
 * - Positioned above the selection with boundary clamping + arrow caret
 * - Dismisses on any click outside, scroll, or Escape
 * - Suppresses browser context menu within the entry to prevent overlap
 *
 * Actions: @ Link, Annotate, Highlight, Ask tutor
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import styles from './SelectionToolbar.module.css';

export interface SelectionAction {
  type: 'link' | 'annotate' | 'highlight' | 'ask' | 'explain';
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

/** Delay before showing toolbar — lets Chrome's native selection UI settle. */
const REVEAL_DELAY = 200;

export function SelectionToolbar({
  containerRef, onAction, entryId,
}: SelectionToolbarProps) {
  const [pos, setPos] = useState<Position>({ top: 0, left: 0, visible: false });
  const [text, setText] = useState('');
  const toolbarRef = useRef<HTMLDivElement>(null);
  const revealTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const checkSelection = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) {
        setPos((p) => ({ ...p, visible: false }));
        return;
      }

      const range = sel.getRangeAt(0);
      if (!container.contains(range.commonAncestorContainer)) {
        setPos((p) => ({ ...p, visible: false }));
        return;
      }

      const rect = range.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      // Boundary clamping
      const rawLeft = rect.left - containerRect.left + rect.width / 2;
      const toolbarWidth = 180;
      const halfToolbar = toolbarWidth / 2;
      const minLeft = halfToolbar + 8;
      const maxLeft = containerRect.width - halfToolbar - 8;
      const clampedLeft = Math.max(minLeft, Math.min(maxLeft, rawLeft));

      setText(sel.toString().trim());
      setPos({
        top: rect.top - containerRect.top - 44,
        left: clampedLeft,
        visible: true,
      });
    };

    // Delayed reveal on mouseup — avoids fighting Chrome's selection UI
    const handleMouseUp = () => {
      if (revealTimer.current) clearTimeout(revealTimer.current);
      revealTimer.current = setTimeout(checkSelection, REVEAL_DELAY);
    };

    // Also handle keyboard selection (Shift+Arrow)
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.shiftKey || e.key === 'Shift') {
        if (revealTimer.current) clearTimeout(revealTimer.current);
        revealTimer.current = setTimeout(checkSelection, REVEAL_DELAY);
      }
    };

    // Dismiss on scroll or mousedown elsewhere
    const handleDismiss = () => {
      if (revealTimer.current) clearTimeout(revealTimer.current);
      setPos((p) => ({ ...p, visible: false }));
    };

    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousedown', (e) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        handleDismiss();
      }
    });
    document.addEventListener('scroll', handleDismiss, { passive: true });

    return () => {
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('keyup', handleKeyUp);
      if (revealTimer.current) clearTimeout(revealTimer.current);
    };
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
        onClick={() => handleAction('explain')}
        title="Explain this"
        aria-label="Explain"
      >
        <span className={styles.actionIcon}>~</span>
        <span className={styles.actionLabel}>explain</span>
      </button>
      <button
        className={styles.action}
        onClick={() => handleAction('link')}
        title="Link to entity (@)"
        aria-label="Link to entity"
      >
        <span className={styles.actionIcon}>@</span>
        <span className={styles.actionLabel}>link</span>
      </button>
      <button
        className={styles.action}
        onClick={() => handleAction('annotate')}
        title="Add margin note"
        aria-label="Annotate"
      >
        <span className={styles.actionIcon}>¶</span>
        <span className={styles.actionLabel}>note</span>
      </button>
      <button
        className={styles.action}
        onClick={() => handleAction('highlight')}
        title="Highlight text"
        aria-label="Highlight"
      >
        <span className={styles.actionIcon}>◇</span>
        <span className={styles.actionLabel}>mark</span>
      </button>
      <button
        className={styles.action}
        onClick={() => handleAction('ask')}
        title="Ask tutor about this"
        aria-label="Ask tutor"
      >
        <span className={styles.actionIcon}>?</span>
        <span className={styles.actionLabel}>ask</span>
      </button>
    </div>
  );
}
