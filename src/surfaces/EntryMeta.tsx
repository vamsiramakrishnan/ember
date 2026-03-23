/**
 * EntryMeta — quiet contextual metadata for notebook entries.
 * Shows relative timestamp, word count, and entry sequence number.
 * Revealed on hover (Layer 2) — invisible at rest to preserve the
 * notebook's clean reading experience.
 *
 * Design: IBM Plex Mono 9px, ink-ghost, positioned to the left
 * of the entry handle zone. The metadata feels like pencil marks
 * in the margin of a physical notebook — there if you look, gone
 * if you don't.
 */
import { useMemo } from 'react';
import styles from './EntryMeta.module.css';

interface EntryMetaProps {
  timestamp: number;
  /** Raw text content for word count — undefined for non-text entries. */
  content?: string;
  /** 1-based index in the session's entry sequence. */
  index: number;
  /** Whether this is a tutor or student entry — affects position. */
  isTutor: boolean;
}

function relativeTime(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  });
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function readingTime(words: number): string {
  const minutes = Math.ceil(words / 200);
  return minutes <= 1 ? '<1 min' : `${minutes} min`;
}

export function EntryMeta({ timestamp, content, index, isTutor }: EntryMetaProps) {
  const meta = useMemo(() => {
    const time = relativeTime(timestamp);
    const words = content ? wordCount(content) : 0;
    const reading = words > 40 ? readingTime(words) : null;
    return { time, words, reading };
  }, [timestamp, content]);

  return (
    <div className={`${styles.meta} ${isTutor ? styles.tutor : ''}`}>
      <span className={styles.time}>{meta.time}</span>
      {meta.words > 0 && (
        <span className={styles.words}>
          {meta.words}w{meta.reading && ` · ${meta.reading}`}
        </span>
      )}
      <span className={styles.index}>§{index}</span>
    </div>
  );
}
