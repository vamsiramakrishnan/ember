/**
 * Connection (2.3)
 * The tutor drawing a line between two things the student knows.
 * Identical to Marginalia, but first sentence is Medium (500) weight.
 * See: 06-component-inventory.md, Family 2.
 */
import styles from './Connection.module.css';

interface ConnectionProps {
  children: string;
  /** Character index where the emphasis (Medium weight) ends. */
  emphasisEnd: number;
}

export function Connection({ children, emphasisEnd }: ConnectionProps) {
  const emphasized = children.slice(0, emphasisEnd);
  const rest = children.slice(emphasisEnd);

  return (
    <div className={styles.container}>
      <div className={styles.rule} />
      <p className={styles.text}>
        <span className={styles.emphasis}>{emphasized}</span>
        {rest}
      </p>
    </div>
  );
}
