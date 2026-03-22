/**
 * Hypothesis Marker (1.3)
 * A guess, prediction, or hypothesis marked by the student.
 * Indigo left border at 40% opacity, indigo-dim background.
 * See: 06-component-inventory.md, Family 1.
 */
import { MarkdownContent } from '@/primitives/MarkdownContent';
import styles from './HypothesisMarker.module.css';

interface HypothesisMarkerProps {
  children: string;
}

export function HypothesisMarker({ children }: HypothesisMarkerProps) {
  return (
    <div className={styles.marker}>
      <MarkdownContent>{children}</MarkdownContent>
    </div>
  );
}
