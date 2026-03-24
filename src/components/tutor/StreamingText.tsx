/**
 * StreamingText — progressive text rendering for tutor responses.
 * Displays text as it arrives chunk-by-chunk from the Gemini stream.
 * When empty (thinking), shows just a blinking cursor with margin rule.
 * When streaming, text appears with cursor at the end.
 * Layout mirrors Marginalia (2.1): margin rule + text.
 *
 * Uses useDeferredValue to let React deprioritize markdown re-parsing
 * during rapid streaming, keeping the UI responsive.
 *
 * See: 06-component-inventory.md, Family 2.
 */
import { useDeferredValue } from 'react';
import { MarkdownContent } from '@/primitives/MarkdownContent';
import styles from './StreamingText.module.css';

interface StreamingTextProps {
  children: string;
  done: boolean;
}

/**
 * Detect structured JSON and try to extract displayable content.
 * Returns the extracted text if it's a text-bearing type (marginalia,
 * question, connection), or 'composing' for visual types (diagram,
 * thinker-card), or null if it's not JSON.
 */
function unwrapJson(text: string): string | 'composing' | null {
  const trimmed = text.trimStart();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('```')) return null;
  if (!/["']type["']\s*:\s*["']/.test(trimmed)) return null;

  const contentMatch = trimmed.match(
    /["']content["']\s*:\s*["']([\s\S]*?)(?:["'](?:\s*[,}])|$)/,
  );
  if (contentMatch?.[1]) {
    return contentMatch[1]
      .replace(/\\n/g, '\n').replace(/\\"/g, '"')
      .replace(/\\'/g, "'").replace(/\\\\/g, '\\');
  }

  return 'composing';
}

export function StreamingText({ children, done }: StreamingTextProps) {
  const deferred = useDeferredValue(children);
  const hasContent = children.length > 0;
  const ruleCls = done ? styles.rule : styles.ruleStreaming;

  if (!hasContent && !done) {
    return (
      <div className={styles.thinkingContainer} aria-busy="true"
        aria-label="Tutor is thinking">
        <div className={styles.ruleStreaming} />
        <span className={styles.cursor} aria-hidden="true" />
      </div>
    );
  }

  if (!done) {
    const unwrapped = unwrapJson(deferred);
    if (unwrapped === 'composing') {
      return (
        <div className={styles.thinkingContainer} aria-busy="true"
          aria-label="Tutor is composing">
          <div className={styles.ruleStreaming} />
          <span className={styles.composingLabel}>composing…</span>
          <span className={styles.cursor} aria-hidden="true" />
        </div>
      );
    }
    if (unwrapped) {
      return (
        <div className={styles.container} aria-live="polite" aria-busy>
          <div className={ruleCls} />
          <div className={styles.body}>
            <div className={styles.text}>
              <MarkdownContent>{unwrapped}</MarkdownContent>
            </div>
            <span className={styles.cursor} aria-hidden="true" />
          </div>
        </div>
      );
    }
  }

  const display = done ? children : deferred;
  return (
    <div className={styles.container} aria-live="polite" aria-busy={!done}>
      <div className={ruleCls} />
      <div className={styles.body}>
        <div className={styles.text}>
          <MarkdownContent>{display}</MarkdownContent>
        </div>
        {!done && <span className={styles.cursor} aria-hidden="true" />}
      </div>
    </div>
  );
}
