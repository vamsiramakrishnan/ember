/**
 * Seed — populates the database with demo data on first run.
 * Checks if sessions exist; if not, seeds everything.
 * Idempotent — safe to call on every app start.
 */
import { count } from './engine';
import { Store } from './schema';
import { createSession } from './repositories/sessions';
import { createEntries } from './repositories/entries';
import { putBatch } from './engine';
import { createId } from './ids';
import { demoSession, demoSessionMeta } from '@/data/demo-session';
import { demoPastSession, demoPastSessionMeta } from '@/data/demo-past-session';
import { demoLexicon } from '@/data/demo-lexicon';
import { demoEncounters } from '@/data/demo-encounters';
import { demoLibrary } from '@/data/demo-library';
import { demoMastery } from '@/data/demo-mastery';
import { demoCuriosities } from '@/data/demo-curiosities';

export async function seedIfEmpty(): Promise<void> {
  const sessionCount = await count(Store.Sessions);
  if (sessionCount > 0) return;

  const past = await createSession({
    number: demoPastSessionMeta.sessionNumber,
    date: demoPastSessionMeta.date,
    timeOfDay: demoPastSessionMeta.timeOfDay,
    topic: demoPastSessionMeta.topic,
  });
  await createEntries(past.id, demoPastSession);

  const current = await createSession({
    number: demoSessionMeta.sessionNumber,
    date: demoSessionMeta.date,
    timeOfDay: demoSessionMeta.timeOfDay,
    topic: demoSessionMeta.topic,
  });
  await createEntries(current.id, demoSession);

  await seedLexicon();
  await seedEncounters();
  await seedLibrary();
  await seedMastery();
  await seedCuriosities();
}

async function seedLexicon(): Promise<void> {
  const now = Date.now();
  const records = demoLexicon.map((entry, i) => ({
    id: createId(),
    createdAt: now + i,
    updatedAt: now + i,
    ...entry,
  }));
  await putBatch(Store.Lexicon, records);
}

async function seedEncounters(): Promise<void> {
  const now = Date.now();
  const records = demoEncounters.map((enc, i) => ({
    id: createId(),
    createdAt: now + i,
    updatedAt: now + i,
    ...enc,
  }));
  await putBatch(Store.Encounters, records);
}

async function seedLibrary(): Promise<void> {
  const now = Date.now();
  const records = demoLibrary.map((lib, i) => ({
    id: createId(),
    createdAt: now + i,
    updatedAt: now + i,
    ...lib,
  }));
  await putBatch(Store.Library, records);
}

async function seedMastery(): Promise<void> {
  const now = Date.now();
  const records = demoMastery.map((m, i) => ({
    id: createId(),
    createdAt: now + i,
    updatedAt: now + i,
    ...m,
  }));
  await putBatch(Store.Mastery, records);
}

async function seedCuriosities(): Promise<void> {
  const now = Date.now();
  const records = demoCuriosities.map((q, i) => ({
    id: createId(),
    question: q,
    createdAt: now + i,
    updatedAt: now + i,
  }));
  await putBatch(Store.Curiosities, records);
}
