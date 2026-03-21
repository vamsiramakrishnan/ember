/**
 * useSessionEntries — manages the notebook entry stream.
 * Returns the current session's entries from demo data.
 */
import { demoSession, demoSessionMeta } from '@/data/demo-session';
import type { NotebookEntry } from '@/types/entries';

interface SessionData {
  entries: NotebookEntry[];
  meta: typeof demoSessionMeta;
}

export function useSessionEntries(): SessionData {
  return {
    entries: demoSession,
    meta: demoSessionMeta,
  };
}
