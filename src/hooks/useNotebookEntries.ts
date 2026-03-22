/**
 * useNotebookEntries — DEPRECATED.
 *
 * This was the in-memory entry manager that initialized from demo data.
 * All state now flows through usePersistedNotebook, which reads/writes
 * IndexedDB. The persistence layer is the single source of truth.
 *
 * @deprecated Use usePersistedNotebook(sessionId) instead.
 */
import { useState, useCallback } from 'react';
import type { NotebookEntry, LiveEntry } from '@/types/entries';

let nextId = 0;
function makeId(): string {
  return `entry-${++nextId}-${Date.now()}`;
}

function toLiveEntry(entry: NotebookEntry): LiveEntry {
  return {
    id: makeId(),
    entry,
    crossedOut: false,
    bookmarked: false,
    pinned: false,
    timestamp: Date.now(),
  };
}

/** @deprecated Use usePersistedNotebook(sessionId) instead. */
export function useNotebookEntries(initial: NotebookEntry[]) {
  if (import.meta.env.DEV) {
    console.warn(
      '[Ember] useNotebookEntries is deprecated. ' +
      'Use usePersistedNotebook(sessionId) for persisted entries.',
    );
  }

  const [entries, setEntries] = useState<LiveEntry[]>(
    () => initial.map(toLiveEntry),
  );

  const addEntry = useCallback((entry: NotebookEntry) => {
    setEntries((prev) => [...prev, toLiveEntry(entry)]);
  }, []);

  const addEntries = useCallback((newEntries: NotebookEntry[]) => {
    setEntries((prev) => [
      ...prev,
      ...newEntries.map(toLiveEntry),
    ]);
  }, []);

  const addEntryWithId = useCallback((entry: NotebookEntry): string => {
    const live = toLiveEntry(entry);
    setEntries((prev) => [...prev, live]);
    return live.id;
  }, []);

  const updateEntry = useCallback((id: string, entry: NotebookEntry) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, entry } : e)),
    );
  }, []);

  const crossOut = useCallback((id: string) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, crossedOut: !e.crossedOut } : e,
      ),
    );
  }, []);

  const toggleBookmark = useCallback((id: string) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, bookmarked: !e.bookmarked } : e,
      ),
    );
  }, []);

  const togglePin = useCallback((id: string) => {
    setEntries((prev) => {
      const pinCount = prev.filter((e) => e.pinned).length;
      return prev.map((e) => {
        if (e.id !== id) return e;
        if (e.pinned) return { ...e, pinned: false };
        if (pinCount >= 3) return e;
        return { ...e, pinned: true };
      });
    });
  }, []);

  const pinnedEntries = entries.filter(
    (e) => e.pinned && e.entry.type === 'question',
  );

  return {
    entries,
    addEntry,
    addEntryWithId,
    addEntries,
    updateEntry,
    crossOut,
    toggleBookmark,
    togglePin,
    pinnedEntries,
  };
}
