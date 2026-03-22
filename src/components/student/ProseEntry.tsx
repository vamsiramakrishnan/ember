/**
 * Prose Entry (1.1)
 * A paragraph of the student's writing. The most common element.
 * Renders markdown inline (bold, italic, code, links).
 * See: 06-component-inventory.md, Family 1.
 */
import { MarkdownContent } from '@/primitives/MarkdownContent';
import styles from './ProseEntry.module.css';

interface ProseEntryProps {
  children: string;
}

export function ProseEntry({ children }: ProseEntryProps) {
  return (
    <p className={styles.entry}>
      <MarkdownContent>{children}</MarkdownContent>
    </p>
  );
}
