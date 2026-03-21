/**
 * Divider (3.6)
 * A visual break inserted by the student.
 * 1px rule at 60% width, centred. Optional label.
 * See: 06-component-inventory.md, Family 3.
 */
import styles from './Divider.module.css';

interface DividerProps {
  label?: string;
}

export function Divider({ label }: DividerProps) {
  return (
    <div className={styles.container}>
      {label && <div className={styles.label}>{label}</div>}
      <hr className={styles.line} />
    </div>
  );
}
