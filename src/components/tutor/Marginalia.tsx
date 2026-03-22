/**
 * Marginalia (2.1)
 * Tutor's prose response — annotation in the margin of the student's notebook.
 * Layout: CSS grid — 3px rule | 16px gap | text.
 * See: 06-component-inventory.md, Family 2.
 */
import { MarkdownContent } from '@/primitives/MarkdownContent';
import styles from './Marginalia.module.css';

interface MarginaliaProps {
  children: string;
}

export function Marginalia({ children }: MarginaliaProps) {
  return (
    <div className={styles.container}>
      <div className={styles.rule} />
      <p className={styles.text}>
        <MarkdownContent>{children}</MarkdownContent>
      </p>
    </div>
  );
}
