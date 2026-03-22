/**
 * NotebookEntryWrapper — interactive shell around every entry.
 * Hover/touch: drag handle (left) + type tag + actions (right).
 * See: 08-touch-and-interaction-states.md
 */
import { useState, useRef, useCallback } from 'react';
import type { LiveEntry } from '@/types/entries';
import { Bookmark } from '@/components/student/Bookmark';
import { AnnotationMargin } from '@/components/student/AnnotationMargin';
import { NotebookEntryRenderer } from './NotebookEntryRenderer';
import { TYPE_META, isStudentEntry } from './entryTypeMeta';
import styles from './NotebookEntryWrapper.module.css';

interface Props {
  liveEntry: LiveEntry;
  onCrossOut: (id: string) => void;
  onToggleBookmark: (id: string) => void;
  onTogglePin: (id: string) => void;
  onAnnotate?: (id: string, content: string) => void;
  onDragStart?: (id: string, e: React.DragEvent) => void;
  onDragOver?: (id: string, e: React.DragEvent) => void;
  onDragLeave?: (id: string) => void;
  onDrop?: (id: string, e: React.DragEvent) => void;
  onDragEnd?: () => void;
  isDragOver?: boolean;
  isDragging?: boolean;
  style?: React.CSSProperties;
}

export function NotebookEntryWrapper({
  liveEntry, onCrossOut, onToggleBookmark, onTogglePin,
  onAnnotate, onDragStart, onDragOver, onDragLeave,
  onDrop, onDragEnd, isDragOver, isDragging, style,
}: Props) {
  const { id, entry, crossedOut, bookmarked, pinned, annotations } = liveEntry;
  const canPin = entry.type === 'question';
  const canCrossOut = isStudentEntry(entry.type);
  const meta = TYPE_META[entry.type] ?? { label: entry.type };
  const tagCls = meta.tinted ? styles.typeTagTinted : styles.typeTag;

  const [touched, setTouched] = useState(false);
  const touchTimer = useRef<ReturnType<typeof setTimeout>>();

  const handleTouchStart = useCallback(() => {
    touchTimer.current = setTimeout(() => setTouched(true), 200);
  }, []);
  const handleTouchEnd = useCallback(() => {
    if (touchTimer.current) clearTimeout(touchTimer.current);
  }, []);

  const cls = [
    styles.wrapper,
    crossedOut ? styles.crossedOut : '',
    isDragOver ? styles.dragOver : '',
    isDragging ? styles.dragging : '',
    touched ? styles.touched : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cls} style={style}
      draggable={Boolean(onDragStart)}
      onDragStart={onDragStart ? (e) => onDragStart(id, e) : undefined}
      onDragOver={onDragOver ? (e) => onDragOver(id, e) : undefined}
      onDragLeave={onDragLeave ? () => onDragLeave(id) : undefined}
      onDrop={onDrop ? (e) => onDrop(id, e) : undefined}
      onDragEnd={onDragEnd}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className={styles.handle} aria-hidden="true">
        <span className={styles.grip}>⠿</span>
        <span className={tagCls}>{meta.label}</span>
      </div>
      <div className={styles.content}>
        <NotebookEntryRenderer entry={entry} />
      </div>
      {bookmarked && (
        <div className={styles.bookmarkPos}><Bookmark /></div>
      )}
      <EntryActions
        id={id} canCrossOut={canCrossOut} crossedOut={crossedOut}
        bookmarked={bookmarked} canPin={canPin} pinned={pinned}
        onCrossOut={onCrossOut} onToggleBookmark={onToggleBookmark}
        onTogglePin={onTogglePin}
      />
      {onAnnotate && (
        <AnnotationMargin
          annotations={annotations ?? []}
          onAdd={(content) => onAnnotate(id, content)}
        />
      )}
    </div>
  );
}

function EntryActions({ id, canCrossOut, crossedOut, bookmarked, canPin, pinned,
  onCrossOut, onToggleBookmark, onTogglePin,
}: {
  id: string; canCrossOut: boolean; crossedOut: boolean;
  bookmarked: boolean; canPin: boolean; pinned: boolean;
  onCrossOut: (id: string) => void;
  onToggleBookmark: (id: string) => void;
  onTogglePin: (id: string) => void;
}) {
  return (
    <div className={styles.actions} aria-label="Entry actions">
      {canCrossOut && (
        <button className={styles.action} onClick={() => onCrossOut(id)}
          aria-label={crossedOut ? 'Restore' : 'Cross out'}>
          {crossedOut ? '↺' : '—'}
        </button>
      )}
      <button
        className={`${styles.action} ${bookmarked ? styles.actionActive : ''}`}
        onClick={() => onToggleBookmark(id)}
        aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark'}>
        ◇
      </button>
      {canPin && (
        <button
          className={`${styles.action} ${pinned ? styles.actionActive : ''}`}
          onClick={() => onTogglePin(id)}
          aria-label={pinned ? 'Unpin' : 'Pin'}>
          ⌃
        </button>
      )}
    </div>
  );
}
