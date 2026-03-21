/**
 * Echo (6.2)
 * A callback to something the student said in a previous session.
 * Preceded by a ↩ glyph. The notebook remembers.
 * See: 06-component-inventory.md, Family 6.
 */
import styles from './Echo.module.css';

interface EchoProps {
  children: string;
}

export function Echo({ children }: EchoProps) {
  return (
    <p className={styles.echo}>
      <span className={styles.glyph}>↩</span>
      <span>{children}</span>
    </p>
  );
}
