/**
 * Session Indexer — indexes a session into File Search
 * for future retrieval by the tutor.
 */
import { getGeminiClient } from '../gemini';
import { getOrCreateStore } from './store';
import { indexSession } from './indexing';
import type { LiveEntry } from '@/types/entries';

/** Index the current session into File Search. */
export async function indexCurrentSession(
  studentId: string,
  notebookId: string,
  session: { number: number; date: string; topic: string },
  sessionEntries: LiveEntry[],
): Promise<void> {
  if (!getGeminiClient()) return;
  try {
    const store = await getOrCreateStore(studentId);
    await indexSession(store, notebookId, {
      ...session,
      entries: sessionEntries.map((le) => ({
        type: le.entry.type,
        content: 'content' in le.entry ? le.entry.content : undefined,
      })),
    });
  } catch (err) {
    console.error('[Ember] Session indexing error:', err);
  }
}
