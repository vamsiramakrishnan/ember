/**
 * Socratic Question (2.2)
 * The most important element — where Bloom and Feynman converge.
 * Tinted background, left border, italic Cormorant Garamond.
 * See: 06-component-inventory.md, Family 2.
 */
import { MarkdownContent } from '@/primitives/MarkdownContent';
import styles from './SocraticQuestion.module.css';

interface SocraticQuestionProps {
  children: string;
}

export function SocraticQuestion({ children }: SocraticQuestionProps) {
  return (
    <blockquote className={styles.block} role="note" aria-label="Tutor's question">
      <MarkdownContent>{children}</MarkdownContent>
    </blockquote>
  );
}
