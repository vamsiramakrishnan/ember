/**
 * Deferred Action Executor — actually persists the write-side actions
 * that the tutor agent requested via tool calls.
 *
 * Previously these were logged to console but never executed.
 * Now: create_annotation → adds to entry's annotations array,
 *      add_to_lexicon → creates a lexicon record in constellation.
 */
import { Store, notify } from '@/persistence';
import { getEntry, updateEntry } from '@/persistence/repositories/entries';
import { createLexiconEntry, getLexiconByNotebook } from '@/persistence/repositories/lexicon';
import { createRelation } from '@/persistence/repositories/graph';
import { createId } from '@/persistence/ids';
import type { DeferredAction } from './tool-executor';
import type { GraphDeferredAction } from './graph-tools';
import type { EntryAnnotation } from '@/types/entries';

/** Execute a single deferred action, persisting it to the database. */
export async function executeDeferredAction(
  action: DeferredAction | GraphDeferredAction,
  studentId: string,
  notebookId: string,
): Promise<void> {
  if (!('type' in action)) return;

  switch (action.type) {
    case 'annotate':
      await executeAnnotation(action.args, studentId);
      break;
    case 'add_lexicon':
      await executeLexiconAdd(action.args, studentId, notebookId);
      break;
    case 'link_entities': {
      const { executeGraphDeferred } = await import('./graph-tools');
      await executeGraphDeferred({ ...action, notebookId });
      break;
    }
  }
}

/** Execute all deferred actions from an orchestrator result. */
export async function executeAllDeferred(
  actions: Array<DeferredAction | GraphDeferredAction>,
  studentId: string,
  notebookId: string,
): Promise<void> {
  for (const action of actions) {
    try {
      await executeDeferredAction(action, studentId, notebookId);
    } catch (err) {
      console.error('[Ember] Deferred action failed:', err);
    }
  }
}

async function executeAnnotation(
  args: Record<string, unknown>,
  studentId: string,
): Promise<void> {
  const entryId = String(args.entry_id ?? '');
  const content = String(args.content ?? '');
  if (!entryId || !content) return;

  const entry = await getEntry(entryId);
  if (!entry) return;

  const annotation: EntryAnnotation = {
    id: createId(),
    author: 'tutor',
    content,
    timestamp: Date.now(),
    kind: (args.kind as EntryAnnotation['kind']) ?? 'insight',
  };

  const existing = entry.annotations ?? [];
  await updateEntry(entryId, { annotations: [...existing, annotation] });
  notify(Store.Entries);

  // Also create a graph relation: annotation → source entry
  if (args.source_entry_id) {
    await createRelation({
      notebookId: entry.sessionId ?? studentId,
      from: entryId,
      fromKind: 'entry',
      to: String(args.source_entry_id),
      toKind: 'entry',
      type: 'annotates',
      weight: 0.5,
    }).catch(() => {});
  }
}

async function executeLexiconAdd(
  args: Record<string, unknown>,
  studentId: string,
  notebookId: string,
): Promise<void> {
  const term = String(args.term ?? '');
  const definition = String(args.definition ?? '');
  if (!term || !definition) return;

  const existing = await getLexiconByNotebook(notebookId);
  const isDuplicate = existing.some(
    (e) => e.term.toLowerCase() === term.toLowerCase(),
  );
  if (isDuplicate) return;

  await createLexiconEntry({
    studentId, notebookId,
    number: existing.length + 1,
    term, definition,
    pronunciation: String(args.pronunciation ?? ''),
    etymology: String(args.etymology ?? ''),
    crossReferences: Array.isArray(args.crossReferences)
      ? args.crossReferences.map(String) : [],
    level: 'exploring', percentage: 10,
  });
  notify(Store.Lexicon);
}
