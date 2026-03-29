/**
 * Background Task Runner — enqueues post-response work into the
 * centralized TaskQueue instead of fire-and-forget Promises.
 *
 * Each task gets a priority, retry count, timeout, and dedup key.
 * The queue runs them in priority order with controlled concurrency.
 *
 * Priority assignment:
 *   P0 — mastery update, graph relations (correctness)
 *   P1 — thinker extraction, vocab extraction (next-response quality)
 *   P2 — meta-label generation (constellation enrichment)
 *   P3 — inline annotations (cosmetic)
 */
import {
  assessTasks,
  extractThinkers,
  extractVocabulary,
  updateMasteryFromEntry,
} from './background-tasks';
import { annotateRecentEntries } from './inline-annotations';
import { getMasteryByNotebook } from '@/persistence/repositories/mastery';
import { getEncountersByNotebook } from '@/persistence/repositories/encounters';
import { getLexiconByNotebook } from '@/persistence/repositories/lexicon';
import { createRelation } from '@/persistence/repositories/graph';
import { setBackgroundResults } from './background-results';
import { enqueueForLabeling } from './entry-meta-labels';
import { enqueueTasks, PRIORITY, type TaskDescriptor } from './task-queue';
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
  // Step 1: Assess what needs updating (fast, ~50ms, always awaited)
  const signals = await assessTasks(studentText, tutorEntries);

  const combinedText = [
    studentText,
    ...tutorEntries
      .filter((e) => 'content' in e)
      .map((e) => ('content' in e ? e.content : '')),
  ].join('\n');

  const studentEntry = allEntries.length > 0 ? allEntries[allEntries.length - 1] : null;
  const tutorEntry = allEntries.length > 1
    ? [...allEntries].reverse().find((e) => e.entry.type.startsWith('tutor-'))
    : null;
  const tutorText = tutorEntries
    .filter((e) => 'content' in e)
    .map((e) => ('content' in e ? e.content : ''))
    .join(' ');

  // Step 2: Build task descriptors based on assessment
  const tasks: TaskDescriptor[] = [];

  // ─── P0: Correctness ──────────────────────────────────────

  if (signals.updateMastery) {
    tasks.push({
      key: `mastery:${notebookId}:${Date.now()}`,
      label: 'updating mastery',
      priority: PRIORITY.CRITICAL,
      retries: 1,
      timeoutMs: 15_000,
      group: 'post-response',
      run: async () => {
        const mastery = await getMasteryByNotebook(notebookId);
        const masteryStr = mastery.length > 0
          ? mastery.map((m) => `${m.concept}: ${m.level} (${m.percentage}%)`).join('\n')
          : '(no concepts tracked yet)';
        const masteryBefore = new Map(mastery.map((m) => [m.concept, m.percentage]));
        const count = await updateMasteryFromEntry(studentText, masteryStr, studentId, notebookId);
        if (count > 0) {
          const after = await getMasteryByNotebook(notebookId);
          const changes = after
            .filter((m) => masteryBefore.has(m.concept) && masteryBefore.get(m.concept) !== m.percentage)
            .map((m) => ({ concept: m.concept, from: masteryBefore.get(m.concept) ?? 0, to: m.percentage }));
          if (changes.length > 0) setBackgroundResults({ masteryChanges: changes });
        }
      },
    });
  }

  if (studentEntry && tutorEntry) {
    tasks.push({
      key: `relation:${tutorEntry.id}:${studentEntry.id}`,
      label: 'linking entries',
      priority: PRIORITY.CRITICAL,
      retries: 1,
      timeoutMs: 5_000,
      group: 'post-response',
      run: async () => {
        await createRelation({
          notebookId,
          from: tutorEntry.id,
          fromKind: 'entry',
          to: studentEntry.id,
          toKind: 'entry',
          type: 'prompted-by',
          weight: 1.0,
        });
      },
    });
  }

  // ─── P1: Next-response quality ────────────────────────────

  if (signals.updateThinkers) {
    tasks.push({
      key: `thinkers:${notebookId}:${Date.now()}`,
      label: 'extracting thinkers',
      priority: PRIORITY.HIGH,
      retries: 0,
      timeoutMs: 20_000,
      group: 'post-response',
      run: async () => {
        const before = await getEncountersByNotebook(notebookId);
        const beforeNames = new Set(before.map((e) => e.thinker));
        const added = await extractThinkers(combinedText, studentId, notebookId, sessionTopic);
        if (added > 0) {
          const after = await getEncountersByNotebook(notebookId);
          const newNames = after.map((e) => e.thinker).filter((n) => !beforeNames.has(n));
          setBackgroundResults({ newThinkers: newNames });
        }
      },
    });
  }

  if (signals.updateVocabulary) {
    tasks.push({
      key: `vocab:${notebookId}:${Date.now()}`,
      label: 'extracting vocabulary',
      priority: PRIORITY.HIGH,
      retries: 0,
      timeoutMs: 20_000,
      group: 'post-response',
      run: async () => {
        const before = await getLexiconByNotebook(notebookId);
        const beforeTerms = new Set(before.map((e) => e.term));
        const added = await extractVocabulary(combinedText, studentId, notebookId);
        if (added > 0) {
          const after = await getLexiconByNotebook(notebookId);
          const newTerms = after.map((e) => e.term).filter((t) => !beforeTerms.has(t));
          setBackgroundResults({ newTerms });
        }
      },
    });
  }

  // ─── P2: Enrichment ───────────────────────────────────────

  // Meta-labels are debounce-queued internally, just trigger them
  for (const le of allEntries.slice(-4)) {
    const content = 'content' in le.entry ? le.entry.content : '';
    if (content) enqueueForLabeling(le.id, content);
  }

  // ─── P3: Cosmetic ─────────────────────────────────────────

  if (studentEntry && studentText.trim()) {
    tasks.push({
      key: `annotate:${studentEntry.id}`,
      label: 'writing annotations',
      priority: PRIORITY.LOW,
      retries: 0,
      timeoutMs: 15_000,
      group: 'post-response',
      run: async () => {
        await annotateRecentEntries(
          studentEntry.id,
          studentText,
          tutorEntry?.id ?? null,
          tutorText,
          notebookTitle ?? sessionTopic,
        );
      },
    });
  }

  // Step 3: Enqueue all tasks — the queue handles ordering, concurrency, retries
  if (tasks.length > 0) {
    enqueueTasks(tasks);
  }
}
