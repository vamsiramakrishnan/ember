/**
 * InputAffordances — subtle hint row beneath the InputZone.
 * Shows available syntax shortcuts with warm, quiet styling.
 * Includes composition hint for /action /format pattern.
 * Purely decorative — hidden from screen readers.
 */
import styles from './InputZone.module.css';

const HINTS = [
  { key: '/', label: 'commands' },
  { key: '@', label: 'reference' },
  { key: '?', label: 'ask tutor' },
  { key: '/→/', label: 'chain' },
];

export function InputAffordances() {
  return (
    <div className={styles.affordances} aria-hidden="true">
      {HINTS.map((h) => (
        <span key={h.key} className={styles.affordance}>
          <span className={styles.affordanceKey}>{h.key}</span>
          {h.label}
        </span>
      ))}
    </div>
  );
}
