/**
 * MathPreview — live-rendered KaTeX preview shown in the margin
 * as the student types math notation in the InputZone.
 *
 * Detects $...$ (inline) and $$...$$ (display) math in the input,
 * renders it through the MarkdownContent pipeline, and shows it
 * as a quiet floating preview. Fades in/out with input changes.
 */
import { useMemo, useDeferredValue } from 'react';
import { MarkdownContent } from './MarkdownContent';
import styles from './MathPreview.module.css';

interface MathPreviewProps {
  /** Raw input text from the textarea. */
  value: string;
}

/** Match $...$ or $$...$$ with at least one character inside. */
const MATH_RE = /\$\$([^$]+)\$\$|\$([^$\n]+)\$/g;

function extractMath(text: string): string[] {
  const matches: string[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(MATH_RE.source, 'g');
  while ((m = re.exec(text)) !== null) {
    const expr = m[1] ?? m[2];
    if (expr?.trim()) matches.push(expr.trim());
  }
  return matches;
}

export function MathPreview({ value }: MathPreviewProps) {
  const deferred = useDeferredValue(value);
  const expressions = useMemo(() => extractMath(deferred), [deferred]);

  if (expressions.length === 0) return null;

  return (
    <div className={styles.container} aria-label="Math preview" role="status">
      <span className={styles.label}>preview</span>
      {expressions.map((expr, i) => (
        <div key={`${expr}-${i}`} className={styles.expression}>
          <MarkdownContent mode="inline">{`$${expr}$`}</MarkdownContent>
        </div>
      ))}
    </div>
  );
}
