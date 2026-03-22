/**
 * useSessionEntries — DEPRECATED.
 *
 * This hook returned hardcoded demo data. All entry access now goes
 * through usePersistedNotebook, which reads from IndexedDB.
 * Demo data is seeded via persistence/seed.ts on first launch.
 *
 * @deprecated Use usePersistedNotebook(sessionId) instead.
 */
import type { NotebookEntry } from '@/types/entries';

interface SessionData {
  entries: NotebookEntry[];
  meta: {
    sessionNumber: number;
    date: string;
    timeOfDay: string;
    topic: string;
  };
}

/** @deprecated Use usePersistedNotebook(sessionId) instead. */
export function useSessionEntries(): SessionData {
  console.warn(
    '[Ember] useSessionEntries is deprecated. ' +
    'Use usePersistedNotebook(sessionId) for persisted entries.',
  );
  return {
    entries: [],
    meta: {
      sessionNumber: 0,
      date: '',
      timeOfDay: '',
      topic: '',
    },
  };
}
