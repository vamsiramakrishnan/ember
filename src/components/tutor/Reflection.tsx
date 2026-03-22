/**
 * Reflection — the tutor's synthesis of the session's intellectual movement.
 * Visually distinct from marginalia: more spacious, lighter, like a breath.
 * See: 08-touch-and-interaction-states.md
 */
import { MarkdownContent } from '@/primitives/MarkdownContent';
import styles from './Reflection.module.css';

interface ReflectionProps {
  children: string;
}

export function Reflection({ children }: ReflectionProps) {
  return (
    <div className={styles.container}>
      <div className={styles.rule} />
      <p className={styles.text}>
        <MarkdownContent>{children}</MarkdownContent>
      </p>
      <div className={styles.rule} />
    </div>
  );
}
