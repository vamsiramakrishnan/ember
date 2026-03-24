/**
 * useScrollContext — tracks which entry the student was recently reading.
 * When the student scrolls up to read an old entry and then scrolls back
 * to the InputZone, a ghost reference shows what they were looking at.
 * This gives the tutor context about what prompted the student's thought.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import type { LiveEntry } from '@/types/entries';

export interface ScrollContext {
  /** The entry the student was most recently viewing (>2s in viewport). */
  referencedEntry: LiveEntry | null;
  /** Short content snippet for display. */
  referenceSnippet: string | null;
  /** Clear the reference (after student submits). */
  clearReference: () => void;
  /** Whether the user is actively scrolling. */
  isScrolling: boolean;
}

export function useScrollContext(entries: LiveEntry[]): ScrollContext {
  const [referencedEntry, setReferencedEntry] = useState<LiveEntry | null>(null);
  const [referenceSnippet, setReferenceSnippet] = useState<string | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimer = useRef<ReturnType<typeof setTimeout>>();
  const dwellTimer = useRef<ReturnType<typeof setTimeout>>();
  const lastVisibleId = useRef<string | null>(null);
  const entryMapRef = useRef(new Map<string, LiveEntry>());

  // Keep entry map in sync
  useEffect(() => {
    entryMapRef.current = new Map(entries.map((e) => [e.id, e]));
  }, [entries]);

  // Scroll tracking — detect when user stops scrolling
  useEffect(() => {
    const onScroll = () => {
      setIsScrolling(true);
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
      scrollTimer.current = setTimeout(() => setIsScrolling(false), 300);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Intersection observer — track which entry is in the center of viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (observerEntries) => {
        for (const oe of observerEntries) {
          if (oe.isIntersecting) {
            const id = (oe.target as HTMLElement).dataset.entryId;
            if (id && id !== lastVisibleId.current) {
              lastVisibleId.current = id;
              if (dwellTimer.current) clearTimeout(dwellTimer.current);
              dwellTimer.current = setTimeout(() => {
                const entry = id ? entryMapRef.current.get(id) : undefined;
                if (entry && entry.entry.type.startsWith('tutor-')) {
                  const content = 'content' in entry.entry ? entry.entry.content : '';
                  if (content) {
                    setReferencedEntry(entry);
                    setReferenceSnippet(content.slice(0, 80) + (content.length > 80 ? '\u2026' : ''));
                  }
                }
              }, 2000);
            }
          }
        }
      },
      { rootMargin: '-40% 0px -40% 0px', threshold: 0.5 },
    );

    const entryEls = document.querySelectorAll('[data-entry-id]');
    entryEls.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  // Observer uses entryMapRef (a ref), so no need to re-create on entries change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearReference = useCallback(() => {
    setReferencedEntry(null);
    setReferenceSnippet(null);
  }, []);

  return { referencedEntry, referenceSnippet, clearReference, isScrolling };
}
