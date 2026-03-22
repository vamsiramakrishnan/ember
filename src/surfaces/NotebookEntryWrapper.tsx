/**
 * NotebookEntryWrapper — the interactive shell around every entry.
 *
 * On hover/touch:
 * - Left: drag handle + block type indicator (like Notion)
 * - Right: cross-out, bookmark, pin actions
 * - Far right: annotation margin (wide screens)
 *
 * On touch devices:
 * - Tap once to reveal actions (replaces hover)
 * - Tap drag handle to start reorder
 * - Long-press opens context menu
 *
 * The block type indicator is the subtle superpower:
 * it makes the notebook's structure legible at a glance.
 */
import { useState, useRef, useCallback } from 'react';
import type { LiveEntry } from '@/types/entries';
import { Bookmark } from '@/components/student/Bookmark';
import { AnnotationMargin } from '@/components/student/AnnotationMargin';
import { NotebookEntryRenderer } from './NotebookEntryRenderer';
import styles from './NotebookEntryWrapper.module.css';

interface NotebookEntryWrapperProps {
  liveEntry: LiveEntry;
  onCrossOut: (id: string) => void;
  onToggleBookmark: (id: string) => void;
  onTogglePin: (id: string) => void;
  onAnnotate?: (id: string, content: string) => void;
  /** Drag-to-reorder handlers */
  onDragStart?: (id: string, e: React.DragEvent) => void;
  onDragOver?: (id: string, e: React.DragEvent) => void;
  onDragLeave?: (id: string) => void;
  onDrop?: (id: string, e: React.DragEvent) => void;
  onDragEnd?: () => void;
  isDragOver?: boolean;
  isDragging?: boolean;
  style?: React.CSSProperties;
}

const TYPE_LABELS: Record<string, string> = {
  prose: 'prose', scratch: 'note', hypothesis: 'hypothesis',
  question: 'question', sketch: 'sketch',
  'code-cell': 'code', image: 'image', 'file-upload': 'file',
  embed: 'link', document: 'doc',
  'tutor-marginalia': 'tutor', 'tutor-question': 'probe',
  'tutor-connection': 'connection', 'concept-diagram': 'diagram',
  'thinker-card': 'thinker', visualization: 'visual',
  illustration: 'illustration', silence: '···',
  divider: '—', echo: 'echo', 'bridge-suggestion': 'bridge',
};

const isStudentEntry = (type: string) =>
  ['prose', 'scratch', 'hypothesis', 'question', 'code-cell', 'image'].includes(type);

export function NotebookEntryWrapper({
  liveEntry, onCrossOut, onToggleBookmark, onTogglePin,
  onAnnotate, onDragStart, onDragOver, onDragLeave,
  onDrop, onDragEnd, isDragOver, isDragging, style,
}: NotebookEntryWrapperProps) {
  const { id, entry, crossedOut, bookmarked, pinned, annotations } = liveEntry;
  const canPin = entry.type === 'question';
  const canCrossOut = isStudentEntry(entry.type);
  const typeLabel = TYPE_LABELS[entry.type] ?? entry.type;

  // Touch: tap to reveal actions
  const [touched, setTouched] = useState(false);
  const touchTimer = useRef<ReturnType<typeof setTimeout>>();

  const handleTouchStart = useCallback(() => {
    touchTimer.current = setTimeout(() => setTouched(true), 200);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchTimer.current) clearTimeout(touchTimer.current);
  }, []);

  const wrapperClass = [
    styles.wrapper,
    crossedOut ? styles.crossedOut : '',
    isDragOver ? styles.dragOver : '',
    isDragging ? styles.dragging : '',
    touched ? styles.touched : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={wrapperClass}
      style={style}
      draggable={Boolean(onDragStart)}
      onDragStart={onDragStart ? (e) => onDragStart(id, e) : undefined}
      onDragOver={onDragOver ? (e) => onDragOver(id, e) : undefined}
      onDragLeave={onDragLeave ? () => onDragLeave(id) : undefined}
      onDrop={onDrop ? (e) => onDrop(id, e) : undefined}
      onDragEnd={onDragEnd}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Left: drag handle + type indicator */}
      <div className={styles.handle} aria-hidden="true">
        <span className={styles.grip}>⠿</span>
        <span className={styles.typeTag}>{typeLabel}</span>
      </div>

      {/* Content */}
      <div className={styles.content}>
        <NotebookEntryRenderer entry={entry} />
      </div>

      {/* Bookmark indicator */}
      {bookmarked && (
        <div className={styles.bookmarkPos}><Bookmark /></div>
      )}

      {/* Right: actions */}
      <div className={styles.actions} aria-label="Entry actions">
        {canCrossOut && (
          <button
            className={styles.action}
            onClick={() => onCrossOut(id)}
            title={crossedOut ? 'Restore' : 'Cross out'}
            aria-label={crossedOut ? 'Restore' : 'Cross out'}
          >
            {crossedOut ? '↺' : '—'}
          </button>
        )}
        <button
          className={`${styles.action} ${bookmarked ? styles.actionActive : ''}`}
          onClick={() => onToggleBookmark(id)}
          title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
          aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark'}
        >
          ◇
        </button>
        {canPin && (
          <button
            className={`${styles.action} ${pinned ? styles.actionActive : ''}`}
            onClick={() => onTogglePin(id)}
            title={pinned ? 'Unpin' : 'Pin thread'}
            aria-label={pinned ? 'Unpin' : 'Pin'}
          >
            ⌃
          </button>
        )}
      </div>

      {/* Annotation margin */}
      {onAnnotate && (
        <AnnotationMargin
          annotations={annotations ?? []}
          onAdd={(content) => onAnnotate(id, content)}
        />
      )}
    </div>
  );
}
