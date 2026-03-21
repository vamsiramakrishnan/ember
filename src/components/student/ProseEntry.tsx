/**
 * Prose Entry (1.1)
 * A paragraph of the student's writing. The most common element.
 * See: 06-component-inventory.md, Family 1.
 */
import styles from './ProseEntry.module.css';

interface ProseEntryProps {
  children: string;
}

export function ProseEntry({ children }: ProseEntryProps) {
  return <p className={styles.entry}>{children}</p>;
}
