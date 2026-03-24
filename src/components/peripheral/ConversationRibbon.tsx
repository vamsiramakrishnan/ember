/**
 * ConversationRibbon — thin vertical thread line in the left margin
 * connecting entries that share prompted-by/follow-up relations.
 * Only visible on wide viewports (800px+). Purely decorative.
 */
import { useEffect, useState, useRef } from 'react';
import styles from './ConversationRibbon.module.css';

interface RibbonSegment {
  top: number;
  height: number;
  color: 'student' | 'tutor' | 'mixed';
}

interface ConversationRibbonProps {
  /** Entry IDs in this cluster, in order. */
  entryIds: string[];
}

export function ConversationRibbon({ entryIds }: ConversationRibbonProps) {
  const [segment, setSegment] = useState<RibbonSegment | null>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    if (entryIds.length < 2) { setSegment(null); return; }

    const measure = () => {
      const firstEl = document.querySelector(`[data-entry-id="${entryIds[0]}"]`);
      const lastEl = document.querySelector(`[data-entry-id="${entryIds[entryIds.length - 1]}"]`);
      if (!firstEl || !lastEl) return;
      const container = firstEl.closest('[class*="entryContainer"]');
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const firstRect = firstEl.getBoundingClientRect();
      const lastRect = lastEl.getBoundingClientRect();
      const top = firstRect.top - containerRect.top + 8;
      const height = lastRect.bottom - firstRect.top - 16;
      if (height > 0) {
        setSegment({ top, height, color: 'mixed' });
      }
    };

    measure();
    rafRef.current = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(rafRef.current);
  }, [entryIds]);

  if (!segment || segment.height < 20) return null;

  return (
    <div
      className={styles.ribbon}
      style={{ top: segment.top, height: segment.height }}
      aria-hidden="true"
    />
  );
}
