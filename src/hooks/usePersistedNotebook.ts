/**
 * usePersistedNotebook — IndexedDB-backed notebook state.
 * Reads entries from persistence, writes back on every mutation.
 * Supports cross-out, bookmark, pin, annotations, and streaming.
 *
 * Improvements:
 * - Debounce timer cleaned up on unmount (no stale writes)
 * - Optimistic local updates for crossOut/bookmark/pin (instant UI)
 * - Reconciliation only clears patches when DB has caught up
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

// ─── Optimistic update types ─────────────────────────────────────

interface OptimisticPatch {
  crossedOut?: boolean;
  bookmarked?: boolean;
  pinned?: boolean;
  annotations?: EntryAnnotation[];
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
  const [localPatches, setLocalPatches] = useState<
    Map<string, NotebookEntry>
  >(new Map());

  // Optimistic metadata patches (crossOut, bookmark, pin, annotations)
  const [metaPatches, setMetaPatches] = useState<
    Map<string, OptimisticPatch>
  >(new Map());

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Merge DB entries with local patches AND meta patches
  const entries = dbEntries.map((le) => {
    const contentPatch = localPatches.get(le.id);
    const meta = metaPatches.get(le.id);
    let result = le;
    if (contentPatch) result = { ...result, entry: contentPatch };
    if (meta) result = { ...result, ...meta };
    return result;
  });

  // Reconcile content patches with DB
  useEffect(() => {
    if (localPatches.size === 0) return;
    setLocalPatches((prev) => {
      const next = new Map<string, NotebookEntry>();
      for (const [id, patch] of prev) {
        const dbEntry = dbEntries.find((e) => e.id === id);
        if (!dbEntry) { next.set(id, patch); continue; }
        const dbContent = 'content' in dbEntry.entry ? dbEntry.entry.content : '';
        const patchContent = 'content' in patch ? patch.content : '';
        if (dbContent !== patchContent) {
          next.set(id, patch);
        }
      }
      return next.size === prev.size ? prev : next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbEntries]);

  // Clear meta patches when DB catches up
  useEffect(() => {
    if (metaPatches.size === 0) return;
    setMetaPatches((prev) => {
      const next = new Map<string, OptimisticPatch>();
      for (const [id, patch] of prev) {
        const dbEntry = dbEntries.find((e) => e.id === id);
        if (!dbEntry) { next.set(id, patch); continue; }
        // Check if DB has caught up to our optimistic state
        let stale = false;
        if (patch.crossedOut !== undefined && dbEntry.crossedOut !== patch.crossedOut) stale = true;
        if (patch.bookmarked !== undefined && dbEntry.bookmarked !== patch.bookmarked) stale = true;
        if (patch.pinned !== undefined && dbEntry.pinned !== patch.pinned) stale = true;
        if (stale) next.set(id, patch);
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
   * state immediately. IndexedDB write + notify are debounced.
   */
  const patchEntryContent = useCallback((
    id: string,
    entry: NotebookEntry,
  ) => {
    setLocalPatches((prev) => {
      const next = new Map(prev);
      next.set(id, entry);
      return next;
    });

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void (async () => {
        await updateEntryContent(id, entry);
        notify(Store.Entries);
      })();
    }, 300);
  }, []);

  // ─── Optimistic mutation helpers ──────────────────────────────────

  const applyMetaPatch = useCallback((id: string, patch: OptimisticPatch) => {
    setMetaPatches((prev) => {
      const next = new Map(prev);
      const existing = prev.get(id) ?? {};
      next.set(id, { ...existing, ...patch });
      return next;
    });
  }, []);

  const crossOut = useCallback(async (id: string) => {
    const live = entries.find((e) => e.id === id);
    if (!live) return;
    const newVal = !live.crossedOut;
    applyMetaPatch(id, { crossedOut: newVal });
    await updateEntry(id, { crossedOut: newVal });
    notify(Store.Entries);
  }, [entries, applyMetaPatch]);

  const toggleBookmark = useCallback(async (id: string) => {
    const live = entries.find((e) => e.id === id);
    if (!live) return;
    const newVal = !live.bookmarked;
    applyMetaPatch(id, { bookmarked: newVal });
    await updateEntry(id, { bookmarked: newVal });
    notify(Store.Entries);
  }, [entries, applyMetaPatch]);

  const togglePin = useCallback(async (id: string) => {
    const live = entries.find((e) => e.id === id);
    if (!live) return;
    const pinCount = entries.filter((e) => e.pinned).length;
    if (!live.pinned && pinCount >= 3) return;
    const newVal = !live.pinned;
    applyMetaPatch(id, { pinned: newVal });
    await updateEntry(id, { pinned: newVal });
    notify(Store.Entries);
  }, [entries, applyMetaPatch]);

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

    const updated = [...(live.annotations ?? []), annotation];
    applyMetaPatch(entryId, { annotations: updated });
    await updateEntry(entryId, { annotations: updated });
    notify(Store.Entries);
  }, [entries, applyMetaPatch]);

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
