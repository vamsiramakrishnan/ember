/** routeWorkflow — multi-step learning arc orchestration.
 * Each workflow chains 2–3 atomic commands into a single learning flow.
 * Called from useSlashCommandRouter when the command is a workflow type. */
import { generateReadingMaterial } from '@/services/reading-material-gen';
import { generateFlashcards } from '@/services/flashcard-gen';
import { generateExercises } from '@/services/exercise-gen';
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

/** Processing placeholder that swaps with the result. */
async function withIndicator(
  label: string, deps: WorkflowDeps,
  work: () => Promise<NotebookEntry | null>,
): Promise<void> {
  const id = await deps.addEntryWithId({ type: 'silence', text: `${label}\u2026` });
  const result = await work();
  deps.patchEntryContent(id, result ?? {
    type: 'tutor-marginalia',
    content: 'That didn\u2019t work \u2014 try again with a more specific prompt.',
  });
}

/** /delve — research, explain, then visualize */
export async function routeDelve(
  q: string, ctxBlock: string, deps: WorkflowDeps,
): Promise<void> {
  await withIndicator('researching', deps, async () => {
    const prompt = ctxBlock ? `${ctxBlock}\n\nResearch query: ${q}` : q;
    const r = await deps.research(q, prompt);
    return r ? { type: 'tutor-marginalia', content: r } : null;
  });
  const eCtx = await resolveCommandContext(q, deps.entries(), 2, 'explain', deps.notebookId);
  deps.respond({ type: 'question', content: `Explain in depth: ${q}${eCtx.formatted ? `\n\n${eCtx.formatted}` : ''}` });
  const vCtx = await resolveCommandContext(q, deps.entries(), 1, 'visualize', deps.notebookId);
  deps.respond({ type: 'question', content: `Visualize this concept: ${q}${vCtx.formatted ? `\n\n${vCtx.formatted}` : ''}` });
}

/** /study — flashcards, exercises, then quiz */
export async function routeStudy(
  q: string, ctxBlock: string, deps: WorkflowDeps,
): Promise<void> {
  await withIndicator('creating flashcards', deps, async () => {
    const fc = await generateFlashcards(q, deps.entries(), ctxBlock || undefined);
    if (fc && deps.studentId && deps.notebookId) {
      extractTermsFromMaterial(fc, deps.studentId, deps.notebookId).catch(() => {});
      indexTeachingContent(fc, deps.studentId, deps.notebookId).catch(() => {});
    }
    return fc;
  });
  const exCtx = await resolveCommandContext(q, deps.entries(), 2, 'exercise', deps.notebookId);
  await withIndicator('designing exercises', deps, async () => {
    const ex = await generateExercises(q, deps.entries(), exCtx.formatted || undefined);
    if (ex && deps.studentId && deps.notebookId) {
      indexTeachingContent(ex, deps.studentId, deps.notebookId).catch(() => {});
    }
    return ex;
  });
  const qCtx = await resolveCommandContext(q, deps.entries(), 2, 'quiz', deps.notebookId);
  deps.respond({ type: 'question', content: `Quiz me on my understanding of: ${q}${qCtx.formatted ? `\n\n${qCtx.formatted}` : ''}` });
}

/** /lesson — teach, exercises, then quiz */
export async function routeLesson(
  q: string, ctxBlock: string, deps: WorkflowDeps,
): Promise<void> {
  await withIndicator('preparing reading material', deps, async () => {
    const deck = await generateReadingMaterial(q, deps.entries(), ctxBlock || undefined);
    if (deck && deps.studentId && deps.notebookId) {
      addToLibrary(deck, deps.studentId, deps.notebookId).catch(() => {});
      extractTermsFromMaterial(deck, deps.studentId, deps.notebookId).catch(() => {});
      indexTeachingContent(deck, deps.studentId, deps.notebookId).catch(() => {});
    }
    return deck;
  });
  const exCtx = await resolveCommandContext(q, deps.entries(), 2, 'exercise', deps.notebookId);
  await withIndicator('designing exercises', deps, async () => {
    const ex = await generateExercises(q, deps.entries(), exCtx.formatted || undefined);
    if (ex && deps.studentId && deps.notebookId) {
      indexTeachingContent(ex, deps.studentId, deps.notebookId).catch(() => {});
    }
    return ex;
  });
  const qCtx = await resolveCommandContext(q, deps.entries(), 2, 'quiz', deps.notebookId);
  deps.respond({ type: 'question', content: `Quiz me on my understanding of: ${q}${qCtx.formatted ? `\n\n${qCtx.formatted}` : ''}` });
}
