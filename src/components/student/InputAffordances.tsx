/**
 * InputAffordances — subtle hint row beneath the InputZone.
 * Shows available syntax shortcuts: ? for questions, /visualize, @mention.
 * Purely decorative — hidden from screen readers.
 */
import styles from './InputZone.module.css';

const AFFORDANCE_HINTS = ['? asks the tutor', '/visualize', '@mention'];

export function InputAffordances() {
  return (
    <div className={styles.affordances} aria-hidden="true">
      {AFFORDANCE_HINTS.map((h) => (
        <span key={h} className={styles.affordance}>{h}</span>
      ))}
    </div>
  );
}
