/**
 * NotebookEntryWrapper — wraps each entry with interactive affordances.
 * Cross-out (permanence principle), bookmark, pin (questions only).
 * Actions appear on hover — quiet until needed.
 */
import type { LiveEntry } from '@/types/entries';
import { Bookmark } from '@/components/student/Bookmark';
import { NotebookEntryRenderer } from './NotebookEntryRenderer';
import styles from './NotebookEntryWrapper.module.css';

interface NotebookEntryWrapperProps {
  liveEntry: LiveEntry;
  onCrossOut: (id: string) => void;
  onToggleBookmark: (id: string) => void;
  onTogglePin: (id: string) => void;
  style?: React.CSSProperties;
}

const isStudentEntry = (type: string) =>
  ['prose', 'scratch', 'hypothesis', 'question'].includes(type);

export function NotebookEntryWrapper({
  liveEntry,
  onCrossOut,
  onToggleBookmark,
  onTogglePin,
  style,
}: NotebookEntryWrapperProps) {
  const { id, entry, crossedOut, bookmarked, pinned } = liveEntry;
  const canPin = entry.type === 'question';
  const canCrossOut = isStudentEntry(entry.type);

  return (
    <div
      className={`${styles.wrapper} ${crossedOut ? styles.crossedOut : ''}`}
      style={style}
    >
      <NotebookEntryRenderer entry={entry} />
      {bookmarked && (
        <div className={styles.bookmarkPos}>
          <Bookmark />
        </div>
      )}
      <div className={styles.actions} aria-label="Entry actions">
        {canCrossOut && (
          <button
            className={styles.action}
            onClick={() => onCrossOut(id)}
            title={crossedOut ? 'Restore' : 'Cross out'}
            aria-label={crossedOut ? 'Restore entry' : 'Cross out entry'}
          >
            {crossedOut ? '↺' : '—'}
          </button>
        )}
        <button
          className={`${styles.action} ${bookmarked ? styles.actionActive : ''}`}
          onClick={() => onToggleBookmark(id)}
          title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
          aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark this entry'}
        >
          ◇
        </button>
        {canPin && (
          <button
            className={`${styles.action} ${pinned ? styles.actionActive : ''}`}
            onClick={() => onTogglePin(id)}
            title={pinned ? 'Unpin' : 'Pin thread'}
            aria-label={pinned ? 'Unpin thread' : 'Pin as active thread'}
          >
            ⌃
          </button>
        )}
      </div>
    </div>
  );
}
