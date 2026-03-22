/**
 * Background Task Runner — orchestrates post-response micro-tasks.
 *
 * After the tutor responds, this runner:
 * 1. Assesses which constellation data needs updating (flash-lite, ~50ms)
 * 2. Dispatches targeted extractors in parallel (flash-lite, ~100ms each)
 * 3. Each extractor gets precisely scoped context — no waste
 *
 * Context tiers:
 * - MINIMAL (~50 tokens): assessor, thinker extractor, vocab extractor
 * - FOCUSED (~200 tokens): mastery updater (needs existing mastery state)
 * - FULL (not used here): reserved for tutor/researcher agents
 */
import {
  assessTasks,
  extractThinkers,
  extractVocabulary,
  updateMasteryFromEntry,
} from './background-tasks';
import { getMasteryByNotebook } from '@/persistence/repositories/mastery';
import type { NotebookEntry, LiveEntry } from '@/types/entries';

export async function runBackgroundTasks(
  studentText: string,
  tutorEntries: NotebookEntry[],
  studentId: string,
  notebookId: string,
  sessionTopic: string,
  _allEntries: LiveEntry[],
): Promise<void> {
  // Step 1: Assess what needs updating (MINIMAL context, ~50ms)
  const signals = await assessTasks(studentText, tutorEntries);

  // Step 2: Build the combined text for extractors
  const combinedText = [
    studentText,
    ...tutorEntries
      .filter((e) => 'content' in e)
      .map((e) => ('content' in e ? e.content : '')),
  ].join('\n');

  // Step 3: Dispatch targeted tasks in parallel (only what's needed)
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
    // FOCUSED context: needs existing mastery state
    const mastery = await getMasteryByNotebook(notebookId);
    const masteryStr = mastery.length > 0
      ? mastery.map((m) => `${m.concept}: ${m.level} (${m.percentage}%)`).join('\n')
      : '(no concepts tracked yet)';
    tasks.push(
      updateMasteryFromEntry(studentText, masteryStr, studentId, notebookId)
        .catch((err) => console.error('[Ember] Mastery update:', err)),
    );
  }

  // All tasks run in parallel — each is independent
  if (tasks.length > 0) {
    await Promise.allSettled(tasks);
  }
}
