/**
 * Background Task Runner — orchestrates post-response micro-tasks.
 *
 * After the tutor responds, this runner:
 * 1. Assesses which constellation data needs updating (flash-lite, ~50ms)
 * 2. Dispatches targeted extractors in parallel (flash-lite, ~100ms each)
 * 3. Runs inline annotation agent on student + tutor entries
 *
 * Context tiers:
 * - MINIMAL (~50 tokens): assessor, thinker extractor, vocab extractor
 * - FOCUSED (~200 tokens): mastery updater, inline annotator
 * - FULL (~800 tokens): tutor/researcher agents (not used here)
 */
import {
  assessTasks,
  extractThinkers,
  extractVocabulary,
  updateMasteryFromEntry,
} from './background-tasks';
import { annotateRecentEntries } from './inline-annotations';
import { getMasteryByNotebook } from '@/persistence/repositories/mastery';
import type { NotebookEntry, LiveEntry } from '@/types/entries';

export async function runBackgroundTasks(
  studentText: string,
  tutorEntries: NotebookEntry[],
  studentId: string,
  notebookId: string,
  sessionTopic: string,
  allEntries: LiveEntry[],
  notebookTitle?: string,
): Promise<void> {
  // Step 1: Assess what needs updating (MINIMAL context, ~50ms)
  const signals = await assessTasks(studentText, tutorEntries);

  const combinedText = [
    studentText,
    ...tutorEntries
      .filter((e) => 'content' in e)
      .map((e) => ('content' in e ? e.content : '')),
  ].join('\n');

  // Step 2: Dispatch all tasks in parallel
  const tasks: Promise<unknown>[] = [];

  if (signals.updateThinkers) {
    tasks.push(
      extractThinkers(combinedText, studentId, notebookId, sessionTopic)
        .catch((err) => console.error('[Ember] Thinker extraction:', err)),
    );
  }

  if (signals.updateVocabulary) {
    tasks.push(
      extractVocabulary(combinedText, studentId, notebookId)
        .catch((err) => console.error('[Ember] Vocab extraction:', err)),
    );
  }

  if (signals.updateMastery) {
    const mastery = await getMasteryByNotebook(notebookId);
    const masteryStr = mastery.length > 0
      ? mastery.map((m) => `${m.concept}: ${m.level} (${m.percentage}%)`).join('\n')
      : '(no concepts tracked yet)';
    tasks.push(
      updateMasteryFromEntry(studentText, masteryStr, studentId, notebookId)
        .catch((err) => console.error('[Ember] Mastery update:', err)),
    );
  }

  // Step 3: Inline annotations (Easter eggs, trivia, follow-up questions)
  // Find the student's latest entry ID and tutor's latest entry ID
  const studentEntry = allEntries.length > 0 ? allEntries[allEntries.length - 1] : null;
  const tutorText = tutorEntries
    .filter((e) => 'content' in e)
    .map((e) => ('content' in e ? e.content : ''))
    .join(' ');

  if (studentEntry && studentText.trim()) {
    // Find the tutor's entry (the one just before the latest student entry, from the end)
    const tutorEntry = allEntries.length > 1
      ? [...allEntries].reverse().find((e) => e.entry.type.startsWith('tutor-'))
      : null;

    tasks.push(
      annotateRecentEntries(
        studentEntry.id,
        studentText,
        tutorEntry?.id ?? null,
        tutorText,
        notebookTitle ?? sessionTopic,
      ).catch((err) => console.error('[Ember] Annotation:', err)),
    );
  }

  if (tasks.length > 0) {
    await Promise.allSettled(tasks);
  }
}
