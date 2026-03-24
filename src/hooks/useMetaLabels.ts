/**
 * useMetaLabels — reactive hook for entry meta-labels.
 * Enqueues entries for labeling and re-renders when labels arrive.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  enqueueForLabeling,
  getCachedLabel,
  onLabelsGenerated,
  type MetaLabel,
} from '@/services/entry-meta-labels';
import type { LiveEntry } from '@/types/entries';

export function useMetaLabels(entries: LiveEntry[]) {
  const [labels, setLabels] = useState<Map<string, MetaLabel>>(new Map());
  const enqueuedRef = useRef<Set<string>>(new Set());

  // Subscribe to label generation events
  useEffect(() => {
    return onLabelsGenerated((id, label) => {
      setLabels((prev) => {
        const next = new Map(prev);
        next.set(id, label);
        return next;
      });
    });
  }, []);

  // Enqueue new entries for labeling
  useEffect(() => {
    for (const le of entries) {
      if (enqueuedRef.current.has(le.id)) continue;
      const cached = getCachedLabel(le.id);
      if (cached) {
        setLabels((prev) => {
          const next = new Map(prev);
          next.set(le.id, cached);
          return next;
        });
        enqueuedRef.current.add(le.id);
        continue;
      }

      const content = 'content' in le.entry ? le.entry.content : '';
      if (content && content.length >= 10) {
        enqueueForLabeling(le.id, content);
        enqueuedRef.current.add(le.id);
      }
    }
  }, [entries]);

  const getLabel = useCallback((entryId: string): MetaLabel | null => {
    return labels.get(entryId) ?? getCachedLabel(entryId) ?? null;
  }, [labels]);

  return { labels, getLabel };
}
