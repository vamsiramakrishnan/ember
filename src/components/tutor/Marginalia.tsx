/**
 * Marginalia (2.1)
 * Tutor's prose response — annotation in the margin of the student's notebook.
 * Layout: CSS grid — 3px rule | 16px gap | text.
 *
 * Supports inline sketches: if the tutor's text contains `[sketch: description]`
 * markers, they are replaced with AI-generated illustrations inline.
 *
 * Uses block-mode MarkdownContent to support tables, code, and math
 * from /delve research and other rich tutor responses.
 *
 * See: 06-component-inventory.md, Family 2.
 */
import { MarkdownContent } from '@/primitives/MarkdownContent';
import { InlineSketch, parseSketchMarkers } from './InlineSketch';
import styles from './Marginalia.module.css';

interface MarginaliaProps {
  children: string;
}

export function Marginalia({ children }: MarginaliaProps) {
  const segments = parseSketchMarkers(children);
  const hasSketch = segments.some((s) => s.type === 'sketch');

  return (
    <div className={styles.container}>
      <div className={styles.rule} />
      <div className={styles.text}>
        {hasSketch ? (
          segments.map((seg, i) =>
            seg.type === 'text' ? (
              <div key={i} className={styles.prose}>
                <MarkdownContent>{seg.content}</MarkdownContent>
              </div>
            ) : (
              <InlineSketch key={i} description={seg.description} />
            ),
          )
        ) : (
          <div className={styles.prose}>
            <MarkdownContent>{children}</MarkdownContent>
          </div>
        )}
      </div>
    </div>
  );
}
