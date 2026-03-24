/**
 * Reflection — the tutor's synthesis of the session's intellectual movement.
 * Visually distinct from marginalia: more spacious, lighter, like a breath.
 * Never renders if content is empty.
 */
import { MarkdownContent } from '@/primitives/MarkdownContent';
import styles from './Reflection.module.css';

interface ReflectionProps {
  children: string;
}

export function Reflection({ children }: ReflectionProps) {
  if (!children.trim()) return null;

  return (
    <div className={styles.container}>
      <div className={styles.rule} />
      <p className={styles.text}>
        <MarkdownContent mode="inline">{children}</MarkdownContent>
      </p>
      <div className={styles.rule} />
    </div>
  );
}
