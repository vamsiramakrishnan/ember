/** useSlashCommandRouter — routes /commands to agent pipelines. */
import { useCallback, useRef } from 'react';
import { isGeminiAvailable } from '@/services/gemini';
import { setTutorActivity } from '@/state';
import { narrateStep, cancelNarration } from '@/services/status-narrator';
import { useResearcher } from './useResearcher';
import { generateIllustration } from '@/services/enrichment';
import { generateReadingMaterial } from '@/services/reading-material-gen';
import { generateFlashcards } from '@/services/flashcard-gen';
import { generateExercises } from '@/services/exercise-gen';
import { addToLibrary, extractTermsFromMaterial } from '@/services/teaching-integration';
import { generatePodcast } from '@/services/podcast-gen';
import { indexTeachingContent } from './useTeachingIndexer';
import { resolveCommandContext, type ContextTier } from '@/services/command-context';
import {
  routeDelve, routeStudy, routeLesson, routeReview,
  routeCompare, routeOrigins, routeIllustrate, type WorkflowDeps,
} from './routeWorkflow';
import type { NotebookEntry, LiveEntry } from '@/types/entries';
import type { SlashCommand } from '@/components/student/SlashCommandPopup';

interface SlashRouterOptions {
  addEntry: (entry: NotebookEntry) => void;
  addEntryWithId: (entry: NotebookEntry) => string | Promise<string>;
  patchEntryContent: (id: string, entry: NotebookEntry) => void;
  respond: (entry: NotebookEntry) => void;
  entries: LiveEntry[];
  studentId?: string;
  notebookId?: string;
}

const stripCommand = (t: string) => t.replace(/\/\w+\s*/, '').trim();

const COMMAND_TIERS: Record<string, ContextTier> = {
  draw: 1, visualize: 1, timeline: 1, summarize: 1, connect: 2, explain: 2, define: 2,
  research: 2, teach: 2, flashcards: 2, exercise: 2, quiz: 2, podcast: 2,
  delve: 2, study: 2, lesson: 2, review: 2, compare: 2, origins: 2, illustrate: 2,
};

/** Step label → TutorActivityStep mapping for slash commands. */
const SLASH_STEP_MAP: Record<string, 'enriching' | 'visualizing' | 'illustrating' | 'researching'> = {
  'preparing reading material': 'enriching',
  'creating flashcards': 'enriching',
  'designing exercises': 'enriching',
  'sketching': 'illustrating',
  'researching': 'researching',
  'recording podcast': 'enriching',
};

async function withProcessing(
  label: string,
  add: (e: NotebookEntry) => string | Promise<string>,
  patch: (id: string, e: NotebookEntry) => void,
  work: () => Promise<NotebookEntry | null>,
  query?: string,
) {
  const id = await add({ type: 'silence', text: `${label}\u2026` });

  // Activate tutor activity so TutorActivity + StatusNarrator render
  const step = SLASH_STEP_MAP[label] ?? 'enriching';
  setTutorActivity(true, false, { step, label: `${label}\u2026` });
  if (query) narrateStep(step, query);

  try {
    const result = await work();
    patch(id, result ?? { type: 'tutor-marginalia', content: 'That didn\u2019t work \u2014 try again.' });
  } finally {
    cancelNarration();
    setTutorActivity(false, false, null);
  }
}

