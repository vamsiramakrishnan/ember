/** useSlashCommandRouter — routes /commands to agent pipelines. */
import { useCallback, useRef } from 'react';
import { isGeminiAvailable } from '@/services/gemini';
import { useResearcher } from './useResearcher';
import { generateIllustration } from '@/services/enrichment';
import { generateReadingMaterial } from '@/services/reading-material-gen';
import { generateFlashcards } from '@/services/flashcard-gen';
import { generateExercises } from '@/services/exercise-gen';
import { addToLibrary, extractTermsFromMaterial } from '@/services/teaching-integration';
import { generatePodcast } from '@/services/podcast-gen';
import { indexTeachingContent } from './useTeachingIndexer';
import { resolveCommandContext, type ContextTier } from '@/services/command-context';
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

/** Extract the query by stripping the /command from anywhere in text. */
function stripCommand(text: string): string {
  return text.replace(/\/\w+\s*/, '').trim();
}

/** Which tier each command needs. */
const COMMAND_TIERS: Record<string, ContextTier> = {
  draw: 1, visualize: 1, timeline: 1, summarize: 1,
  connect: 2, explain: 2, define: 2,
  research: 2, teach: 2, flashcards: 2,
  exercise: 2, quiz: 2, podcast: 2,
};

export function useSlashCommandRouter({
  addEntry, addEntryWithId, patchEntryContent, respond,
  entries, studentId, notebookId,
}: SlashRouterOptions) {
  const { research } = useResearcher();
  const entriesRef = useRef(entries);
  entriesRef.current = entries;

  const route = useCallback(async (
    command: SlashCommand,
    rawText: string,
  ): Promise<boolean> => {
    const rawQuery = stripCommand(rawText);
    if (!rawQuery) return false;
    if (!isGeminiAvailable()) return false;

    const tier = COMMAND_TIERS[command.id] ?? 0;
    const ctx = await resolveCommandContext(
      rawQuery, entriesRef.current, tier, command.id, notebookId,
    );
    const q = ctx.resolvedQuery;
    const ctxBlock = ctx.formatted;

    switch (command.id) {
      case 'research': {
        addEntry({ type: 'silence', text: 'researching…' });
        const prompt = ctxBlock ? `${ctxBlock}\n\nResearch query: ${q}` : q;
        const result = await research(q, prompt);
        if (result) addEntry({ type: 'tutor-marginalia', content: result });
        return true;
      }

      case 'visualize':
      case 'timeline':
      case 'connect': {
        const prefix = command.id === 'timeline'
          ? 'Create a timeline visualization:'
          : command.id === 'connect'
            ? 'Show how these ideas connect:'
            : 'Visualize this concept:';
        const hint = ctxBlock ? `${prefix} ${q}\n\n${ctxBlock}` : `${prefix} ${q}`;
        respond({ type: 'question', content: hint });
        return true;
      }

      case 'draw': {
        addEntry({ type: 'silence', text: 'sketching…' });
        const ill = await generateIllustration(q, entriesRef.current, ctxBlock || undefined);
        if (ill) {
          addEntry(ill);
        } else {
          addEntry({ type: 'tutor-marginalia', content: 'The sketch could not be generated — try again with a more specific prompt.' });
        }
        return true;
      }

      case 'teach': {
        addEntry({ type: 'silence', text: 'preparing reading material…' });
        const deck = await generateReadingMaterial(q, entriesRef.current, ctxBlock || undefined);
        if (deck) {
          addEntry(deck);
          if (studentId && notebookId) {
            addToLibrary(deck, studentId, notebookId).catch(() => {});
            extractTermsFromMaterial(deck, studentId, notebookId).catch(() => {});
            indexTeachingContent(deck, studentId, notebookId).catch(() => {});
          }
        }
        return true;
      }

      case 'flashcards': {
        addEntry({ type: 'silence', text: 'creating flashcards…' });
        const fc = await generateFlashcards(q, entriesRef.current, ctxBlock || undefined);
        if (fc) {
          addEntry(fc);
          if (studentId && notebookId) {
            extractTermsFromMaterial(fc, studentId, notebookId).catch(() => {});
            indexTeachingContent(fc, studentId, notebookId).catch(() => {});
          }
        }
        return true;
      }

      case 'exercise': {
        addEntry({ type: 'silence', text: 'designing exercises…' });
        const ex = await generateExercises(q, entriesRef.current, ctxBlock || undefined);
        if (ex) {
          addEntry(ex);
          if (studentId && notebookId) {
            indexTeachingContent(ex, studentId, notebookId).catch(() => {});
          }
        }
        return true;
      }

      case 'podcast': {
        addEntry({ type: 'silence', text: 'recording podcast…' });
        const ref: { id?: string } = {};
        const pod = await generatePodcast(
          q, entriesRef.current,
          (_segIdx, segUrl) => {
            if (!ref.id) return;
            const prev = entriesRef.current.find((e) => e.id === ref.id);
            if (prev && prev.entry.type === 'podcast') {
              const segs = [...(prev.entry.segments ?? []), segUrl];
              patchEntryContent(ref.id, { ...prev.entry, segments: segs });
            }
          },
          ctxBlock || undefined,
        );
        if (pod) ref.id = await addEntryWithId(pod);
        return true;
      }

      case 'explain': {
        const hint = ctxBlock
          ? `Explain in depth: ${q}\n\n${ctxBlock}`
          : `Explain in depth: ${q}`;
        respond({ type: 'question', content: hint });
        return true;
      }

      case 'summarize': {
        const hint = ctxBlock
          ? `Summarize our exploration so far, focusing on: ${q || 'the main ideas'}\n\n${ctxBlock}`
          : `Summarize our exploration so far, focusing on: ${q || 'the main ideas'}`;
        respond({ type: 'question', content: hint });
        return true;
      }

      case 'quiz': {
        const hint = ctxBlock
          ? `Quiz me on my understanding of: ${q}\n\n${ctxBlock}`
          : `Quiz me on my understanding of: ${q}`;
        respond({ type: 'question', content: hint });
        return true;
      }

      case 'define': {
        const hint = ctxBlock
          ? `Define and add to my lexicon: ${q}\n\n${ctxBlock}`
          : `Define and add to my lexicon: ${q}`;
        respond({ type: 'question', content: hint });
        return true;
      }

      default:
        return false;
    }
  }, [addEntry, respond, research, notebookId, studentId]);

  return { route };
}
