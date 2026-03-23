/** useSlashCommandRouter — routes /commands to agent pipelines. */
import { useCallback, useRef } from 'react';
import { isGeminiAvailable } from '@/services/gemini';
import { useResearcher } from './useResearcher';
import { generateIllustration } from '@/services/enrichment';
import { generateReadingMaterial } from '@/services/reading-material-gen';
import { generateFlashcards } from '@/services/flashcard-gen';
import { generateExercises } from '@/services/exercise-gen';
import { addToLibrary, extractTermsFromMaterial } from '@/services/teaching-integration';
import { recentContext as buildContext } from '@/services/entry-utils';
import { generatePodcast } from '@/services/podcast-gen';
import { indexTeachingContent } from './useTeachingIndexer';
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
    const query = stripCommand(rawText);
    if (!query) return false;
    if (!isGeminiAvailable()) return false;

    switch (command.id) {
      case 'research': {
        addEntry({ type: 'silence', text: 'researching…' });
        const context = buildContext(entriesRef.current);
        const result = await research(query, context);
        if (result) {
          addEntry({ type: 'tutor-marginalia', content: result });
        }
        return true;
      }

      case 'visualize':
      case 'timeline':
      case 'connect': {
        const hint = command.id === 'timeline'
          ? `Create a timeline visualization: ${query}`
          : command.id === 'connect'
            ? `Show how these ideas connect: ${query}`
            : `Visualize this concept: ${query}`;
        respond({ type: 'question', content: hint });
        return true;
      }

      case 'draw': {
        addEntry({ type: 'silence', text: 'sketching…' });
        const ill = await generateIllustration(query);
        if (ill) addEntry(ill);
        return true;
      }

      case 'teach': {
        addEntry({ type: 'silence', text: 'preparing reading material…' });
        const deck = await generateReadingMaterial(query, entriesRef.current);
        if (deck) {
          addEntry(deck);
          // Background: add to library + extract vocabulary
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
        const fc = await generateFlashcards(query, entriesRef.current);
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
        const ex = await generateExercises(query, entriesRef.current);
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
          query, entriesRef.current,
          (_segIdx, segUrl) => {
            if (!ref.id) return;
            const prev = entriesRef.current.find((e) => e.id === ref.id);
            if (prev && prev.entry.type === 'podcast') {
              const segs = [...(prev.entry.segments ?? []), segUrl];
              patchEntryContent(ref.id, { ...prev.entry, segments: segs });
            }
          },
        );
        if (pod) ref.id = await addEntryWithId(pod);
        return true;
      }

      case 'explain': {
        respond({ type: 'question', content: `Explain in depth: ${query}` });
        return true;
      }

      case 'summarize': {
        respond({
          type: 'question',
          content: `Summarize our exploration so far, focusing on: ${query || 'the main ideas'}`,
        });
        return true;
      }

      case 'quiz': {
        respond({
          type: 'question',
          content: `Quiz me on my understanding of: ${query}`,
        });
        return true;
      }

      case 'define': {
        respond({
          type: 'question',
          content: `Define and add to my lexicon: ${query}`,
        });
        return true;
      }

      default:
        return false;
    }
  }, [addEntry, respond, research]);

  return { route };
}
