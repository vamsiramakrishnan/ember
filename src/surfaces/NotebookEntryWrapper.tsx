/**
 * NotebookEntryWrapper — interactive shell around every entry.
 * Hover/touch: drag handle (left) + type tag + actions (right).
 * Wrapped in React.memo to prevent cascade re-renders in the entry list.
 * See: 08-touch-and-interaction-states.md
 */
import { memo, useState, useRef, useCallback } from 'react';
import type { LiveEntry } from '@/types/entries';
import { Bookmark } from '@/components/student/Bookmark';
import { AnnotationMargin } from '@/components/student/AnnotationMargin';
import { SelectionToolbar } from '@/components/student/SelectionToolbar';
import { InlineEditor } from '@/components/student/InlineEditor';
import { FollowUp } from '@/components/tutor/FollowUp';
import { NotebookEntryRenderer } from './NotebookEntryRenderer';
import { EntryActions } from './EntryActions';
import { TYPE_META, isStudentEntry } from './entryTypeMeta';
import { useEntryAnchor } from '@/hooks/useEntryAnchor';
import styles from './NotebookEntryWrapper.module.css';

const TUTOR_TYPES = new Set([
  'tutor-marginalia', 'tutor-question', 'tutor-connection',
  'tutor-reflection', 'tutor-directive',
]);

interface Props {
  liveEntry: LiveEntry;
  onCrossOut: (id: string) => void;
  onToggleBookmark: (id: string) => void;
  onTogglePin: (id: string) => void;
  onAnnotate?: (id: string, content: string) => void;
  onSelectionAction?: (entryId: string, type: string, text: string) => void;
  onBranch?: (id: string, content: string) => void;
  onDragStart?: (id: string, e: React.DragEvent) => void;
  onDragOver?: (id: string, e: React.DragEvent) => void;
  onDragLeave?: (id: string) => void;
  onDrop?: (id: string, e: React.DragEvent) => void;
  onDragEnd?: () => void;
  onFollowUp?: (question: string, context: string) => void;
  /** Whether this entry is currently being edited in-place. */
  isEditing?: boolean;
  /** Called on double-click to start editing (student entries only). */
  onStartEdit?: (id: string, entryType: string) => void;
  /** Called when the user saves an edit. */
  onSaveEdit?: (id: string, content: string, entryType: string) => void;
  /** Called when the user cancels an edit. */
  onCancelEdit?: () => void;
  isDragOver?: boolean;
  isDragging?: boolean;
  style?: React.CSSProperties;
}

export const NotebookEntryWrapper = memo(function NotebookEntryWrapper({
  liveEntry, onCrossOut, onToggleBookmark, onTogglePin,
  onAnnotate, onSelectionAction, onBranch, onDragStart, onDragOver,
  onDragLeave, onDrop, onDragEnd, onFollowUp,
  isEditing, onStartEdit, onSaveEdit, onCancelEdit,
  isDragOver, isDragging, style,
}: Props) {
  const { id, entry, crossedOut, bookmarked, pinned, annotations } = liveEntry;
  const canPin = entry.type === 'question';
  const canCrossOut = isStudentEntry(entry.type);
  const canEdit = isStudentEntry(entry.type) && 'content' in entry;
  const meta = TYPE_META[entry.type] ?? { label: entry.type };
  const tagCls = meta.tinted ? styles.typeTagTinted : styles.typeTag;

  // Register this entry in the scroll-to-entry registry
  const { ref: anchorRef, isHighlighted } = useEntryAnchor(id);

  const [touched, setTouched] = useState(false);
  const touchTimer = useRef<ReturnType<typeof setTimeout>>();
  const contentRef = useRef<HTMLDivElement>(null);

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
    isHighlighted ? styles.highlighted : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={anchorRef}
      className={cls} style={style}
      data-entry-id={id}
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
      <div
        className={styles.content}
        ref={contentRef}
        onDoubleClick={canEdit && onStartEdit ? () => onStartEdit(id, entry.type) : undefined}
      >
        {isEditing && canEdit && onSaveEdit && onCancelEdit ? (
          <InlineEditor
            initialContent={(entry as { content: string }).content}
            entryType={entry.type}
            onSave={(content) => onSaveEdit(id, content, entry.type)}
            onCancel={onCancelEdit}
          />
        ) : (
          <>
            <NotebookEntryRenderer entry={entry} />
            <SelectionToolbar
              containerRef={contentRef}
              entryId={id}
              onAction={(a) => onSelectionAction?.(a.entryId, a.type, a.selectedText)}
            />
          </>
        )}
        {onFollowUp && TUTOR_TYPES.has(entry.type) && 'content' in entry && (
          <div className={styles.followUpZone}>
            <FollowUp
              context={(entry as { content: string }).content}
              onSubmit={onFollowUp}
            />
          </div>
        )}
      </div>
      {bookmarked && (
        <div className={styles.bookmarkPos}><Bookmark /></div>
      )}
      <EntryActions
        id={id} canCrossOut={canCrossOut} crossedOut={crossedOut}
        bookmarked={bookmarked} canPin={canPin} pinned={pinned}
        canEdit={canEdit && !isEditing}
        onCrossOut={onCrossOut} onToggleBookmark={onToggleBookmark}
        onTogglePin={onTogglePin}
        onEdit={canEdit && onStartEdit ? () => onStartEdit(id, entry.type) : undefined}
        onBranch={onBranch && 'content' in entry
          ? () => onBranch(id, (entry as { content: string }).content) : undefined}
      />
      {onAnnotate && (
        <AnnotationMargin
          annotations={annotations ?? []}
          onAdd={(content) => onAnnotate(id, content)}
        />
      )}
    </div>
  );
});

