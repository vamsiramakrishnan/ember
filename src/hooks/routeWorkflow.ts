/** routeWorkflow — multi-step learning arc orchestration.
 * Each workflow chains 2–3 atomic commands into a single learning flow.
 * Called from useSlashCommandRouter when the command is a workflow type. */
import { generateReadingMaterial } from '@/services/reading-material-gen';
import { generateFlashcards } from '@/services/flashcard-gen';
import { generateExercises } from '@/services/exercise-gen';
import { generateIllustration } from '@/services/enrichment';
import { addToLibrary, extractTermsFromMaterial } from '@/services/teaching-integration';
import { indexTeachingContent } from './useTeachingIndexer';
import { resolveCommandContext } from '@/services/command-context';
import type { NotebookEntry, LiveEntry } from '@/types/entries';

export interface WorkflowDeps {
  addEntryWithId: (entry: NotebookEntry) => string | Promise<string>;
  patchEntryContent: (id: string, entry: NotebookEntry) => void;
  respond: (entry: NotebookEntry) => void;
  research: (query: string, prompt: string) => Promise<string | null>;
  entries: () => LiveEntry[];
  studentId?: string;
  notebookId?: string;
}

async function show(label: string, d: WorkflowDeps, work: () => Promise<NotebookEntry | null>) {
  const id = await d.addEntryWithId({ type: 'silence', text: `${label}\u2026` });
  const r = await work();
  d.patchEntryContent(id, r ?? { type: 'tutor-marginalia', content: 'That didn\u2019t work \u2014 try again.' });
}

async function ask(prefix: string, q: string, cmd: string, tier: 0 | 1 | 2, d: WorkflowDeps) {
  const ctx = await resolveCommandContext(q, d.entries(), tier, cmd, d.notebookId);
  d.respond({ type: 'question', content: `${prefix} ${q}${ctx.formatted ? `\n\n${ctx.formatted}` : ''}` });
}

function idx(entry: NotebookEntry, d: WorkflowDeps, terms = false) {
  if (!d.studentId || !d.notebookId) return;
  if (terms) extractTermsFromMaterial(entry, d.studentId, d.notebookId).catch(() => {});
  indexTeachingContent(entry, d.studentId, d.notebookId).catch(() => {});
}

/** /delve — research → explain → visualize */
export async function routeDelve(q: string, ctx: string, d: WorkflowDeps) {
  await show('researching', d, async () => {
    const r = await d.research(q, ctx ? `${ctx}\n\nResearch query: ${q}` : q);
    return r ? { type: 'tutor-marginalia', content: r } : null;
  });
  await ask('Explain in depth:', q, 'explain', 2, d);
  await ask('Visualize this concept:', q, 'visualize', 1, d);
}

/** /study — flashcards → exercises → quiz */
export async function routeStudy(q: string, ctx: string, d: WorkflowDeps) {
  await show('creating flashcards', d, async () => {
    const fc = await generateFlashcards(q, d.entries(), ctx || undefined);
    if (fc) idx(fc, d, true);
    return fc;
  });
  await show('designing exercises', d, async () => {
    const ex = await generateExercises(q, d.entries(), ctx || undefined);
    if (ex) idx(ex, d);
    return ex;
  });
  await ask('Quiz me on my understanding of:', q, 'quiz', 2, d);
}

/** /lesson — teach → exercises → quiz */
export async function routeLesson(q: string, ctx: string, d: WorkflowDeps) {
  await show('preparing reading material', d, async () => {
    const deck = await generateReadingMaterial(q, d.entries(), ctx || undefined);
    if (deck && d.studentId && d.notebookId) {
      addToLibrary(deck, d.studentId, d.notebookId).catch(() => {});
      idx(deck, d, true);
    }
    return deck;
  });
  await show('designing exercises', d, async () => {
    const ex = await generateExercises(q, d.entries(), ctx || undefined);
    if (ex) idx(ex, d);
    return ex;
  });
  await ask('Quiz me on my understanding of:', q, 'quiz', 2, d);
}

/** /review — summarize → flashcards (post-session consolidation) */
export async function routeReview(q: string, ctx: string, d: WorkflowDeps) {
  await ask('Summarize our exploration so far, focusing on:', q || 'the main ideas', 'summarize', 2, d);
  await show('creating flashcards', d, async () => {
    const fc = await generateFlashcards(q || 'key concepts from this session', d.entries(), ctx || undefined);
    if (fc) idx(fc, d, true);
    return fc;
  });
}

/** /compare — research → connect → visualize (comparative understanding) */
export async function routeCompare(q: string, ctx: string, d: WorkflowDeps) {
  await show('researching', d, async () => {
    const prompt = ctx ? `${ctx}\n\nCompare and contrast: ${q}` : `Compare and contrast: ${q}`;
    const r = await d.research(q, prompt);
    return r ? { type: 'tutor-marginalia', content: r } : null;
  });
  await ask('Show how these ideas connect:', q, 'connect', 2, d);
  await ask('Visualize the relationships between:', q, 'visualize', 1, d);
}

/** /origins — timeline → research → teach (intellectual history) */
export async function routeOrigins(q: string, ctx: string, d: WorkflowDeps) {
  await ask('Create a timeline visualization:', q, 'timeline', 1, d);
  await show('researching history', d, async () => {
    const prompt = ctx
      ? `${ctx}\n\nTrace the intellectual history and key thinkers behind: ${q}`
      : `Trace the intellectual history and key thinkers behind: ${q}`;
    const r = await d.research(q, prompt);
    return r ? { type: 'tutor-marginalia', content: r } : null;
  });
  await show('preparing reading material', d, async () => {
    const deck = await generateReadingMaterial(
      `The intellectual origins of ${q}`, d.entries(), ctx || undefined,
    );
    if (deck && d.studentId && d.notebookId) {
      addToLibrary(deck, d.studentId, d.notebookId).catch(() => {});
      idx(deck, d, true);
    }
    return deck;
  });
}

/** /illustrate — explain → draw → define (multi-modal understanding) */
export async function routeIllustrate(q: string, ctx: string, d: WorkflowDeps) {
  await ask('Explain in depth:', q, 'explain', 2, d);
  await show('sketching', d, () => generateIllustration(q, d.entries(), ctx || undefined));
  await ask('Define and add to my lexicon:', q, 'define', 2, d);
}
