/**
 * Footer — The quiet footer.
 * Nearly invisible. Shows a subtle sync status dot.
 * Like the small light on a well-designed device — present, not demanding.
 */
import { Column } from '@/primitives/Column';
import { useSyncStatus } from '@/persistence/sync/useSyncStatus';
import type { SyncState } from '@/persistence/sync/types';
import styles from './Footer.module.css';

const stateColors: Record<SyncState, string> = {
  idle: 'var(--ink-ghost)',
  syncing: 'var(--amber)',
  synced: 'var(--sage)',
  offline: 'var(--ink-ghost)',
  error: 'var(--margin)',
};

const stateLabels: Record<SyncState, string> = {
  idle: 'Notebook saved locally',
  syncing: 'Syncing',
  synced: 'Synced',
  offline: 'Working offline',
  error: 'Sync paused',
};

export function Footer() {
  const { state } = useSyncStatus();

  return (
    <footer className={styles.footer}>
      <Column>
        <div className={styles.row}>
          <p className={styles.text}>
            Ember — aristocratic tutoring for every child
          </p>
          <span
            className={styles.syncDot}
            style={{ backgroundColor: stateColors[state] }}
            title={stateLabels[state]}
            aria-label={stateLabels[state]}
          />
        </div>
      </Column>
    </footer>
  );
}
