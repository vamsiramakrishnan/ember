/**
 * usePersistedNotebook — IndexedDB-backed notebook state.
 * Reads entries from persistence, writes back on every mutation.
 * Supports cross-out, bookmark, pin, and annotations.
 */
import { useCallback } from 'react';
import { Store, useStoreQuery, notify } from '@/persistence';
import {
  createEntry,
  getEntriesBySession,
  updateEntry,
} from '@/persistence/repositories/entries';
import { getBlobAsDataUrl } from '@/persistence/repositories/blobs';
import { createId } from '@/persistence/ids';
import type { EntryRecord } from '@/persistence/records';
import type { NotebookEntry, LiveEntry, EntryAnnotation } from '@/types/entries';

/** Convert an EntryRecord to a LiveEntry for the UI. */
async function recordToLiveEntry(rec: EntryRecord): Promise<LiveEntry> {
  let entry = rec.entry;

  if (entry.type === 'sketch' && rec.blobHash) {
    const dataUrl = await getBlobAsDataUrl(rec.blobHash);
    if (dataUrl) entry = { type: 'sketch', dataUrl };
  }

  return {
    id: rec.id,
    entry,
    crossedOut: rec.crossedOut,
    bookmarked: rec.bookmarked,
    pinned: rec.pinned,
    timestamp: rec.createdAt,
    annotations: rec.annotations ?? [],
  };
}

export function usePersistedNotebook(sessionId: string | null) {
  const { data: entries, loading } = useStoreQuery<LiveEntry[]>(
    Store.Entries,
    async () => {
      if (!sessionId) return [];
      const records = await getEntriesBySession(sessionId);
      return Promise.all(records.map(recordToLiveEntry));
    },
    [],
    [sessionId],
  );

  const addEntry = useCallback(async (entry: NotebookEntry) => {
    if (!sessionId) return;
    await createEntry(sessionId, entry);
    notify(Store.Entries);
  }, [sessionId]);

  const crossOut = useCallback(async (id: string) => {
    const live = entries.find((e) => e.id === id);
    if (!live) return;
    await updateEntry(id, { crossedOut: !live.crossedOut });
    notify(Store.Entries);
  }, [entries]);

  const toggleBookmark = useCallback(async (id: string) => {
    const live = entries.find((e) => e.id === id);
    if (!live) return;
    await updateEntry(id, { bookmarked: !live.bookmarked });
    notify(Store.Entries);
  }, [entries]);

  const togglePin = useCallback(async (id: string) => {
    const live = entries.find((e) => e.id === id);
    if (!live) return;
    const pinCount = entries.filter((e) => e.pinned).length;
    if (!live.pinned && pinCount >= 3) return;
    await updateEntry(id, { pinned: !live.pinned });
    notify(Store.Entries);
  }, [entries]);

  /** Add a student annotation to an entry. */
  const annotate = useCallback(async (
    entryId: string,
    content: string,
  ) => {
    const live = entries.find((e) => e.id === entryId);
    if (!live) return;

    const annotation: EntryAnnotation = {
      id: createId(),
      author: 'student',
      content,
      timestamp: Date.now(),
    };

    const existing = live.annotations ?? [];
    await updateEntry(entryId, {
      annotations: [...existing, annotation],
    } as Partial<EntryRecord>);
    notify(Store.Entries);
  }, [entries]);

  const pinnedEntries = entries.filter(
    (e) => e.pinned && e.entry.type === 'question',
  );

  return {
    entries,
    loading,
    addEntry,
    crossOut,
    toggleBookmark,
    togglePin,
    annotate,
    pinnedEntries,
  };
}
