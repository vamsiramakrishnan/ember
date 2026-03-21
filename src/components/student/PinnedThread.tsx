/**
 * Pinned Thread (3.1)
 * A question or idea the student wants to keep visible.
 * Preceded by a ⌃ glyph in ink-ghost.
 * See: 06-component-inventory.md, Family 3.
 */
import styles from './PinnedThread.module.css';

interface PinnedThreadProps {
  children: string;
}

export function PinnedThread({ children }: PinnedThreadProps) {
  return (
    <div className={styles.thread}>
      <span className={styles.glyph}>⌃</span>
      <span>{children}</span>
    </div>
  );
}
