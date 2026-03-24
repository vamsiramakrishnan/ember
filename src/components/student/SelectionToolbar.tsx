/**
 * SelectionToolbar — floating toolbar on text selection.
 * Appears after 280ms to avoid fighting Chrome's native selection UI.
 * Suppresses context menu on selected text to prevent overlap.
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

const REVEAL_DELAY = 280;
const ACTIONS: [string, string, string][] = [
  ['explain', '~', 'explain'], ['link', '@', 'link'],
  ['annotate', '¶', 'note'], ['highlight', '◇', 'mark'], ['ask', '?', 'ask'],
];

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

    const scheduleCheck = () => {
      if (revealTimer.current) clearTimeout(revealTimer.current);
      revealTimer.current = setTimeout(checkSelection, REVEAL_DELAY);
    };

    const handleDismiss = () => {
      if (revealTimer.current) clearTimeout(revealTimer.current);
      setPos((p) => ({ ...p, visible: false }));
    };

    // Suppress Chrome's native context menu on the entry container
    const handleContextMenu = (e: MouseEvent) => {
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed && container.contains(sel.anchorNode)) {
        e.preventDefault();
      }
    };

    const handleOutsideClick = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        handleDismiss();
      }
    };

    container.addEventListener('mouseup', scheduleCheck);
    container.addEventListener('touchend', scheduleCheck);
    container.addEventListener('keyup', (e: KeyboardEvent) => {
      if (e.shiftKey || e.key === 'Shift') scheduleCheck();
    });
    container.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('scroll', handleDismiss, { passive: true });

    return () => {
      container.removeEventListener('mouseup', scheduleCheck);
      container.removeEventListener('touchend', scheduleCheck);
      container.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('scroll', handleDismiss);
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
      onMouseDown={(e) => e.preventDefault()}
    >
      {ACTIONS.map(([type, icon, label]) => (
        <button key={type} className={styles.action}
          onClick={() => handleAction(type as SelectionAction['type'])}
          title={label} aria-label={label}>
          <span className={styles.actionIcon}>{icon}</span>
          <span className={styles.actionLabel}>{label}</span>
        </button>
      ))}
    </div>
  );
}
