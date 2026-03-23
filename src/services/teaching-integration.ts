/**
 * Teaching Integration — background tasks that connect teaching material
 * to the constellation: auto-add to library, auto-update lexicon.
 *
 * Uses shared utilities: extractContent for entry text, extractJsonArray
 * for parsing, MICRO_AGENT config from agents.
 */
import { Store, notify } from '@/persistence';
import { createLibraryEntry, getLibraryByNotebook } from '@/persistence/repositories/library';
import { createLexiconEntry, getLexiconByNotebook } from '@/persistence/repositories/lexicon';
import { runTextAgent } from './run-agent';
import { extractJsonArray } from './json-parser';
import { extractContent } from './entry-utils';
import { MICRO_AGENT } from './agents';
import type { NotebookEntry } from '@/types/entries';

/** Add a reading-material deck to the student's library. */
export async function addToLibrary(
  entry: NotebookEntry,
  studentId: string,
  notebookId: string,
): Promise<void> {
  if (entry.type !== 'reading-material') return;

  const existing = await getLibraryByNotebook(notebookId);
  const isDuplicate = existing.some((e) =>
    e.title.toLowerCase() === entry.title.toLowerCase(),
  );
  if (isDuplicate) return;

  const contentSlide = entry.slides.find((s) =>
    s.layout !== 'title' && s.layout !== 'summary',
  );
  const quote = contentSlide?.body.slice(0, 120) ?? entry.subtitle ?? '';

  await createLibraryEntry({
    studentId, notebookId,
    title: entry.title, author: 'Ember Tutor',
    isCurrent: true, annotationCount: 0, quote,
  });
  notify(Store.Library);
}

/** Extract new vocabulary terms from teaching material → lexicon. */
export async function extractTermsFromMaterial(
  entry: NotebookEntry,
  studentId: string,
  notebookId: string,
): Promise<void> {
  const bodyText = extractContent(entry);
  if (!bodyText) return;

  const existing = await getLexiconByNotebook(notebookId);
  const known = new Set(existing.map((e) => e.term.toLowerCase()));
  const nextNumber = existing.length + 1;

  try {
    const agent = { ...MICRO_AGENT, systemInstruction: TERM_EXTRACTOR_PROMPT };
    const result = await runTextAgent(agent, [{
      role: 'user',
      parts: [{ text: `Known: ${[...known].join(', ')}\n\nText:\n${bodyText.slice(0, 800)}` }],
    }]);

    const terms = extractJsonArray<{ term: string; definition: string }>(result.text);
    if (!terms) return;

    for (let i = 0; i < Math.min(terms.length, 3); i++) {
      const t = terms[i];
      if (!t || known.has(t.term.toLowerCase())) continue;
      await createLexiconEntry({
        studentId, notebookId,
        number: nextNumber + i,
        term: t.term, definition: t.definition,
        pronunciation: '', etymology: '', crossReferences: [],
        level: 'exploring', percentage: 10,
      });
    }
    notify(Store.Lexicon);
  } catch { /* not critical */ }
}

const TERM_EXTRACTOR_PROMPT = `Extract up to 3 new technical terms from the text.
Skip terms already in the Known list.
Output JSON array: [{"term": "...", "definition": "..."}]
Only output the JSON array, nothing else.`;
