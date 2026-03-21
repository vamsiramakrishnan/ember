/**
 * useNotebookEntries — manages the live notebook entry stream.
 * Supports adding entries, crossing out, bookmarking, and pinning.
 * Initialises from demo data, then accepts live student input.
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

export function useNotebookEntries(initial: NotebookEntry[]) {
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
    addEntries,
    crossOut,
    toggleBookmark,
    togglePin,
    pinnedEntries,
  };
}
