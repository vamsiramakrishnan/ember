/**
 * Marginalia (2.1)
 * Tutor's prose response — annotation in the margin of the student's notebook.
 * Layout: CSS grid — 3px rule | 16px gap | text.
 * See: 06-component-inventory.md, Family 2.
 */
import styles from './Marginalia.module.css';

interface MarginaliaProps {
  children: string;
}

export function Marginalia({ children }: MarginaliaProps) {
  return (
    <div className={styles.container}>
      <div className={styles.rule} />
      <p className={styles.text}>{children}</p>
    </div>
  );
}
