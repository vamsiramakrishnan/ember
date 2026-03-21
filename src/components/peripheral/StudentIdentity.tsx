/**
 * Student Identity (5.5)
 * Name, duration, and session count. Present on every surface.
 * See: 06-component-inventory.md, Family 5.
 */
import styles from './StudentIdentity.module.css';

interface StudentIdentityProps {
  name: string;
  duration: string;
  sessionNumber: number;
}

export function StudentIdentity({
  name,
  duration,
  sessionNumber,
}: StudentIdentityProps) {
  return (
    <span className={styles.identity}>
      {name} · {duration} · session {sessionNumber}
    </span>
  );
}
