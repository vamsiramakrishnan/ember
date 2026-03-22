/**
 * StreamingText — progressive text rendering for tutor responses.
 * Displays text as it arrives chunk-by-chunk from the Gemini stream,
 * with a blinking cursor that fades out when generation is complete.
 * Layout mirrors Marginalia (2.1): margin rule + text.
 * See: 06-component-inventory.md, Family 2.
 */
import { MarkdownContent } from '@/primitives/MarkdownContent';
import styles from './StreamingText.module.css';

interface StreamingTextProps {
  /** The accumulated text so far. */
  children: string;
  /** Whether the stream has finished. */
  done: boolean;
}

export function StreamingText({ children, done }: StreamingTextProps) {
  const ruleCls = done ? styles.rule : styles.ruleStreaming;
  const cursorCls = done ? styles.cursorDone : styles.cursor;

  return (
    <div className={styles.container}>
      <div className={ruleCls} />
      <div className={styles.body}>
        <span className={styles.text}>
          <MarkdownContent>{children}</MarkdownContent>
        </span>
        {(!done || children.length > 0) && (
          <span className={cursorCls} aria-hidden="true" />
        )}
      </div>
    </div>
  );
}
