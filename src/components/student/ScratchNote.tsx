/**
 * Scratch Note (1.2)
 * Small, informal fragment. A half-formed idea.
 * Preceded by a · glyph in ink-ghost, set 8px to its left.
 * See: 06-component-inventory.md, Family 1.
 */
import { MarkdownContent } from '@/primitives/MarkdownContent';
import styles from './ScratchNote.module.css';

interface ScratchNoteProps {
  children: string;
}

export function ScratchNote({ children }: ScratchNoteProps) {
  return (
    <p className={styles.note}>
      <span className={styles.glyph}>·</span>
      <MarkdownContent mode="inline">{children}</MarkdownContent>
    </p>
  );
}
