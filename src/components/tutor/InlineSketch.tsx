/**
 * InlineSketch — renders a small AI-generated sketch inline within
 * tutor prose. The tutor's output may contain `[sketch: description]`
 * markers which are extracted and replaced with generated images.
 *
 * Post-spec extension. Follows the "professor drawing on a napkin"
 * pattern — small, contextual, embedded within the prose flow.
 */
import { useState, useEffect, useRef } from 'react';
import { generateInlineSketch } from '@/services/visual-generation';
import styles from './InlineSketch.module.css';

const sketchCache = new Map<string, string | null>();
const inFlight = new Map<string, Promise<string | null>>();

interface InlineSketchProps {
  description: string;
}

export function InlineSketch({ description }: InlineSketchProps) {
  const [url, setUrl] = useState<string | null>(sketchCache.get(description) ?? null);
  const [loading, setLoading] = useState(!sketchCache.has(description));
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (sketchCache.has(description)) {
      setUrl(sketchCache.get(description) ?? null);
      setLoading(false);
      return;
    }

    let promise = inFlight.get(description);
    if (!promise) {
      promise = generateInlineSketch(description);
      inFlight.set(description, promise);
    }

    promise.then((result) => {
      sketchCache.set(description, result);
      inFlight.delete(description);
      if (mounted.current) { setUrl(result); setLoading(false); }
    }).catch(() => {
      sketchCache.set(description, null);
      inFlight.delete(description);
      if (mounted.current) setLoading(false);
    });
  }, [description]);

  if (loading) {
    return <div className={styles.placeholder} aria-label="Generating sketch..." />;
  }

  if (!url) return null;

  return (
    <figure className={styles.figure}>
      <img className={styles.sketch} src={url} alt={description} loading="lazy" />
      <figcaption className={styles.caption}>{description}</figcaption>
    </figure>
  );
}

/** Parse tutor text for [sketch: ...] markers. Returns segments. */
export type Segment = { type: 'text'; content: string } | { type: 'sketch'; description: string };

export function parseSketchMarkers(text: string): Segment[] {
  const regex = /\[sketch:\s*([^\]]+)\]/gi;
  const segments: Segment[] = [];
  let lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'sketch', description: match[1]!.trim() });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ type: 'text', content: text }];
}
