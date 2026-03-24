/**
 * Session Repository — CRUD for notebook sessions.
 * Sessions are scoped to a notebook, which belongs to a student.
 */
import { Store } from '../schema';
import { get, getAll, put, getByIndex, patch } from '../engine';
import { createId } from '../ids';
import type { SessionRecord } from '../records';

export async function createSession(params: {
  studentId: string;
  notebookId: string;
  number: number;
  date: string;
  timeOfDay: string;
  topic: string;
}): Promise<SessionRecord> {
  const now = Date.now();
  const record: SessionRecord = {
    id: createId(),
    createdAt: now,
    updatedAt: now,
    ...params,
  };
  await put(Store.Sessions, record);
  return record;
}

export async function getSession(
  id: string,
): Promise<SessionRecord | undefined> {
  return get<SessionRecord>(Store.Sessions, id);
}

export async function getSessionsByNotebook(
  notebookId: string,
): Promise<SessionRecord[]> {
  const records = await getByIndex<SessionRecord>(
    Store.Sessions, 'by-notebook', notebookId,
  );
  return records.sort((a, b) => a.createdAt - b.createdAt);
}

export async function getSessionsByStudent(
  studentId: string,
): Promise<SessionRecord[]> {
  const records = await getByIndex<SessionRecord>(
    Store.Sessions, 'by-student', studentId,
  );
  return records.sort((a, b) => a.createdAt - b.createdAt);
}

export async function getAllSessions(): Promise<SessionRecord[]> {
  const records = await getAll<SessionRecord>(Store.Sessions);
  return records.sort((a, b) => a.createdAt - b.createdAt);
}

export async function updateSession(
  id: string,
  updates: Partial<Pick<SessionRecord, 'topic' | 'date' | 'timeOfDay'>>,
): Promise<void> {
  await patch<SessionRecord>(Store.Sessions, id, (existing) => ({
    ...existing,
    ...updates,
    updatedAt: Date.now(),
  }));
}

export async function getLatestSession(): Promise<SessionRecord | undefined> {
  const all = await getAllSessions();
  return all[all.length - 1];
}
