/**
 * Student Repository — CRUD for student identities.
 * A student is the top-level entity. Everything belongs to a student.
 */
import { Store } from '../schema';
import { get, getAll, put, patch } from '../engine';
import { createId } from '../ids';
import type { StudentRecord } from '../records';

export async function createStudent(params: {
  name: string;
  displayName?: string;
}): Promise<StudentRecord> {
  const now = Date.now();
  const record: StudentRecord = {
    id: createId(),
    createdAt: now,
    updatedAt: now,
    name: params.name,
    displayName: params.displayName ?? params.name,
    avatarSeed: createId(),
    totalMinutes: 0,
  };
  await put(Store.Students, record);
  return record;
}

export async function getStudent(
  id: string,
): Promise<StudentRecord | undefined> {
  return get<StudentRecord>(Store.Students, id);
}

export async function getAllStudents(): Promise<StudentRecord[]> {
  const records = await getAll<StudentRecord>(Store.Students);
  return records.sort((a, b) => a.createdAt - b.createdAt);
}

export async function updateStudent(
  id: string,
  updates: Partial<Pick<StudentRecord, 'name' | 'displayName' | 'totalMinutes'>>,
): Promise<void> {
  await patch<StudentRecord>(Store.Students, id, (existing) => ({
    ...existing,
    ...updates,
    updatedAt: Date.now(),
  }));
}
