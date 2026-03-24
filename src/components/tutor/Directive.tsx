/**
 * Directive — tutor's exploration instruction to the student.
 * Not a response to what they said — a provocation toward what they
 * haven't yet found. "Go look up..." "Try reading..." "Search for..."
 *
 * Students can mark directives complete, which feeds back into
 * mastery assessment — completing a "search" or "read" directive
 * signals engagement with the material at a deeper level.
 *
 * See: 08-touch-and-interaction-states.md
 */
import { useState } from 'react';
import { MarkdownContent } from '@/primitives/MarkdownContent';
import styles from './Directive.module.css';

interface DirectiveProps {
  children: string;
  action?: string;
  completed?: boolean;
  completedAt?: number;
  onComplete?: () => void;
}

export function Directive({
  children, action, completed, completedAt, onComplete,
}: DirectiveProps) {
  const [justCompleted, setJustCompleted] = useState(false);

  const handleComplete = () => {
    if (completed || !onComplete) return;
    setJustCompleted(true);
    onComplete();
  };

  const isComplete = completed || justCompleted;
  const timeLabel = completedAt
    ? new Date(completedAt).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric',
    })
    : null;

  return (
    <div className={`${styles.container} ${isComplete ? styles.completed : ''}`}>
      <div className={styles.rule} />
      <div className={styles.body}>
        <div className={styles.headerRow}>
          {action && <span className={styles.action}>{action}</span>}
          {isComplete && timeLabel && (
            <span className={styles.completedLabel}>done {timeLabel}</span>
          )}
        </div>
        <p className={styles.text}>
          <MarkdownContent mode="inline">{children}</MarkdownContent>
        </p>
        {!isComplete && onComplete && (
          <button
            className={styles.completeBtn}
            onClick={handleComplete}
            aria-label="Mark directive as complete"
          >
            mark complete
          </button>
        )}
        {isComplete && !completed && (
          <span className={styles.checkmark} aria-label="Completed">✓</span>
        )}
      </div>
    </div>
  );
}
