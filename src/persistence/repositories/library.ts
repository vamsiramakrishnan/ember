/**
 * Library Repository — primary texts the student is reading.
 * Scoped to notebook — each notebook tracks its own reading list.
 * Constellation → Library sub-view.
 */
import { Store } from '../schema';
import { get, getAll, put, getByIndex, patch } from '../engine';
import { createId } from '../ids';
import type { LibraryRecord } from '../records';

export async function createLibraryEntry(params: {
  studentId: string;
  notebookId: string;
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

export async function getLibraryByNotebook(
  notebookId: string,
): Promise<LibraryRecord[]> {
  return getByIndex<LibraryRecord>(Store.Library, 'by-notebook', notebookId);
}

export async function getAllLibrary(): Promise<LibraryRecord[]> {
  return getAll<LibraryRecord>(Store.Library);
}

export async function updateLibraryEntry(
  id: string,
  updates: Partial<Pick<LibraryRecord, 'isCurrent' | 'annotationCount' | 'quote'>>,
): Promise<void> {
  await patch<LibraryRecord>(Store.Library, id, (existing) => ({
    ...existing,
    ...updates,
    updatedAt: Date.now(),
  }));
}
