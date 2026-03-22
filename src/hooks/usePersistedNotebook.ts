/**
 * usePersistedNotebook — IndexedDB-backed notebook state.
 * Reads entries from persistence, writes back on every mutation.
 * Supports cross-out, bookmark, pin, annotations, and streaming.
 *
 * Streaming optimization: patchEntryContent updates local state
 * immediately (optimistic) and debounces IndexedDB writes to
 * avoid re-querying the full entry list on every token.
 */
import { useCallback, useRef, useState, useEffect } from 'react';
import { Store, useStoreQuery, notify } from '@/persistence';
import {
  createEntry,
  getEntriesBySession,
  updateEntry,
  updateEntryContent,
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
  const { data: dbEntries, loading } = useStoreQuery<LiveEntry[]>(
    Store.Entries,
    async () => {
      if (!sessionId) return [];
      const records = await getEntriesBySession(sessionId);
      return Promise.all(records.map(recordToLiveEntry));
    },
    [],
    [sessionId],
  );

  // Local overlay for optimistic streaming updates.
  // Maps entry ID → patched NotebookEntry. Cleared on DB sync.
  const [localPatches, setLocalPatches] = useState<
    Map<string, NotebookEntry>
  >(new Map());
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Merge DB entries with local patches
  const entries = dbEntries.map((le) => {
    const patch = localPatches.get(le.id);
    return patch ? { ...le, entry: patch } : le;
  });

  // Reconcile local patches with DB: only clear a patch when the DB
  // version has caught up (content matches or exceeds the local patch).
  // This prevents flicker during streaming where DB lags behind.
  useEffect(() => {
    if (localPatches.size === 0) return;
    setLocalPatches((prev) => {
      const next = new Map<string, NotebookEntry>();
      for (const [id, patch] of prev) {
        const dbEntry = dbEntries.find((e) => e.id === id);
        if (!dbEntry) { next.set(id, patch); continue; }
        // If DB has caught up (content matches), drop the patch
        const dbContent = 'content' in dbEntry.entry ? dbEntry.entry.content : '';
        const patchContent = 'content' in patch ? patch.content : '';
        if (dbContent !== patchContent) {
          next.set(id, patch); // DB still behind — keep local patch
        }
      }
      return next.size === prev.size ? prev : next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbEntries]);

  const addEntry = useCallback(async (entry: NotebookEntry) => {
    if (!sessionId) return;
    await createEntry(sessionId, entry);
    notify(Store.Entries);
  }, [sessionId]);

  const addEntryWithId = useCallback(async (
    entry: NotebookEntry,
  ): Promise<string> => {
    if (!sessionId) return '';
    const record = await createEntry(sessionId, entry);
    notify(Store.Entries);
    return record.id;
  }, [sessionId]);

  /**
   * Update an entry's content in-place. Optimistic: updates local
   * state immediately. IndexedDB write + notify are debounced
   * to avoid re-querying the full list on every streaming token.
   */
  const patchEntryContent = useCallback((
    id: string,
    entry: NotebookEntry,
  ) => {
    // Optimistic local update — renders instantly
    setLocalPatches((prev) => {
      const next = new Map(prev);
      next.set(id, entry);
      return next;
    });

    // Debounced persistence (300ms) — batches rapid streaming updates
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void (async () => {
        await updateEntryContent(id, entry);
        notify(Store.Entries);
      })();
    }, 300);
  }, []);

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
    addEntryWithId,
    patchEntryContent,
    crossOut,
    toggleBookmark,
    togglePin,
    annotate,
    pinnedEntries,
  };
}
