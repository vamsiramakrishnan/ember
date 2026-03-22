/**
 * useMasteryUpdater — periodically extracts mastery signals from
 * the conversation and updates IndexedDB. Runs every 5 new entries.
 * Invisible to the student — mastery is felt, not shown.
 */
import { useCallback, useRef } from 'react';
import { Store, notify } from '@/persistence';
import { getAllMastery, upsertMastery } from '@/persistence/repositories/mastery';
import { extractMasterySignals } from '@/services/mastery-extractor';
import type { LiveEntry } from '@/types/entries';

const UPDATE_INTERVAL = 5;

export function useMasteryUpdater() {
  const entryCountRef = useRef(0);
  const runningRef = useRef(false);

  const checkAndUpdate = useCallback(async (entries: LiveEntry[]) => {
    entryCountRef.current++;
    if (entryCountRef.current % UPDATE_INTERVAL !== 0) return;
    if (runningRef.current) return;

    runningRef.current = true;
    try {
      const recent = entries.slice(-10).map((le) => ({
        type: le.entry.type,
        content: 'content' in le.entry ? le.entry.content : undefined,
      }));

      const signals = await extractMasterySignals(recent);
      if (!signals) return;

      await getAllMastery(); // warm the cache

      for (const concept of signals.concepts) {
        await upsertMastery({
          concept: concept.concept,
          level: concept.level,
          percentage: concept.percentage,
        });
      }

      notify(Store.Mastery);
    } catch (err) {
      console.error('[Ember] Mastery update error:', err);
    } finally {
      runningRef.current = false;
    }
  }, []);

  return { checkAndUpdate };
}
