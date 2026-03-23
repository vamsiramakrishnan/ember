/**
 * Teaching Integration — background tasks that connect teaching material
 * to the constellation: auto-add to library, auto-update lexicon,
 * and extract mastery signals from flashcard/exercise interactions.
 *
 * Called after a reading-material, flashcard-deck, or exercise-set
 * entry is created.
 */
import { Store, notify } from '@/persistence';
import { createLibraryEntry, getLibraryByNotebook } from '@/persistence/repositories/library';
import { createLexiconEntry, getLexiconByNotebook } from '@/persistence/repositories/lexicon';
import { runTextAgent } from './run-agent';
import type { AgentConfig } from './agents';
import type { NotebookEntry, ReadingSlide } from '@/types/entries';

const MICRO: AgentConfig = {
  name: 'TeachingIntegration',
  model: 'gemini-3.1-flash-lite-preview',
  systemInstruction: '',
  thinkingLevel: 'MINIMAL',
  tools: [],
  responseModalities: ['TEXT'],
};

/** Add a reading-material deck to the student's library as a primary text. */
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

  // Extract a representative quote from the first content slide
  const contentSlide = entry.slides.find((s: ReadingSlide) =>
    s.layout !== 'title' && s.layout !== 'summary',
  );
  const quote = contentSlide?.body.slice(0, 120) ?? entry.subtitle ?? '';

  await createLibraryEntry({
    studentId,
    notebookId,
    title: entry.title,
    author: 'Ember Tutor',
    isCurrent: true,
    annotationCount: 0,
    quote,
  });
  notify(Store.Library);
}

/** Extract new vocabulary terms from teaching material and add to lexicon. */
export async function extractTermsFromMaterial(
  entry: NotebookEntry,
  studentId: string,
  notebookId: string,
): Promise<void> {
  let bodyText = '';
  if (entry.type === 'reading-material') {
    bodyText = entry.slides.map((s: ReadingSlide) => `${s.heading}\n${s.body}`).join('\n\n');
  } else if (entry.type === 'flashcard-deck') {
    bodyText = entry.cards.map((c) => `${c.front}\n${c.back}`).join('\n\n');
  } else {
    return;
  }

  const existing = await getLexiconByNotebook(notebookId);
  const known = new Set(existing.map((e) => e.term.toLowerCase()));
  const nextNumber = existing.length + 1;

  try {
    const agent = { ...MICRO, systemInstruction: TERM_EXTRACTOR_PROMPT };
    const result = await runTextAgent(agent, [{
      role: 'user',
      parts: [{ text: `Known: ${[...known].join(', ')}\n\nText:\n${bodyText.slice(0, 800)}` }],
    }]);

    let raw = result.text.trim();
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
    const terms = JSON.parse(raw) as Array<{ term: string; definition: string }>;

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
