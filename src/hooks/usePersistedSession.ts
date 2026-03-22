/**
 * usePersistedSession — loads session metadata from IndexedDB.
 * Returns the current and past sessions for the Notebook surface.
 */
import { Store, useStore } from '@/persistence';
import { getAllSessions } from '@/persistence/repositories/sessions';
import type { SessionRecord } from '@/persistence/records';

interface SessionState {
  sessions: SessionRecord[];
  current: SessionRecord | null;
  past: SessionRecord[];
  loading: boolean;
}

export function usePersistedSessions(): SessionState {
  const { data: sessions, loading } = useStore<SessionRecord[]>(
    Store.Sessions,
    getAllSessions,
    [],
  );

  const current = sessions.length > 0
    ? sessions[sessions.length - 1] ?? null
    : null;

  const past = sessions.length > 1
    ? sessions.slice(0, -1)
    : [];

  return { sessions, current, past, loading };
}
