/**
 * ThreadArc — subtle connector between a student entry and its
 * corresponding margin note. Draws a quiet L-shaped path from
 * the right edge of the student text to the margin note.
 *
 * Pure CSS — no SVG. Uses border-right + border-top with a
 * rounded corner to create the bend. The arc draws itself
 * with a width animation over 0.4s.
 *
 * See: 07-compositional-grammar.md (thread patterns)
 */
import styles from './ThreadArc.module.css';

interface ThreadArcProps {
  /** Whether this connects a connection (2.3) vs marginalia (2.1). */
  isConnection?: boolean;
}

export function ThreadArc({ isConnection }: ThreadArcProps) {
  const cls = isConnection
    ? `${styles.arc} ${styles.connectionArc}`
    : styles.arc;

  return <div className={cls} aria-hidden="true" />;
}
