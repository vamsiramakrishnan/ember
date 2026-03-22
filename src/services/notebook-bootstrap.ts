/**
 * Notebook Bootstrap — seeds a new notebook with AI-researched context.
 *
 * When a student creates a notebook with a title and guiding question,
 * this service:
 * 1. Calls the Bootstrap Agent (with Google Search)
 * 2. Parses the structured response
 * 3. Creates constellation records (mastery, lexicon, encounters, library)
 * 4. Returns an opening tutor entry for the first session
 *
 * Runs async — the notebook is usable immediately, seed data appears
 * as it arrives.
 */
import { BOOTSTRAP_AGENT } from './agents';
import { runTextAgent } from './run-agent';
import { isGeminiAvailable } from './gemini';
import { Store, notify } from '@/persistence';
import { createLexiconEntry } from '@/persistence/repositories/lexicon';
import { createEncounter } from '@/persistence/repositories/encounters';
import { createLibraryEntry } from '@/persistence/repositories/library';
import { upsertMastery, createCuriosity } from '@/persistence/repositories/mastery';

export interface BootstrapResult {
  opening: string | null;
  seeded: boolean;
}

interface BootstrapPayload {
  opening?: string;
  thinkers?: Array<{
    name: string; dates: string; tradition: string;
    coreIdea: string; gift: string; bridge: string;
  }>;
  vocabulary?: Array<{
    term: string; pronunciation: string;
    definition: string; etymology: string;
  }>;
  concepts?: Array<{
    concept: string; level: string; percentage: number;
  }>;
  library?: Array<{
    title: string; author: string; quote: string;
  }>;
  curiosities?: string[];
}

export async function bootstrapNotebook(
  studentId: string,
  notebookId: string,
  title: string,
  guidingQuestion: string,
): Promise<BootstrapResult> {
  if (!isGeminiAvailable()) {
    return { opening: null, seeded: false };
  }

  try {
    const prompt = guidingQuestion
      ? `Notebook: "${title}"\nGuiding question: "${guidingQuestion}"`
      : `Notebook: "${title}"\nNo guiding question — infer the most interesting direction.`;

    const result = await runTextAgent(BOOTSTRAP_AGENT, [{
      role: 'user',
      parts: [{ text: prompt }],
    }]);

    const payload = parseBootstrapResponse(result.text);
    if (!payload) return { opening: null, seeded: false };

    // Seed constellation data in parallel
    await Promise.all([
      seedThinkers(studentId, notebookId, title, payload.thinkers),
      seedVocabulary(studentId, notebookId, payload.vocabulary),
      seedConcepts(studentId, notebookId, payload.concepts),
      seedLibrary(studentId, notebookId, payload.library),
      seedCuriosities(studentId, notebookId, payload.curiosities),
    ]);

    // Notify all stores to trigger reactive updates
    notify(Store.Encounters);
    notify(Store.Lexicon);
    notify(Store.Mastery);
    notify(Store.Library);
    notify(Store.Curiosities);

    return {
      opening: payload.opening ?? null,
      seeded: true,
    };
  } catch (err) {
    console.error('[Ember] Bootstrap error:', err);
    return { opening: null, seeded: false };
  }
}

function parseBootstrapResponse(text: string): BootstrapPayload | null {
  try {
    // Extract JSON from potential markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) ??
                      text.match(/(\{[\s\S]*\})/);
    if (!jsonMatch?.[1]) return null;
    return JSON.parse(jsonMatch[1]) as BootstrapPayload;
  } catch {
    return null;
  }
}

async function seedThinkers(
  studentId: string, notebookId: string, topic: string,
  thinkers?: BootstrapPayload['thinkers'],
): Promise<void> {
  if (!thinkers?.length) return;
  for (let i = 0; i < thinkers.length; i++) {
    const t = thinkers[i];
    if (!t) continue;
    await createEncounter({
      studentId, notebookId,
      ref: `B${i + 1}`,
      thinker: t.name,
      tradition: t.tradition,
      coreIdea: t.coreIdea,
      sessionTopic: topic,
      date: new Date().toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long',
      }),
      status: 'pending',
    });
  }
}

async function seedVocabulary(
  studentId: string, notebookId: string,
  vocab?: BootstrapPayload['vocabulary'],
): Promise<void> {
  if (!vocab?.length) return;
  for (let i = 0; i < vocab.length; i++) {
    const v = vocab[i];
    if (!v) continue;
    await createLexiconEntry({
      studentId, notebookId,
      number: i + 1,
      term: v.term,
      pronunciation: v.pronunciation,
      definition: v.definition,
      level: 'exploring',
      percentage: 5,
      etymology: v.etymology,
      crossReferences: [],
    });
  }
}

async function seedConcepts(
  studentId: string, notebookId: string,
  concepts?: BootstrapPayload['concepts'],
): Promise<void> {
  if (!concepts?.length) return;
  for (const c of concepts) {
    if (!c) continue;
    await upsertMastery({
      studentId, notebookId,
      concept: c.concept,
      level: 'exploring',
      percentage: c.percentage ?? 5,
    });
  }
}

async function seedLibrary(
  studentId: string, notebookId: string,
  lib?: BootstrapPayload['library'],
): Promise<void> {
  if (!lib?.length) return;
  for (const l of lib) {
    if (!l) continue;
    await createLibraryEntry({
      studentId, notebookId,
      title: l.title,
      author: l.author,
      isCurrent: false,
      annotationCount: 0,
      quote: l.quote,
    });
  }
}

async function seedCuriosities(
  studentId: string, notebookId: string,
  curiosities?: string[],
): Promise<void> {
  if (!curiosities?.length) return;
  for (const q of curiosities) {
    if (!q) continue;
    await createCuriosity({ studentId, notebookId, question: q });
  }
}
