/**
 * MarginNote — tutor's brief response rendered in the right margin,
 * beside the student entry it annotates. The signature spatial element.
 *
 * Only used for short tutor-marginalia and tutor-connection entries
 * (≤200 chars). Longer responses render inline as before.
 *
 * Typography is smaller than inline marginalia (14px vs 17.5px) to
 * fit the narrower margin zone. The margin rule is a 1px left border
 * instead of the inline 3px vertical bar.
 *
 * See: 06-component-inventory.md, Family 2 (Marginalia 2.1)
 */
import { MarkdownContent } from '@/primitives/MarkdownContent';
import styles from './MarginNote.module.css';

interface MarginNoteProps {
  /** The tutor's text content. */
  children: string;
  /** Whether this is a connection (2.3) vs plain marginalia (2.1). */
  isConnection?: boolean;
}

export function MarginNote({ children, isConnection }: MarginNoteProps) {
  const cls = isConnection
    ? `${styles.container} ${styles.connection}`
    : styles.container;

  return (
    <aside className={cls} role="note" aria-label="Tutor annotation">
      <div className={styles.rule} />
      <div className={styles.text}>
        <MarkdownContent mode="inline">{children}</MarkdownContent>
      </div>
    </aside>
  );
}