export function useSlashCommandRouter({
  addEntry, addEntryWithId, patchEntryContent, respond,
  entries, studentId, notebookId,
}: SlashRouterOptions) {
  const { research } = useResearcher();
  const entriesRef = useRef(entries);
  entriesRef.current = entries;

  const route = useCallback(async (
    command: SlashCommand, rawText: string,
  ): Promise<boolean> => {
    const rawQuery = stripCommand(rawText);
    if (!rawQuery || !isGeminiAvailable()) return false;

    const tier = COMMAND_TIERS[command.id] ?? 0;
    const ctx = await resolveCommandContext(
      rawQuery, entriesRef.current, tier, command.id, notebookId,
    );
    const q = ctx.resolvedQuery;
    const ctxBlock = ctx.formatted;
    const wp = (l: string, w: () => Promise<NotebookEntry | null>) =>
      withProcessing(l, addEntryWithId, patchEntryContent, w, q);

    switch (command.id) {
      case 'research':
        return wp('researching', async () => {
          const p = ctxBlock ? `${ctxBlock}\n\nResearch query: ${q}` : q;
          const r = await research(q, p);
          return r ? { type: 'tutor-marginalia', content: r } : null;
        }).then(() => true);
      case 'visualize': case 'timeline': case 'connect': {
        const pre = command.id === 'timeline' ? 'Create a timeline visualization:'
          : command.id === 'connect' ? 'Show how these ideas connect:'
          : 'Visualize this concept:';
        respond({ type: 'question', content: ctxBlock ? `${pre} ${q}\n\n${ctxBlock}` : `${pre} ${q}` });
        return true;
      }
      case 'draw':
        return wp('sketching', () => generateIllustration(q, entriesRef.current, ctxBlock || undefined)).then(() => true);
      case 'teach':
        return wp('preparing reading material', async () => {
          const d = await generateReadingMaterial(q, entriesRef.current, ctxBlock || undefined);
          if (d && studentId && notebookId) {
            addToLibrary(d, studentId, notebookId).catch(() => {});
            extractTermsFromMaterial(d, studentId, notebookId).catch(() => {});
            indexTeachingContent(d, studentId, notebookId).catch(() => {});
          }
          return d;
        }).then(() => true);
      case 'flashcards':
        return wp('creating flashcards', async () => {
          const fc = await generateFlashcards(q, entriesRef.current, ctxBlock || undefined);
          if (fc && studentId && notebookId) {
            extractTermsFromMaterial(fc, studentId, notebookId).catch(() => {});
            indexTeachingContent(fc, studentId, notebookId).catch(() => {});
          }
          return fc;
        }).then(() => true);
      case 'exercise':
        return wp('designing exercises', async () => {
          const ex = await generateExercises(q, entriesRef.current, ctxBlock || undefined);
          if (ex && studentId && notebookId) indexTeachingContent(ex, studentId, notebookId).catch(() => {});
          return ex;
        }).then(() => true);
      case 'podcast': {
        const pid = await addEntryWithId({ type: 'silence', text: 'recording podcast\u2026' });
        const pod = await generatePodcast(q, entriesRef.current, (_i, url) => {
          const prev = entriesRef.current.find((e) => e.id === pid);
          if (prev && prev.entry.type === 'podcast') {
            patchEntryContent(pid, { ...prev.entry, segments: [...(prev.entry.segments ?? []), url] });
          }
        }, ctxBlock || undefined);
        patchEntryContent(pid, pod ?? { type: 'tutor-marginalia', content: 'The podcast could not be generated \u2014 try again with a more specific prompt.' });
        return true;
      }
      case 'explain': case 'summarize': case 'quiz': case 'define': {
        const prefixes: Record<string, string> = {
          explain: 'Explain in depth:', summarize: 'Summarize our exploration so far, focusing on:',
          quiz: 'Quiz me on my understanding of:', define: 'Define and add to my lexicon:',
        };
        const pf = prefixes[command.id] ?? '';
        const t = command.id === 'summarize' ? (q || 'the main ideas') : q;
        respond({ type: 'question', content: ctxBlock ? `${pf} ${t}\n\n${ctxBlock}` : `${pf} ${t}` });
        return true;
      }
      case 'delve': case 'study': case 'lesson':
      case 'review': case 'compare': case 'origins': case 'illustrate': {
        const deps: WorkflowDeps = {
          addEntryWithId, patchEntryContent, respond, research,
          entries: () => entriesRef.current, studentId, notebookId,
        };
        const wf: Record<string, (q: string, c: string, d: WorkflowDeps) => Promise<void>> = {
          delve: routeDelve, study: routeStudy, lesson: routeLesson, review: routeReview,
          compare: routeCompare, origins: routeOrigins, illustrate: routeIllustrate,
        };
        await wf[command.id]!(q, ctxBlock, deps);
        return true;
      }
      default: return false;
    }
  }, [addEntry, addEntryWithId, patchEntryContent, respond, research, notebookId, studentId]);

  return { route };
}
