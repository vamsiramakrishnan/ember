/**
 * useSessionIndexer — indexes past sessions into File Search
 * when a notebook is opened. Enables the tutor to recall
 * context from earlier conversations.
 *
 * Runs once per notebook open. Idempotent — safe to re-index.
 */
import { useEffect, useRef } from 'react';
import { isGeminiAvailable, getGeminiClient } from '@/services/gemini';
import { indexCurrentSession } from '@/services/orchestrator';
import { useStudent } from '@/contexts/StudentContext';
import { getEntriesBySession } from '@/persistence/repositories/entries';
import type { SessionRecord } from '@/persistence/records';

export function useSessionIndexer(
  pastSessions: SessionRecord[],
) {
  const { student } = useStudent();
  const indexedRef = useRef(new Set<string>());

  useEffect(() => {
    if (!student || !isGeminiAvailable() || !getGeminiClient()) return;
    if (pastSessions.length === 0) return;

    const indexAll = async () => {
      for (const session of pastSessions) {
        if (indexedRef.current.has(session.id)) continue;
        indexedRef.current.add(session.id);

        try {
          const records = await getEntriesBySession(session.id);
          const liveEntries = records.map((r) => ({
            id: r.id,
            entry: r.entry,
            crossedOut: r.crossedOut,
            bookmarked: r.bookmarked,
            pinned: r.pinned,
            timestamp: r.createdAt,
          }));

          await indexCurrentSession(
            student.id,
            { number: session.number, date: session.date, topic: session.topic },
            liveEntries,
          );
        } catch {
          // Indexing failure is non-critical
        }
      }
    };

    void indexAll();
  }, [student, pastSessions]);
}
