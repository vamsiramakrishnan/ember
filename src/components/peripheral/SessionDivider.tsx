/**
 * Session Divider (5.2)
 * Boundary between two sessions in the continuous notebook.
 * See: 06-component-inventory.md, Family 5.
 */
import styles from './SessionDivider.module.css';

export function SessionDivider() {
  return <hr className={styles.divider} />;
}
