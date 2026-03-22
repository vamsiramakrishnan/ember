/**
 * Library Repository — primary texts the student is reading.
 * Constellation → Library sub-view.
 */
import { Store } from '../schema';
import { get, getAll, put } from '../engine';
import { createId } from '../ids';
import type { LibraryRecord } from '../records';

export async function createLibraryEntry(params: {
  title: string;
  author: string;
  isCurrent: boolean;
  annotationCount: number;
  quote: string;
}): Promise<LibraryRecord> {
  const now = Date.now();
  const record: LibraryRecord = {
    id: createId(),
    createdAt: now,
    updatedAt: now,
    ...params,
  };
  await put(Store.Library, record);
  return record;
}

export async function getLibraryEntry(
  id: string,
): Promise<LibraryRecord | undefined> {
  return get<LibraryRecord>(Store.Library, id);
}

export async function getAllLibrary(): Promise<LibraryRecord[]> {
  return getAll<LibraryRecord>(Store.Library);
}

export async function updateLibraryEntry(
  id: string,
  updates: Partial<Pick<LibraryRecord, 'isCurrent' | 'annotationCount' | 'quote'>>,
): Promise<void> {
  const existing = await get<LibraryRecord>(Store.Library, id);
  if (!existing) return;
  await put(Store.Library, { ...existing, ...updates, updatedAt: Date.now() });
}
