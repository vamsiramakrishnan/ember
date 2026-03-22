/**
 * Lexicon Repository — personal vocabulary persistence.
 * The student's growing dictionary of terms they've internalized.
 * Constellation → Lexicon sub-view.
 */
import { Store } from '../schema';
import { get, getAll, put, getByIndex, del } from '../engine';
import { createId } from '../ids';
import type { LexiconRecord } from '../records';
import type { MasteryLevel } from '@/types/mastery';

export async function createLexiconEntry(params: {
  studentId: string;
  number: number;
  term: string;
  pronunciation: string;
  definition: string;
  level: MasteryLevel;
  percentage: number;
  etymology: string;
  crossReferences: string[];
}): Promise<LexiconRecord> {
  const now = Date.now();
  const record: LexiconRecord = {
    id: createId(),
    createdAt: now,
    updatedAt: now,
    ...params,
  };
  await put(Store.Lexicon, record);
  return record;
}

export async function getLexiconEntry(
  id: string,
): Promise<LexiconRecord | undefined> {
  return get<LexiconRecord>(Store.Lexicon, id);
}

export async function getLexiconByTerm(
  term: string,
): Promise<LexiconRecord | undefined> {
  const results = await getByIndex<LexiconRecord>(
    Store.Lexicon, 'by-term', term,
  );
  return results[0];
}

export async function getAllLexicon(): Promise<LexiconRecord[]> {
  const records = await getAll<LexiconRecord>(Store.Lexicon);
  return records.sort((a, b) => a.number - b.number);
}

export async function getLexiconByLevel(
  level: MasteryLevel,
): Promise<LexiconRecord[]> {
  return getByIndex<LexiconRecord>(Store.Lexicon, 'by-level', level);
}

export async function updateLexiconEntry(
  id: string,
  updates: Partial<
    Pick<LexiconRecord, 'definition' | 'level' | 'percentage' | 'crossReferences'>
  >,
): Promise<void> {
  const existing = await get<LexiconRecord>(Store.Lexicon, id);
  if (!existing) return;
  await put(Store.Lexicon, { ...existing, ...updates, updatedAt: Date.now() });
}

export async function deleteLexiconEntry(id: string): Promise<void> {
  return del(Store.Lexicon, id);
}
