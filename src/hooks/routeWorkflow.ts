/** routeWorkflow — multi-step learning arcs with progress + result threading. */
import { generateReadingMaterial } from '@/services/reading-material-gen';
import { generateFlashcards } from '@/services/flashcard-gen';
import { generateExercises } from '@/services/exercise-gen';
import { generateIllustration } from '@/services/enrichment';
import { addToLibrary, extractTermsFromMaterial } from '@/services/teaching-integration';
import { indexTeachingContent } from './useTeachingIndexer';
import { resolveCommandContext } from '@/services/command-context';
import { setActivityDetail } from '@/state';
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
const s = (l: string, i: number, n: number) => setActivityDetail(
  { step: 'enriching', label: `${l}\u2026`, iteration: i, maxIterations: n });

async function show(label: string, d: WorkflowDeps, work: () => Promise<NotebookEntry | null>) {
  const id = await d.addEntryWithId({ type: 'silence', text: `${label}\u2026` });
  const r = await work();
  d.patchEntryContent(id, r ?? { type: 'tutor-marginalia', content: 'That didn\u2019t work \u2014 try again.' });
  return r;
}
async function ask(prefix: string, q: string, cmd: string, tier: 0 | 1 | 2, d: WorkflowDeps, prior?: string) {
  const ctx = await resolveCommandContext(q, d.entries(), tier, cmd, d.notebookId);
  const base = `${prefix} ${q}`;
  const threaded = prior ? `${base}\n\nPrior step produced:\n${prior.slice(0, 2000)}` : base;
  d.respond({ type: 'question', content: ctx.formatted ? `${threaded}\n\n${ctx.formatted}` : threaded });
}
function idx(e: NotebookEntry, d: WorkflowDeps, t = false) {
  if (!d.studentId || !d.notebookId) return;
  if (t) extractTermsFromMaterial(e, d.studentId, d.notebookId).catch(() => {});
  indexTeachingContent(e, d.studentId, d.notebookId).catch(() => {}); }
function textOf(e: NotebookEntry | null | undefined): string | undefined {
  if (!e) return undefined;
  if ('content' in e && typeof e.content === 'string') return e.content;
  if (e.type === 'reading-material') return e.slides.map((x) => `${x.heading}: ${x.body}`).join('\n');
  if (e.type === 'flashcard-deck') return e.cards.map((c) => `Q: ${c.front}\nA: ${c.back}`).join('\n');
  return e.type === 'exercise-set' ? e.exercises.map((x) => x.prompt).join('\n') : undefined; }
const done = () => setActivityDetail(null);

/**delve — research → explain → visualize */
export async function routeDelve(q: string, ctx: string, d: WorkflowDeps) {
  s('researching', 1, 3);
  const r = await show('researching', d, async () => {
    const res = await d.research(q, ctx ? `${ctx}\n\nResearch query: ${q}` : q);
    return res ? { type: 'tutor-marginalia', content: res } : null;
  });
  s('explaining', 2, 3);
  await ask('Explain in depth:', q, 'explain', 2, d, textOf(r));
  s('visualizing', 3, 3);
  await ask('Visualize this concept:', q, 'visualize', 1, d, textOf(r));
  done();
}
/**study — flashcards → exercises → quiz */
export async function routeStudy(q: string, ctx: string, d: WorkflowDeps) {
  s('creating flashcards', 1, 3);
  const fc = await show('creating flashcards', d, async () => {
    const r = await generateFlashcards(q, d.entries(), ctx || undefined);
    if (r) idx(r, d, true);
    return r;
  });
  s('designing exercises', 2, 3);
  await show('designing exercises', d, async () => {
    const r = await generateExercises(q, d.entries(), ctx || undefined);
    if (r) idx(r, d);
    return r;
  });
  s('preparing quiz', 3, 3);
  await ask('Quiz me on my understanding of:', q, 'quiz', 2, d, textOf(fc));
  done();
}
/**lesson — teach → exercises → quiz */
export async function routeLesson(q: string, ctx: string, d: WorkflowDeps) {
  s('preparing reading material', 1, 3);
  const deck = await show('preparing reading material', d, async () => {
    const r = await generateReadingMaterial(q, d.entries(), ctx || undefined);
    if (r && d.studentId && d.notebookId) { addToLibrary(r, d.studentId, d.notebookId).catch(() => {}); idx(r, d, true); }
    return r;
  });
  s('designing exercises', 2, 3);
  await show('designing exercises', d, async () => {
    const r = await generateExercises(q, d.entries(), ctx || undefined);
    if (r) idx(r, d);
    return r;
  });
  s('preparing quiz', 3, 3);
  await ask('Quiz me on my understanding of:', q, 'quiz', 2, d, textOf(deck));
  done();
}
/**review — summarize → flashcards */
export async function routeReview(q: string, ctx: string, d: WorkflowDeps) {
  s('summarizing', 1, 2);
  await ask('Summarize our exploration so far, focusing on:', q || 'the main ideas', 'summarize', 2, d);
  s('creating flashcards', 2, 2);
  await show('creating flashcards', d, async () => {
    const r = await generateFlashcards(q || 'key concepts from this session', d.entries(), ctx || undefined);
    if (r) idx(r, d, true);
    return r;
  });
  done();
}
/**compare — research → connect → visualize */
export async function routeCompare(q: string, ctx: string, d: WorkflowDeps) {
  s('researching', 1, 3);
  const r = await show('researching', d, async () => {
    const prompt = ctx ? `${ctx}\n\nCompare and contrast: ${q}` : `Compare and contrast: ${q}`;
    const res = await d.research(q, prompt);
    return res ? { type: 'tutor-marginalia', content: res } : null;
  });
  s('connecting', 2, 3);
  await ask('Show how these ideas connect:', q, 'connect', 2, d, textOf(r));
  s('visualizing', 3, 3);
  await ask('Visualize the relationships between:', q, 'visualize', 1, d, textOf(r));
  done();
}
/**origins — timeline → research → teach */
export async function routeOrigins(q: string, ctx: string, d: WorkflowDeps) {
  s('tracing timeline', 1, 3);
  await ask('Create a timeline visualization:', q, 'timeline', 1, d);
  s('researching history', 2, 3);
  const r = await show('researching history', d, async () => {
    const prompt = ctx ? `${ctx}\n\nTrace the intellectual history and key thinkers behind: ${q}`
      : `Trace the intellectual history and key thinkers behind: ${q}`;
    const res = await d.research(q, prompt);
    return res ? { type: 'tutor-marginalia', content: res } : null;
  });
  s('preparing reading material', 3, 3);
  await show('preparing reading material', d, async () => {
    const deck = await generateReadingMaterial(`The intellectual origins of ${q}`, d.entries(), textOf(r) || ctx || undefined);
    if (deck && d.studentId && d.notebookId) { addToLibrary(deck, d.studentId, d.notebookId).catch(() => {}); idx(deck, d, true); }
    return deck;
  });
  done();
}
/**illustrate — explain → draw → define */
export async function routeIllustrate(q: string, ctx: string, d: WorkflowDeps) {
  s('explaining', 1, 3);
  await ask('Explain in depth:', q, 'explain', 2, d);
  s('sketching', 2, 3);
  await show('sketching', d, () => generateIllustration(q, d.entries(), ctx || undefined));
  s('defining terms', 3, 3);
  await ask('Define and add to my lexicon:', q, 'define', 2, d);
  done();
}
