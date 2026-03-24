/**
 * InlineResponse — quoted text + tutor's contextual explanation.
 *
 * This is the visual pattern for selection-triggered tutor responses:
 * the student selects text, asks "explain" / "define" / "connect",
 * and the tutor responds with the quoted source visible above.
 *
 * Visual language: blockquote in ink-faint with a 1px left rule,
 * followed by tutor marginalia. The whole thing reads as one unit —
 * "you asked about this, here's what I think."
 *
 * Post-spec extension. Follows Family 2 visual grammar.
 */
import { MarkdownContent } from '@/primitives/MarkdownContent';
import styles from './InlineResponse.module.css';

interface InlineResponseProps {
  /** The text the student selected. */
  quotedText: string;
  /** The tutor's explanation / response. */
  children: string;
  /** What the student asked for. */
  intent: 'explain' | 'define' | 'connect';
}

const INTENT_LABELS: Record<string, string> = {
  explain: 'on',
  define: 'defining',
  connect: 'connecting',
};

export function InlineResponse({ quotedText, children, intent }: InlineResponseProps) {
  return (
    <div className={styles.container}>
      <div className={styles.quoteBlock}>
        <span className={styles.intentLabel}>{INTENT_LABELS[intent] ?? 'on'}</span>
        <blockquote className={styles.quote}>{quotedText}</blockquote>
      </div>
      <div className={styles.response}>
        <div className={styles.rule} />
        <div className={styles.text}>
          <MarkdownContent>{children}</MarkdownContent>
        </div>
      </div>
    </div>
  );
}
