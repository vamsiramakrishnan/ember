/**
 * Seed — populates the database with demo data on first run.
 * Creates a demo student with four diverse notebooks, each with
 * its own notebook-scoped constellation data.
 * Idempotent — safe to call on every app start.
 */
import { count } from './engine';
import { Store } from './schema';
import { createStudent } from './repositories/students';
import { createNotebook } from './repositories/notebooks';
import { createSession } from './repositories/sessions';
import { createEntries } from './repositories/entries';
import { putBatch } from './engine';
import { createId } from './ids';
import { demoSession, demoSessionMeta } from '@/data/demo-session';
import { demoPastSession, demoPastSessionMeta } from '@/data/demo-past-session';
import {
  demoEvolutionSession, demoEvolutionMeta, demoEvolutionNotebook,
} from '@/data/demo-evolution';
import {
  demoLanguageSession, demoLanguageMeta, demoLanguageNotebook,
} from '@/data/demo-language';
import {
  demoConsciousnessSession, demoConsciousnessMeta, demoConsciousnessNotebook,
} from '@/data/demo-consciousness';
import { demoLexicon } from '@/data/demo-lexicon';
import { demoEncounters } from '@/data/demo-encounters';
import { demoLibrary } from '@/data/demo-library';
import { demoMastery } from '@/data/demo-mastery';
import { demoCuriosities } from '@/data/demo-curiosities';
import type { NotebookEntry } from '@/types/entries';

export async function seedIfEmpty(): Promise<void> {
  const studentCount = await count(Store.Students);
  if (studentCount > 0) return;

  const student = await createStudent({
    name: 'Arjun',
    displayName: 'Arjun',
  });

  // Notebook 1: Music & Mathematics (original demo — with constellation data)
  const musicNb = await seedMusicNotebook(student.id);
  await seedConstellation(student.id, musicNb);

  // Notebook 2: Darwin & Evolution
  await seedSimpleNotebook(
    student.id, demoEvolutionNotebook,
    demoEvolutionSession, demoEvolutionMeta,
  );

  // Notebook 3: Language & Etymology
  await seedSimpleNotebook(
    student.id, demoLanguageNotebook,
    demoLanguageSession, demoLanguageMeta,
  );

  // Notebook 4: Consciousness
  await seedSimpleNotebook(
    student.id, demoConsciousnessNotebook,
    demoConsciousnessSession, demoConsciousnessMeta,
  );
}

async function seedMusicNotebook(studentId: string): Promise<string> {
  const notebook = await createNotebook({
    studentId,
    title: 'Music & Mathematics',
    description: 'Why is music mathematical? What did Kepler hear in the orbits?',
  });

  const past = await createSession({
    studentId,
    notebookId: notebook.id,
    number: demoPastSessionMeta.sessionNumber,
    date: demoPastSessionMeta.date,
    timeOfDay: demoPastSessionMeta.timeOfDay,
    topic: demoPastSessionMeta.topic,
  });
  await createEntries(past.id, demoPastSession);

  const current = await createSession({
    studentId,
    notebookId: notebook.id,
    number: demoSessionMeta.sessionNumber,
    date: demoSessionMeta.date,
    timeOfDay: demoSessionMeta.timeOfDay,
    topic: demoSessionMeta.topic,
  });
  await createEntries(current.id, demoSession);

  return notebook.id;
}

async function seedSimpleNotebook(
  studentId: string,
  meta: { title: string; description: string },
  entries: NotebookEntry[],
  sessionMeta: { sessionNumber: number; date: string; timeOfDay: string; topic: string },
): Promise<void> {
  const notebook = await createNotebook({
    studentId,
    title: meta.title,
    description: meta.description,
  });

  const session = await createSession({
    studentId,
    notebookId: notebook.id,
    number: sessionMeta.sessionNumber,
    date: sessionMeta.date,
    timeOfDay: sessionMeta.timeOfDay,
    topic: sessionMeta.topic,
  });
  await createEntries(session.id, entries);
}

/** Seed constellation data for the Music & Mathematics notebook. */
async function seedConstellation(
  studentId: string,
  notebookId: string,
): Promise<void> {
  const now = Date.now();

  // Lexicon
  const lexiconRecords = demoLexicon.map((entry, i) => ({
    id: createId(),
    studentId,
    notebookId,
    createdAt: now + i,
    updatedAt: now + i,
    ...entry,
  }));
  await putBatch(Store.Lexicon, lexiconRecords);

  // Encounters
  const encounterRecords = demoEncounters.map((enc, i) => ({
    id: createId(),
    studentId,
    notebookId,
    createdAt: now + i,
    updatedAt: now + i,
    ...enc,
  }));
  await putBatch(Store.Encounters, encounterRecords);

  // Library
  const libraryRecords = demoLibrary.map((lib, i) => ({
    id: createId(),
    studentId,
    notebookId,
    createdAt: now + i,
    updatedAt: now + i,
    ...lib,
  }));
  await putBatch(Store.Library, libraryRecords);

  // Mastery
  const masteryRecords = demoMastery.map((m, i) => ({
    id: createId(),
    studentId,
    notebookId,
    concept: m.concept,
    level: m.level,
    percentage: m.percentage,
    createdAt: now + i,
    updatedAt: now + i,
  }));
  await putBatch(Store.Mastery, masteryRecords);

  // Curiosities
  const curiosityRecords = demoCuriosities.map((q, i) => ({
    id: createId(),
    studentId,
    notebookId,
    question: q,
    createdAt: now + i,
    updatedAt: now + i,
  }));
  await putBatch(Store.Curiosities, curiosityRecords);
}
