/**
 * Encounter Repository — thinker encounter history.
 * Tracks every intellectual encounter with a thinker across sessions.
 * Constellation → Encounters sub-view.
 */
import { Store } from '../schema';
import { get, getAll, put, getByIndex } from '../engine';
import { createId } from '../ids';
import type { EncounterRecord } from '../records';

type EncounterStatus = EncounterRecord['status'];

export async function createEncounter(params: {
  ref: string;
  thinker: string;
  tradition: string;
  coreIdea: string;
  sessionTopic: string;
  date: string;
  status: EncounterStatus;
  bridgedTo?: string;
}): Promise<EncounterRecord> {
  const now = Date.now();
  const record: EncounterRecord = {
    id: createId(),
    createdAt: now,
    updatedAt: now,
    ...params,
  };
  await put(Store.Encounters, record);
  return record;
}

export async function getEncounter(
  id: string,
): Promise<EncounterRecord | undefined> {
  return get<EncounterRecord>(Store.Encounters, id);
}

export async function getAllEncounters(): Promise<EncounterRecord[]> {
  const records = await getAll<EncounterRecord>(Store.Encounters);
  return records.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getEncountersByThinker(
  thinker: string,
): Promise<EncounterRecord[]> {
  return getByIndex<EncounterRecord>(Store.Encounters, 'by-thinker', thinker);
}

export async function getEncountersByStatus(
  status: EncounterStatus,
): Promise<EncounterRecord[]> {
  return getByIndex<EncounterRecord>(Store.Encounters, 'by-status', status);
}

export async function updateEncounterStatus(
  id: string,
  status: EncounterStatus,
  bridgedTo?: string,
): Promise<void> {
  const existing = await get<EncounterRecord>(Store.Encounters, id);
  if (!existing) return;
  await put(Store.Encounters, {
    ...existing,
    status,
    bridgedTo: bridgedTo ?? existing.bridgedTo,
    updatedAt: Date.now(),
  });
}
