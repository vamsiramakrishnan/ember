/**
 * Notebook Repository — CRUD for notebooks.
 * A notebook is a named collection of sessions belonging to a student.
 * e.g. "Music & Mathematics", "The Nature of Light"
 */
import { Store } from '../schema';
import { get, put, getByIndex, patch } from '../engine';
import { createId } from '../ids';
import type { NotebookRecord } from '../records';

export async function createNotebook(params: {
  studentId: string;
  title: string;
  description?: string;
}): Promise<NotebookRecord> {
  const now = Date.now();
  const record: NotebookRecord = {
    id: createId(),
    createdAt: now,
    updatedAt: now,
    studentId: params.studentId,
    title: params.title,
    description: params.description ?? '',
    sessionCount: 0,
    isActive: true,
  };
  await put(Store.Notebooks, record);
  return record;
}

export async function getNotebook(
  id: string,
): Promise<NotebookRecord | undefined> {
  return get<NotebookRecord>(Store.Notebooks, id);
}

export async function getNotebooksByStudent(
  studentId: string,
): Promise<NotebookRecord[]> {
  const records = await getByIndex<NotebookRecord>(
    Store.Notebooks, 'by-student', studentId,
  );
  return records.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function updateNotebook(
  id: string,
  updates: Partial<Pick<NotebookRecord,
    'title' | 'description' | 'isActive' | 'sessionCount' |
    'iconDataUrl' | 'tags' | 'summary' | 'discipline'
  >>,
): Promise<void> {
  await patch<NotebookRecord>(Store.Notebooks, id, (existing) => ({
    ...existing,
    ...updates,
    updatedAt: Date.now(),
  }));
}
