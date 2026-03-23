/**
 * ThreadIndicator — subtle visual cue connecting a tutor response
 * to the student entry it's responding to.
 *
 * Renders as a thin, nearly-invisible vertical continuation mark
 * in the left margin, bridging the gap between entries. The mark
 * uses the margin rule colour at very low opacity — like a pencil
 * line drawn between two annotations in a physical notebook.
 *
 * Only visible when the tutor entry is hovered or focused, to
 * preserve the clean reading experience at rest.
 */
import styles from './ThreadIndicator.module.css';

interface ThreadIndicatorProps {
  /** Whether this entry is part of a student→tutor thread continuation. */
  isResponse: boolean;
  /** Whether this entry begins a new conversational thread. */
  isThreadStart: boolean;
}

export function ThreadIndicator({ isResponse, isThreadStart }: ThreadIndicatorProps) {
  if (!isResponse && !isThreadStart) return null;

  return (
    <div
      className={`${styles.thread} ${isResponse ? styles.response : styles.start}`}
      aria-hidden="true"
    >
      <div className={styles.line} />
      {isResponse && <div className={styles.dot} />}
    </div>
  );
}
