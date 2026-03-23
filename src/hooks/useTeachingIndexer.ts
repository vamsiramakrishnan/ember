/**
 * Teaching Content Indexer Hook — async indexes teaching entries
 * (reading material, flashcards, exercises) into the File Search store
 * so the tutor can retrieve them via search_history tool calls.
 */
import { getOrCreateStore, indexTeachingEntry } from '@/services/file-search';
import type { NotebookEntry } from '@/types/entries';

/** Index a teaching entry into File Search. Fire-and-forget. */
export async function indexTeachingContent(
  entry: NotebookEntry,
  studentId: string,
  notebookId: string,
): Promise<void> {
  if (entry.type !== 'reading-material' &&
      entry.type !== 'flashcard-deck' &&
      entry.type !== 'exercise-set') return;

  try {
    const store = await getOrCreateStore(studentId);
    if (!store) return;
    await indexTeachingEntry(store, notebookId, entry);
  } catch {
    // Indexing is non-critical — don't block the UI
  }
}
