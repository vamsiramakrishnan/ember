/**
 * Notebook Branching — fork a new notebook from any entry.
 *
 * When a student wants to rabbit-hole on a specific idea,
 * they can branch: create a new notebook that inherits
 * the current context (entry, thinkers, vocabulary) and
 * starts with the branching entry as its seed.
 */
import { Store, notify } from '@/persistence';
import { createNotebook } from '@/persistence/repositories/notebooks';
import { createSession } from '@/persistence/repositories/sessions';
import { createEntry } from '@/persistence/repositories/entries';
import { getEncountersByNotebook } from '@/persistence/repositories/encounters';
import { getLexiconByNotebook } from '@/persistence/repositories/lexicon';
import { getMasteryByNotebook } from '@/persistence/repositories/mastery';
import { createEncounter } from '@/persistence/repositories/encounters';
import { createLexiconEntry } from '@/persistence/repositories/lexicon';
import { upsertMastery } from '@/persistence/repositories/mastery';
import type { NotebookRecord } from '@/persistence/records';

export interface BranchResult {
  notebook: NotebookRecord;
}

/**
 * Create a new notebook branched from a specific entry.
 * Inherits relevant thinkers, vocabulary, and mastery from the parent.
 */
export async function branchNotebook(params: {
  studentId: string;
  parentNotebookId: string;
  branchTitle: string;
  branchQuestion: string;
  seedContent: string;
}): Promise<BranchResult> {
  const { studentId, parentNotebookId, branchTitle, branchQuestion, seedContent } = params;

  // 1. Create new notebook
  const nb = await createNotebook({
    studentId,
    title: branchTitle,
    description: branchQuestion,
  });
  notify(Store.Notebooks);

  // 2. Create first session
  const session = await createSession({
    studentId,
    notebookId: nb.id,
    number: 1,
    date: new Date().toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long',
    }),
    timeOfDay: getTimeOfDay(),
    topic: branchTitle,
  });
  notify(Store.Sessions);

  // 3. Seed the opening entry (the context from the branch point)
  await createEntry(session.id, {
    type: 'echo',
    content: `Branched from: ${seedContent.slice(0, 200)}${seedContent.length > 200 ? '…' : ''}`,
  });

  // 4. Inherit relevant constellation data from parent notebook
  await inheritConstellation(studentId, parentNotebookId, nb.id);

  notify(Store.Entries);

  return { notebook: nb };
}

async function inheritConstellation(
  studentId: string,
  parentId: string,
  childId: string,
): Promise<void> {
  // Copy thinkers with active/bridged status
  const encounters = await getEncountersByNotebook(parentId);
  for (const e of encounters.filter((enc) => enc.status === 'active' || enc.status === 'bridged')) {
    await createEncounter({
      studentId, notebookId: childId,
      ref: e.ref, thinker: e.thinker, tradition: e.tradition,
      coreIdea: e.coreIdea, sessionTopic: e.sessionTopic,
      date: e.date, status: 'active',
    });
  }
  if (encounters.length > 0) notify(Store.Encounters);

  // Copy vocabulary at developing+ level
  const lexicon = await getLexiconByNotebook(parentId);
  const advanced = lexicon.filter((l) => l.percentage >= 30);
  for (let i = 0; i < advanced.length; i++) {
    const l = advanced[i];
    if (!l) continue;
    await createLexiconEntry({
      studentId, notebookId: childId,
      number: i + 1, term: l.term, pronunciation: l.pronunciation,
      definition: l.definition, level: l.level, percentage: l.percentage,
      etymology: l.etymology, crossReferences: l.crossReferences,
    });
  }
  if (advanced.length > 0) notify(Store.Lexicon);

  // Copy mastery at developing+ level
  const mastery = await getMasteryByNotebook(parentId);
  for (const m of mastery.filter((c) => c.percentage >= 30)) {
    await upsertMastery({
      studentId, notebookId: childId,
      concept: m.concept, level: m.level, percentage: m.percentage,
    });
  }
  if (mastery.length > 0) notify(Store.Mastery);
}

function getTimeOfDay(): string {
  const h = new Date().getHours();
  return h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening';
}
