/** NotebookEntryWrapper — interactive shell around every entry. Memo'd. */
import { memo, useState, useRef, useCallback } from 'react';
import type { LiveEntry } from '@/types/entries';
import { useNotebookActions } from '@/contexts/NotebookContext';
import { Bookmark } from '@/components/student/Bookmark';
import { AnnotationMargin } from '@/components/student/AnnotationMargin';
import { SelectionToolbar } from '@/components/student/SelectionToolbar';
import { InlineEditor } from '@/components/student/InlineEditor';
import { FollowUp } from '@/components/tutor/FollowUp';
import { NotebookEntryRenderer } from './NotebookEntryRenderer';
import { EntryActions } from './EntryActions';
import { EntryMeta } from './EntryMeta';
import { ThreadIndicator } from './ThreadIndicator';
import { ThreadLink } from '@/components/peripheral/ThreadLink';
import { TYPE_META, isStudentEntry } from './entryTypeMeta';
import { useEntryAnchor } from '@/hooks/useEntryAnchor';
import styles from './NotebookEntryWrapper.module.css';

const TUTOR_TYPES = new Set([
  'tutor-marginalia', 'tutor-question', 'tutor-connection',
  'tutor-reflection', 'tutor-directive',
]);

interface Props {
  liveEntry: LiveEntry;
  /** 1-based position in the session's entry list. */
  index?: number;
  /** Whether the previous entry was a student entry (for thread indicators). */
  prevIsStudent?: boolean;
  style?: React.CSSProperties;
}

export const NotebookEntryWrapper = memo(function NotebookEntryWrapper({
  liveEntry, index = 0, prevIsStudent = false, style,
}: Props) {
  const { id, entry, crossedOut, bookmarked, pinned, annotations } = liveEntry;
  const { onEntryAction, editingId, editPopup, drag, dragHandlers } = useNotebookActions();

  const isEditingThis = editingId === id;
  const canPin = entry.type === 'question';
  const canCrossOut = isStudentEntry(entry.type);
  const canEdit = isStudentEntry(entry.type) && 'content' in entry;
  const meta = TYPE_META[entry.type] ?? { label: entry.type };
  const tagCls = meta.tinted ? styles.typeTagTinted : styles.typeTag;
  const isDragOver = drag.overId === id;
  const isDragging = drag.dragId === id;

  // Register this entry in the scroll-to-entry registry
  const { ref: anchorRef, isHighlighted } = useEntryAnchor(id);

  const [touched, setTouched] = useState(false);
  const touchTimer = useRef<ReturnType<typeof setTimeout>>();
  const contentRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback(() =>
    { touchTimer.current = setTimeout(() => setTouched(true), 150); }, []);
  const handleTouchEnd = useCallback(() =>
    { if (touchTimer.current) clearTimeout(touchTimer.current); }, []);

  const cls = [styles.wrapper, crossedOut && styles.crossedOut,
    isDragOver && styles.dragOver, isDragging && styles.dragging,
    touched && styles.touched, isHighlighted && styles.highlighted,
  ].filter(Boolean).join(' ');

  const entryContent = 'content' in entry
    ? (entry as { content: string }).content
    : '';

  return (
    <div
      ref={anchorRef}
      className={cls} style={style}
      data-entry-id={id}
      tabIndex={-1}
      draggable
      onDragStart={(e) => dragHandlers.onDragStart(id, e)}
      onDragOver={(e) => dragHandlers.onDragOver(id, e)}
      onDragLeave={() => dragHandlers.onDragLeave(id)}
      onDrop={(e) => dragHandlers.onDrop(id, e)}
      onDragEnd={dragHandlers.onDragEnd}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <ThreadIndicator
        isResponse={TUTOR_TYPES.has(entry.type) && prevIsStudent}
        isThreadStart={isStudentEntry(entry.type) && index > 1}
      />
      <EntryMeta
        timestamp={liveEntry.timestamp}
        content={entryContent || undefined}
        index={index}
        isTutor={TUTOR_TYPES.has(entry.type)}
      />
      <div className={styles.handle} aria-hidden="true">
        <span className={styles.grip}>⠿</span>
        <span className={tagCls}>{meta.label}</span>
      </div>
      <div
        className={styles.content}
        ref={contentRef}
        onDoubleClick={
          canEdit
            ? () => onEntryAction({ type: 'start-edit', id, entryType: entry.type })
            : undefined
        }
      >
        {isEditingThis && canEdit ? (
          <InlineEditor
            initialContent={entryContent}
            entryType={entry.type}
            onSave={(content) => onEntryAction({
              type: 'save-edit', id, content, entryType: entry.type,
            })}
            onCancel={() => onEntryAction({ type: 'cancel-edit' })}
            onMentionTrigger={editPopup?.onMentionTrigger}
            onSlashTrigger={editPopup?.onSlashTrigger}
            onPopupClose={editPopup?.onPopupClose}
            insertText={editPopup?.pendingInsert}
            onInsertConsumed={editPopup?.onInsertConsumed}
          />
        ) : (
          <>
            <NotebookEntryRenderer
              entry={entry}
              onDirectiveComplete={entry.type === 'tutor-directive'
                ? (content, action) => onEntryAction({
                  type: 'directive-complete', id, content, action,
                })
                : undefined}
            />
            <SelectionToolbar
              containerRef={contentRef}
              entryId={id}
              onAction={(a) => onEntryAction({
                type: 'selection',
                entryId: a.entryId,
                actionType: a.type,
                text: a.selectedText,
              })}
            />
          </>
        )}
        {TUTOR_TYPES.has(entry.type) && entryContent && (
          <div className={styles.followUpZone}>
            <FollowUp
              context={entryContent}
              onSubmit={(q) => onEntryAction({
                type: 'follow-up', question: q, context: entryContent,
              })}
              popup={editPopup}
            />
          </div>
        )}
        <ThreadLink entryId={id} />
      </div>
      {bookmarked && (
        <div className={styles.bookmarkPos}><Bookmark /></div>
      )}
      <EntryActions id={id} canCrossOut={canCrossOut} crossedOut={crossedOut}
        bookmarked={bookmarked} canPin={canPin} pinned={pinned}
        canEdit={canEdit && !isEditingThis}
        onCrossOut={() => onEntryAction({ type: 'cross-out', id })}
        onToggleBookmark={() => onEntryAction({ type: 'toggle-bookmark', id })}
        onTogglePin={() => onEntryAction({ type: 'toggle-pin', id })}
        onEdit={canEdit ? () => onEntryAction({ type: 'start-edit', id, entryType: entry.type }) : undefined}
        onBranch={entryContent ? () => onEntryAction({ type: 'branch', id, content: entryContent }) : undefined} />
      <AnnotationMargin
        annotations={annotations ?? []}
        onAdd={(content) => onEntryAction({ type: 'annotate', id, content })}
      />
    </div>
  );
});
