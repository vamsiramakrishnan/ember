/**
 * Entry Repository — CRUD for notebook entries within sessions.
 * Entries are ordered via fractional indexes for stable insertion.
 * Sketch entries have their blobs stored separately (content-addressed).
 */
import { Store } from '../schema';
import { get, put, getByIndex } from '../engine';
import { transact } from '../transaction';
import { createId, nextOrder } from '../ids';
import { storeDataUrl } from './blobs';
import type { EntryRecord } from '../records';
import type { NotebookEntry } from '@/types/entries';

/** Create a new entry in a session. Handles blob extraction for sketches. */
export async function createEntry(
  sessionId: string,
  entry: NotebookEntry,
  opts?: { crossedOut?: boolean; bookmarked?: boolean; pinned?: boolean },
): Promise<EntryRecord> {
  const siblings = await getEntriesBySession(sessionId);
  const lastOrder = siblings[siblings.length - 1]?.order;

  let blobHash: string | undefined;
  let storedEntry = entry;

  if (entry.type === 'sketch') {
    blobHash = await storeDataUrl(entry.dataUrl);
    storedEntry = { type: 'sketch', dataUrl: blobHash };
  }

  const now = Date.now();
  const record: EntryRecord = {
    id: createId(),
    sessionId,
    order: nextOrder(lastOrder),
    type: entry.type,
    entry: storedEntry,
    crossedOut: opts?.crossedOut ?? false,
    bookmarked: opts?.bookmarked ?? false,
    pinned: opts?.pinned ?? false,
    createdAt: now,
    updatedAt: now,
    blobHash,
  };

  await put(Store.Entries, record);
  return record;
}

/** Batch-create entries in order. Used for seeding. */
export async function createEntries(
  sessionId: string,
  entries: NotebookEntry[],
): Promise<void> {
  const ops = [];
  let order = 0;
  const now = Date.now();

  for (const entry of entries) {
    order++;
    let blobHash: string | undefined;
    let storedEntry = entry;

    if (entry.type === 'sketch') {
      blobHash = await storeDataUrl(entry.dataUrl);
      storedEntry = { type: 'sketch', dataUrl: blobHash };
    }

    ops.push({
      store: Store.Entries,
      action: 'put' as 'put',
      data: {
        id: createId(),
        sessionId,
        order,
        type: entry.type,
        entry: storedEntry,
        crossedOut: false,
        bookmarked: false,
        pinned: false,
        createdAt: now + order,
        updatedAt: now + order,
        blobHash,
      },
    });
  }

  await transact(ops);
}

/** Get all entries for a session, ordered. */
export async function getEntriesBySession(
  sessionId: string,
): Promise<EntryRecord[]> {
  const records = await getByIndex<EntryRecord>(
    Store.Entries, 'by-session', sessionId,
  );
  return records.sort((a, b) => a.order - b.order);
}

/** Get a single entry by ID. */
export async function getEntry(
  id: string,
): Promise<EntryRecord | undefined> {
  return get<EntryRecord>(Store.Entries, id);
}

/** Update entry metadata (cross-out, bookmark, pin). */
export async function updateEntry(
  id: string,
  updates: Partial<Pick<EntryRecord, 'crossedOut' | 'bookmarked' | 'pinned'>>,
): Promise<void> {
  const existing = await get<EntryRecord>(Store.Entries, id);
  if (!existing) return;
  await put(Store.Entries, { ...existing, ...updates, updatedAt: Date.now() });
}

/** Update the entry content in-place (used for streaming updates). */
export async function updateEntryContent(
  id: string,
  entry: NotebookEntry,
): Promise<void> {
  const existing = await get<EntryRecord>(Store.Entries, id);
  if (!existing) return;
  await put(Store.Entries, {
    ...existing,
    type: entry.type,
    entry,
    updatedAt: Date.now(),
  });
}

/** Get all pinned entries across all sessions. */
export async function getPinnedEntries(): Promise<EntryRecord[]> {
  const results = await getByIndex<EntryRecord>(
    Store.Entries, 'by-pinned', 1,
  );
  return results;
}
