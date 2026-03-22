/**
 * Question Bubble (1.5)
 * A question the student asks the tutor.
 * Distinguished by a small ? glyph in ink-faint, 6px left of text.
 * See: 06-component-inventory.md, Family 1.
 */
import { MarkdownContent } from '@/primitives/MarkdownContent';
import styles from './QuestionBubble.module.css';

interface QuestionBubbleProps {
  children: string;
}

export function QuestionBubble({ children }: QuestionBubbleProps) {
  return (
    <p className={styles.bubble}>
      <span className={styles.glyph}>?</span>
      <MarkdownContent>{children}</MarkdownContent>
    </p>
  );
}
