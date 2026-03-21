/**
 * Session Header (5.1)
 * Date and topic notation at the top of each session.
 * See: 06-component-inventory.md, Family 5.
 */
import styles from './SessionHeader.module.css';

interface SessionHeaderProps {
  sessionNumber: number;
  date: string;
  timeOfDay: string;
  topic: string;
}

export function SessionHeader({
  sessionNumber,
  date,
  timeOfDay,
  topic,
}: SessionHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.meta}>
        Session {sessionNumber} · {date} · {timeOfDay}
      </div>
      <h1 className={styles.title}>{topic}</h1>
    </header>
  );
}
