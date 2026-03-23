/**
 * EntryActions — hover-revealed action buttons for notebook entries.
 * Edit, cross-out, bookmark, pin, branch.
 * Extracted from NotebookEntryWrapper to keep files under 150 lines.
 *
 * Callbacks are pre-bound to the entry ID by the parent — no id
 * parameter needed here, preventing unnecessary re-renders.
 */
import styles from './NotebookEntryWrapper.module.css';

interface EntryActionsProps {
  id: string;
  canCrossOut: boolean;
  crossedOut: boolean;
  bookmarked: boolean;
  canPin: boolean;
  pinned: boolean;
  canEdit?: boolean;
  onCrossOut: () => void;
  onToggleBookmark: () => void;
  onTogglePin: () => void;
  onEdit?: () => void;
  onBranch?: () => void;
}

export function EntryActions({
  id: _id, canCrossOut, crossedOut, bookmarked, canPin, pinned,
  canEdit, onCrossOut, onToggleBookmark, onTogglePin, onEdit, onBranch,
}: EntryActionsProps) {
  return (
    <div className={styles.actions} role="group" aria-label="Entry actions">
      {canEdit && onEdit && (
        <button className={styles.action} onClick={onEdit}
          aria-label="Edit" title="Edit (or double-click)">
          ✎
        </button>
      )}
      {canCrossOut && (
        <button className={styles.action} onClick={onCrossOut}
          aria-label={crossedOut ? 'Restore' : 'Cross out'}>
          {crossedOut ? '↺' : '—'}
        </button>
      )}
      <button
        className={`${styles.action} ${bookmarked ? styles.actionActive : ''}`}
        onClick={onToggleBookmark}
        aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark'}>
        ◇
      </button>
      {canPin && (
        <button
          className={`${styles.action} ${pinned ? styles.actionActive : ''}`}
          onClick={onTogglePin}
          aria-label={pinned ? 'Unpin' : 'Pin'}>
          ⌃
        </button>
      )}
      {onBranch && (
        <button className={styles.action} onClick={onBranch}
          aria-label="Branch into new notebook">
          ⑂
        </button>
      )}
    </div>
  );
}
