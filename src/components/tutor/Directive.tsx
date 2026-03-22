/**
 * Directive — tutor's exploration instruction to the student.
 * Not a response to what they said — a provocation toward what they
 * haven't yet found. "Go look up..." "Try reading..." "Search for..."
 * See: 08-touch-and-interaction-states.md
 */
import { MarkdownContent } from '@/primitives/MarkdownContent';
import styles from './Directive.module.css';

interface DirectiveProps {
  children: string;
  action?: string;
}

export function Directive({ children, action }: DirectiveProps) {
  return (
    <div className={styles.container}>
      <div className={styles.rule} />
      <div className={styles.body}>
        {action && <span className={styles.action}>{action}</span>}
        <p className={styles.text}>
          <MarkdownContent>{children}</MarkdownContent>
        </p>
      </div>
    </div>
  );
}
