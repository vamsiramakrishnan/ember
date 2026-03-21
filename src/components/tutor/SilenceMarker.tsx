/**
 * Silence Marker (2.6)
 * Active waiting. The most spacious element in the system.
 * Blinking cursor: 1px wide, 22px tall, ink at 30%, 1.2s fade.
 * See: 06-component-inventory.md, Family 2.
 */
import styles from './SilenceMarker.module.css';

interface SilenceMarkerProps {
  text?: string;
}

export function SilenceMarker({ text }: SilenceMarkerProps) {
  return (
    <div className={styles.container}>
      {text && <p className={styles.text}>{text}</p>}
      <div className={styles.verticalRule} />
      <div className={styles.cursor} />
    </div>
  );
}
