/**
 * StreamingText — progressive text rendering for tutor responses.
 * Displays text as it arrives chunk-by-chunk from the Gemini stream.
 * When empty (thinking), shows just a blinking cursor with margin rule.
 * When streaming, text appears with cursor at the end.
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

/** Detect structured JSON output that shouldn't be shown as raw text. */
function isStructuredJson(text: string): boolean {
  const trimmed = text.trimStart();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('```')) return false;
  // Check for common entry type markers in the JSON
  return /["']type["']\s*:\s*["']/.test(trimmed);
}

export function StreamingText({ children, done }: StreamingTextProps) {
  const hasContent = children.length > 0;
  const ruleCls = done ? styles.rule : styles.ruleStreaming;

  // Thinking state: no text yet, just a subtle cursor
  if (!hasContent && !done) {
    return (
      <div className={styles.thinkingContainer} aria-busy="true" aria-label="Tutor is thinking">
        <div className={styles.ruleStreaming} />
        <span className={styles.cursor} aria-hidden="true" />
      </div>
    );
  }

  // While streaming: if the content is structured JSON (concept-diagram,
  // thinker-card, etc.), show a composing state instead of raw JSON.
  // The entry will be replaced with the proper component once parsing completes.
  if (!done && isStructuredJson(children)) {
    return (
      <div className={styles.thinkingContainer} aria-busy="true" aria-label="Tutor is composing">
        <div className={styles.ruleStreaming} />
        <span className={styles.composingLabel}>composing…</span>
        <span className={styles.cursor} aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className={styles.container} aria-live="polite" aria-busy={!done}>
      <div className={ruleCls} />
      <div className={styles.body}>
        <span className={styles.text}>
          <MarkdownContent>{children}</MarkdownContent>
        </span>
        {!done && <span className={styles.cursor} aria-hidden="true" />}
      </div>
    </div>
  );
}
