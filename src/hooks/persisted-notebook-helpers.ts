/**
 * persisted-notebook-helpers — conversion and reconciliation utilities
 * for the persisted notebook hook.
 *
 * Extracted from usePersistedNotebook to enforce the 150-line file limit.
 */
import { getBlobAsDataUrl } from '@/persistence/repositories/blobs';
import type { EntryRecord } from '@/persistence/records';
import type { NotebookEntry, LiveEntry, EntryAnnotation } from '@/types/entries';

/** Optimistic metadata patch shape for crossOut, bookmark, pin, annotations. */
export interface OptimisticPatch {
  crossedOut?: boolean;
  bookmarked?: boolean;
  pinned?: boolean;
  annotations?: EntryAnnotation[];
}

/** Convert an EntryRecord from IndexedDB to a LiveEntry for the UI. */
export async function recordToLiveEntry(rec: EntryRecord): Promise<LiveEntry> {
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

/**
 * Reconcile content patches against DB entries.
 * Returns a new map with only patches that haven't been persisted yet.
 */
export function reconcileContentPatches(
  prev: Map<string, NotebookEntry>,
  dbEntries: LiveEntry[],
): Map<string, NotebookEntry> {
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
}

/**
 * Reconcile meta patches against DB entries.
 * Returns a new map with only patches where DB hasn't caught up.
 */
export function reconcileMetaPatches(
  prev: Map<string, OptimisticPatch>,
  dbEntries: LiveEntry[],
): Map<string, OptimisticPatch> {
  const next = new Map<string, OptimisticPatch>();
  for (const [id, patch] of prev) {
    const dbEntry = dbEntries.find((e) => e.id === id);
    if (!dbEntry) { next.set(id, patch); continue; }
    let stale = false;
    if (patch.crossedOut !== undefined && dbEntry.crossedOut !== patch.crossedOut) stale = true;
    if (patch.bookmarked !== undefined && dbEntry.bookmarked !== patch.bookmarked) stale = true;
    if (patch.pinned !== undefined && dbEntry.pinned !== patch.pinned) stale = true;
    if (stale) next.set(id, patch);
  }
  return next.size === prev.size ? prev : next;
}
