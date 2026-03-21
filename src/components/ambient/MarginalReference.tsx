/**
 * Marginal Reference (6.1)
 * Uninstructed note in the margin. A book left open on the desk.
 * Visible only on wide screens (inline on narrow).
 * See: 06-component-inventory.md, Family 6.
 */
import styles from './MarginalReference.module.css';

interface MarginalReferenceProps {
  children: string;
}

export function MarginalReference({ children }: MarginalReferenceProps) {
  return <aside className={styles.reference}>{children}</aside>;
}
