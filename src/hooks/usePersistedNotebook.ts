/**
 * usePersistedNotebook — IndexedDB-backed notebook state.
 * Reads entries from persistence, writes back on every mutation.
 * Supports cross-out, bookmark, pin, annotations, and streaming.
 */
import { useCallback, useRef, useState, useEffect } from 'react';
import { Store, useStoreQuery, notify } from '@/persistence';
import { createEntry, getEntriesBySession, updateEntry, updateEntryContent } from '@/persistence/repositories/entries';
import { createId } from '@/persistence/ids';
import type { NotebookEntry, LiveEntry, EntryAnnotation } from '@/types/entries';
import {
  type OptimisticPatch, recordToLiveEntry,
  reconcileContentPatches, reconcileMetaPatches,
} from './persisted-notebook-helpers';

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

  const [localPatches, setLocalPatches] = useState<Map<string, NotebookEntry>>(new Map());
  const [metaPatches, setMetaPatches] = useState<Map<string, OptimisticPatch>>(new Map());
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const entries = dbEntries.map((le) => {
    const contentPatch = localPatches.get(le.id);
    const meta = metaPatches.get(le.id);
    let result = le;
    if (contentPatch) result = { ...result, entry: contentPatch };
    if (meta) result = { ...result, ...meta };
    return result;
  });

  // Reconcile content patches with DB
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (localPatches.size === 0) return;
    setLocalPatches((prev) => reconcileContentPatches(prev, dbEntries));
  }, [dbEntries]);

  // Clear meta patches when DB catches up
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (metaPatches.size === 0) return;
    setMetaPatches((prev) => reconcileMetaPatches(prev, dbEntries));
  }, [dbEntries]);

  const addEntry = useCallback(async (entry: NotebookEntry) => {
    if (!sessionId) return;
    await createEntry(sessionId, entry);
    notify(Store.Entries);
  }, [sessionId]);

  const addEntryWithId = useCallback(async (entry: NotebookEntry): Promise<string> => {
    if (!sessionId) return '';
    const record = await createEntry(sessionId, entry);
    notify(Store.Entries);
    return record.id;
  }, [sessionId]);

  const patchEntryContent = useCallback((id: string, entry: NotebookEntry) => {
    setLocalPatches((prev) => { const next = new Map(prev); next.set(id, entry); return next; });
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void (async () => { await updateEntryContent(id, entry); notify(Store.Entries); })();
    }, 300);
  }, []);

  const applyMetaPatch = useCallback((id: string, patch: OptimisticPatch) => {
    setMetaPatches((prev) => {
      const next = new Map(prev);
      next.set(id, { ...(prev.get(id) ?? {}), ...patch });
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
    if (!live.pinned && entries.filter((e) => e.pinned).length >= 3) return;
    const newVal = !live.pinned;
    applyMetaPatch(id, { pinned: newVal });
    await updateEntry(id, { pinned: newVal });
    notify(Store.Entries);
  }, [entries, applyMetaPatch]);

  const annotate = useCallback(async (entryId: string, content: string) => {
    const live = entries.find((e) => e.id === entryId);
    if (!live) return;
    const annotation: EntryAnnotation = { id: createId(), author: 'student', content, timestamp: Date.now() };
    const updated = [...(live.annotations ?? []), annotation];
    applyMetaPatch(entryId, { annotations: updated });
    await updateEntry(entryId, { annotations: updated });
    notify(Store.Entries);
  }, [entries, applyMetaPatch]);

  const pinnedEntries = entries.filter((e) => e.pinned && e.entry.type === 'question');

  return {
    entries, loading, addEntry, addEntryWithId, patchEntryContent,
    crossOut, toggleBookmark, togglePin, annotate, pinnedEntries,
  };
}
