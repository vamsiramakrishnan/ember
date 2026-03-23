/**
 * collaboration-projector — applies entity projections when new
 * entries flow through the collaboration pipeline.
 *
 * Extracted from useCollaboration to enforce the 150-line file limit.
 * Handles thinker, concept, and curiosity entity creation + graph relations.
 */
import { createRelation } from '@/persistence/repositories/graph';
import { upsertMastery } from '@/persistence/repositories/mastery';
import {
  createEncounter,
  getEncountersByNotebook,
} from '@/persistence/repositories/encounters';
import {
  createCuriosity,
  getCuriositiesByNotebook,
} from '@/persistence/repositories/mastery';
import { projectEntry } from '@/state/entity-projector';
import type { LiveEntry } from '@/types/entries';

interface StudentRecord {
  id: string;
}

interface NotebookRecord {
  id: string;
}

/** Apply entity projections for a single live entry. */
export async function applyEntityProjection(
  le: LiveEntry, student: StudentRecord, notebook: NotebookRecord,
): Promise<void> {
  const commands = projectEntry(le);

  for (const cmd of commands) {
    if (cmd.action !== 'create-entity') continue;

    switch (cmd.kind) {
      case 'thinker': {
        const existing = await getEncountersByNotebook(notebook.id);
        const name = String(cmd.data.name);
        if (existing.some((e) => e.thinker.toLowerCase() === name.toLowerCase())) break;
        const encounter = await createEncounter({
          studentId: student.id,
          notebookId: notebook.id,
          ref: String(existing.length + 1).padStart(3, '0'),
          thinker: name,
          tradition: String(cmd.data.tradition ?? ''),
          coreIdea: String(cmd.data.gift ?? ''),
          sessionTopic: '',
          date: new Date().toLocaleDateString('en-GB', {
            day: 'numeric', month: 'long', year: 'numeric',
          }),
          status: 'active',
        });
        await createRelation({
          notebookId: notebook.id,
          from: cmd.sourceEntryId,
          fromKind: 'entry',
          to: encounter.id,
          toKind: 'thinker',
          type: cmd.relationToSource,
          weight: 1.0,
        });
        break;
      }

      case 'concept': {
        const mastery = await upsertMastery({
          studentId: student.id,
          notebookId: notebook.id,
          concept: String(cmd.data.term),
          level: String(cmd.data.masteryLevel) as 'exploring' | 'developing',
          percentage: Number(cmd.data.mastery),
        });
        await createRelation({
          notebookId: notebook.id,
          from: cmd.sourceEntryId,
          fromKind: 'entry',
          to: mastery.id,
          toKind: 'concept',
          type: cmd.relationToSource,
          weight: 0.8,
        });
        break;
      }

      case 'curiosity': {
        const existing = await getCuriositiesByNotebook(notebook.id);
        const q = String(cmd.data.question);
        if (existing.some((c) => c.question === q)) break;
        const curiosity = await createCuriosity({
          studentId: student.id,
          notebookId: notebook.id,
          question: q,
        });
        await createRelation({
          notebookId: notebook.id,
          from: cmd.sourceEntryId,
          fromKind: 'entry',
          to: curiosity.id,
          toKind: 'curiosity',
          type: cmd.relationToSource,
          weight: 0.6,
        });
        break;
      }
    }
  }
}
