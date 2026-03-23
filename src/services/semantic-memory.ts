/**
 * Semantic Memory Builder — fetches relevant past content from File Search
 * to enrich the tutor's context window.
 *
 * Runs three parallel queries against the student's indexed content:
 * - Notebook history (past sessions relevant to current input)
 * - Vocabulary (terms the student has learned)
 * - Thinker encounters (past thinker connections)
 *
 * Falls back gracefully to null if File Search is unavailable.
 */
import { getOrCreateStore, searchNotebook, searchByType } from '@/services/file-search';
import type { SemanticMemory } from './context-assembler';

/**
 * Build semantic memory by querying File Search for content
 * relevant to the student's current input.
 *
 * @returns SemanticMemory if any results found, null on failure.
 */
export async function buildSemanticMemory(
  studentId: string,
  studentText: string,
  notebookId: string,
): Promise<SemanticMemory | null> {
  try {
    const storeName = await getOrCreateStore(studentId);

    const [historyResult, vocabResult, thinkersResult] = await Promise.all([
      searchNotebook(storeName, studentText, notebookId).catch(() => null),
      searchByType(storeName, studentText, 'lexicon', notebookId).catch(() => null),
      searchByType(storeName, studentText, 'encounters', notebookId).catch(() => null),
    ]);

    const relevantHistory = historyResult?.text?.trim() || null;
    const relevantVocabulary = vocabResult?.text?.trim() || null;
    const relevantThinkers = thinkersResult?.text?.trim() || null;

    // If nothing came back, no point returning an empty memory object
    if (!relevantHistory && !relevantVocabulary && !relevantThinkers) {
      return null;
    }

    const citations: string[] = [
      ...(historyResult?.citations ?? []),
      ...(vocabResult?.citations ?? []),
      ...(thinkersResult?.citations ?? []),
    ];

    return { relevantHistory, relevantVocabulary, relevantThinkers, citations };
  } catch {
    // File Search unavailable — degrade gracefully
    return null;
  }
}
