/**
 * Mastery Repository — concept mastery tracking and curiosity threads.
 * Supports the MasteryBar (5.3) and Constellation mastery views.
 */
import { Store } from '../schema';
import { getAll, put, getByIndex, putBatch } from '../engine';
import { createId } from '../ids';
import type { MasteryRecord, CuriosityRecord } from '../records';
import type { MasteryLevel } from '@/types/mastery';

export async function upsertMastery(params: {
  concept: string;
  level: MasteryLevel;
  percentage: number;
}): Promise<MasteryRecord> {
  const existing = await getByIndex<MasteryRecord>(
    Store.Mastery, 'by-concept', params.concept,
  );
  const now = Date.now();

  if (existing[0]) {
    const updated = { ...existing[0], ...params, updatedAt: now };
    await put(Store.Mastery, updated);
    return updated;
  }

  const record: MasteryRecord = {
    id: createId(),
    createdAt: now,
    updatedAt: now,
    ...params,
  };
  await put(Store.Mastery, record);
  return record;
}

export async function getAllMastery(): Promise<MasteryRecord[]> {
  return getAll<MasteryRecord>(Store.Mastery);
}

export async function getMasteryByLevel(
  level: MasteryLevel,
): Promise<MasteryRecord[]> {
  return getByIndex<MasteryRecord>(Store.Mastery, 'by-level', level);
}

export async function createCuriosity(
  question: string,
): Promise<CuriosityRecord> {
  const now = Date.now();
  const record: CuriosityRecord = {
    id: createId(),
    question,
    createdAt: now,
    updatedAt: now,
  };
  await put(Store.Curiosities, record);
  return record;
}

export async function getAllCuriosities(): Promise<CuriosityRecord[]> {
  return getAll<CuriosityRecord>(Store.Curiosities);
}

export async function seedMastery(
  items: { concept: string; level: MasteryLevel; percentage: number }[],
): Promise<void> {
  const now = Date.now();
  const records = items.map((item, i) => ({
    id: createId(),
    createdAt: now + i,
    updatedAt: now + i,
    ...item,
  }));
  await putBatch(Store.Mastery, records);
}
