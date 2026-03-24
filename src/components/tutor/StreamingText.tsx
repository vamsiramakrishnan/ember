/**
 * StreamingText — progressive text rendering for tutor responses.
 * Displays text as it arrives chunk-by-chunk from the Gemini stream.
 *
 * Three layers of streaming intelligence:
 *   1. useDeferredValue — React deprioritizes re-parsing during rapid chunks
 *   2. useSemanticBuffer — masks incomplete code/math/table blocks,
 *      shows warm placeholders instead of ugly partial markup
 *   3. unwrapJson — detects structured JSON payloads and either extracts
 *      displayable content or shows "composing…" for visual types
 *
 * See: 06-component-inventory.md, Family 2.
 */
import { useDeferredValue } from 'react';
import { MarkdownContent } from '@/primitives/MarkdownContent';
import { useSemanticBuffer, pendingLabel } from '@/hooks/useSemanticBuffer';
import styles from './StreamingText.module.css';

interface StreamingTextProps {
  children: string;
  done: boolean;
}

function unwrapJson(text: string): string | 'composing' | null {
  const trimmed = text.trimStart();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('```')) return null;
  if (!/["']type["']\s*:\s*["']/.test(trimmed)) return null;
  const m = trimmed.match(
    /["']content["']\s*:\s*["']([\s\S]*?)(?:["'](?:\s*[,}])|$)/,
  );
  if (m?.[1]) {
    return m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"')
      .replace(/\\'/g, "'").replace(/\\\\/g, '\\');
  }
  return 'composing';
}

export function StreamingText({ children, done }: StreamingTextProps) {
  const deferred = useDeferredValue(children);
  const hasContent = children.length > 0;
  const ruleCls = (done ? styles.rule : styles.ruleStreaming) ?? '';

  // Phase 1: Thinking (empty, not done)
  if (!hasContent && !done) {
    return (
      <div className={styles.thinkingContainer} aria-busy="true"
        aria-label="Tutor is thinking">
        <div className={styles.ruleStreaming} />
        <span className={styles.cursor} aria-hidden="true" />
      </div>
    );
  }

  // Phase 2: Streaming — try JSON unwrap
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
      return <StreamBody text={unwrapped} done={false} ruleCls={ruleCls} />;
    }
  }

  // Phase 3: Streaming raw text / done
  return <StreamBody text={done ? children : deferred} done={done} ruleCls={ruleCls} />;
}

/** Inner component that applies semantic buffering to visible text. */
function StreamBody({ text, done, ruleCls }: {
  text: string; done: boolean; ruleCls: string;
}) {
  const { visible, pending } = useSemanticBuffer(text, done);
  const label = pendingLabel(pending);

  return (
    <div className={styles.container} aria-live="polite" aria-busy={!done}>
      <div className={ruleCls} />
      <div className={styles.body}>
        <div className={styles.text}>
          <MarkdownContent>{visible}</MarkdownContent>
        </div>
        {label && <span className={styles.composingLabel}>{label}</span>}
        {!done && <span className={styles.cursor} aria-hidden="true" />}
      </div>
    </div>
  );
}
