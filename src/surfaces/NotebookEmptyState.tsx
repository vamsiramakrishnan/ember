/**
 * NotebookEmptyState — the blank page, inviting the student to write.
 * Renders faint ruled lines, a blinking SilenceMarker, and a marginal whisper.
 * was: blank white gap between header and InputZone
 * now: designed composition evoking an empty notebook page
 * See audit item 6.4.
 */
import { MarginZone } from '@/primitives/MarginZone';
import styles from './NotebookEmptyState.module.css';

export function NotebookEmptyState() {
  return (
    <div className={styles.container} aria-label="Empty notebook — begin writing">
      {/* Faint ruled lines — the ghost of a notebook page */}
      <div className={styles.rules} aria-hidden="true">
        <div className={styles.rule} style={{ top: '22%' }} />
        <div className={styles.rule} style={{ top: '36%' }} />
        <div className={styles.rule} style={{ top: '58%' }} />
        <div className={styles.rule} style={{ top: '74%' }} />
      </div>

      {/* Blinking cursor — the notebook is alive, waiting */}
      <div className={styles.cursorArea}>
        <div className={styles.cursor} />
      </div>

      {/* Marginal whisper — the tutor's gentle invitation */}
      <MarginZone>
        <p className={styles.whisper}>The page is yours.</p>
      </MarginZone>
    </div>
  );
}
