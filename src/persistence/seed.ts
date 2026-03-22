/**
 * Seed — populates the database with demo data on first run.
 * Creates a demo student, notebook, and sessions.
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
import { demoLexicon } from '@/data/demo-lexicon';
import { demoEncounters } from '@/data/demo-encounters';
import { demoLibrary } from '@/data/demo-library';
import { demoMastery } from '@/data/demo-mastery';
import { demoCuriosities } from '@/data/demo-curiosities';

export async function seedIfEmpty(): Promise<void> {
  const studentCount = await count(Store.Students);
  if (studentCount > 0) return;

  // Seed a demo student
  const student = await createStudent({
    name: 'Arjun',
    displayName: 'Arjun',
  });

  // Create a notebook
  const notebook = await createNotebook({
    studentId: student.id,
    title: 'Music & Mathematics',
    description: 'Why is music mathematical? What did Kepler hear in the orbits?',
  });

  // Past session
  const past = await createSession({
    studentId: student.id,
    notebookId: notebook.id,
    number: demoPastSessionMeta.sessionNumber,
    date: demoPastSessionMeta.date,
    timeOfDay: demoPastSessionMeta.timeOfDay,
    topic: demoPastSessionMeta.topic,
  });
  await createEntries(past.id, demoPastSession);

  // Current session
  const current = await createSession({
    studentId: student.id,
    notebookId: notebook.id,
    number: demoSessionMeta.sessionNumber,
    date: demoSessionMeta.date,
    timeOfDay: demoSessionMeta.timeOfDay,
    topic: demoSessionMeta.topic,
  });
  await createEntries(current.id, demoSession);

  await seedLexicon(student.id);
  await seedEncounters(student.id);
  await seedLibrary(student.id);
  await seedMastery(student.id);
  await seedCuriosities(student.id);
}

async function seedLexicon(studentId: string): Promise<void> {
  const now = Date.now();
  const records = demoLexicon.map((entry, i) => ({
    id: createId(),
    studentId,
    createdAt: now + i,
    updatedAt: now + i,
    ...entry,
  }));
  await putBatch(Store.Lexicon, records);
}

async function seedEncounters(studentId: string): Promise<void> {
  const now = Date.now();
  const records = demoEncounters.map((enc, i) => ({
    id: createId(),
    studentId,
    createdAt: now + i,
    updatedAt: now + i,
    ...enc,
  }));
  await putBatch(Store.Encounters, records);
}

async function seedLibrary(studentId: string): Promise<void> {
  const now = Date.now();
  const records = demoLibrary.map((lib, i) => ({
    id: createId(),
    studentId,
    createdAt: now + i,
    updatedAt: now + i,
    ...lib,
  }));
  await putBatch(Store.Library, records);
}

async function seedMastery(studentId: string): Promise<void> {
  const now = Date.now();
  const records = demoMastery.map((m, i) => ({
    id: createId(),
    studentId,
    concept: m.concept,
    level: m.level,
    percentage: m.percentage,
    createdAt: now + i,
    updatedAt: now + i,
  }));
  await putBatch(Store.Mastery, records);
}

async function seedCuriosities(studentId: string): Promise<void> {
  const now = Date.now();
  const records = demoCuriosities.map((q, i) => ({
    id: createId(),
    studentId,
    question: q,
    createdAt: now + i,
    updatedAt: now + i,
  }));
  await putBatch(Store.Curiosities, records);
}
