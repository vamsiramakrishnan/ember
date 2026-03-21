/**
 * Session Repository — CRUD for notebook sessions.
 * A session is the top-level container: "Session 47, Tuesday evening."
 */
import { Store } from '../schema';
import { get, getAll, put, getByIndex } from '../engine';
import { createId } from '../ids';
import type { SessionRecord } from '../records';

/** Create a new session. Returns the session record. */
export async function createSession(params: {
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

/** Get a session by ID. */
export async function getSession(
  id: string,
): Promise<SessionRecord | undefined> {
  return get<SessionRecord>(Store.Sessions, id);
}

/** Get a session by its number. */
export async function getSessionByNumber(
  num: number,
): Promise<SessionRecord | undefined> {
  const results = await getByIndex<SessionRecord>(
    Store.Sessions, 'by-number', num,
  );
  return results[0];
}

/** Get all sessions, sorted by creation time (oldest first). */
export async function getAllSessions(): Promise<SessionRecord[]> {
  const records = await getAll<SessionRecord>(Store.Sessions);
  return records.sort((a, b) => a.createdAt - b.createdAt);
}

/** Update a session's topic or metadata. */
export async function updateSession(
  id: string,
  updates: Partial<Pick<SessionRecord, 'topic' | 'date' | 'timeOfDay'>>,
): Promise<void> {
  const existing = await get<SessionRecord>(Store.Sessions, id);
  if (!existing) return;
  await put(Store.Sessions, { ...existing, ...updates, updatedAt: Date.now() });
}

/** Get the latest session (highest number). */
export async function getLatestSession(): Promise<SessionRecord | undefined> {
  const all = await getAllSessions();
  return all[all.length - 1];
}
