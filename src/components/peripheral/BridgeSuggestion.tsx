/**
 * Bridge Suggestion (5.4)
 * Quiet suggestion that a new intellectual path has opened.
 * See: 06-component-inventory.md, Family 5.
 */
import { MarkdownContent } from '@/primitives/MarkdownContent';
import styles from './BridgeSuggestion.module.css';

interface BridgeSuggestionProps {
  children: string;
}

export function BridgeSuggestion({ children }: BridgeSuggestionProps) {
  return (
    <div className={styles.suggestion}>
      <p className={styles.text}>
        <MarkdownContent mode="inline">{children}</MarkdownContent>
      </p>
    </div>
  );
}
