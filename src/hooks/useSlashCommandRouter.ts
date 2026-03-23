/**
 * useSlashCommandRouter — routes slash commands to agent pipelines.
 * Maps /visualize, /research, /explain, etc. to the corresponding
 * agent invocations, producing notebook entries as output.
 */
import { useCallback, useRef } from 'react';
import { isGeminiAvailable } from '@/services/gemini';
import { useResearcher } from './useResearcher';
import { generateIllustration } from '@/services/enrichment';
import type { NotebookEntry, LiveEntry } from '@/types/entries';
import type { SlashCommand } from '@/components/student/SlashCommandPopup';

interface SlashRouterOptions {
  addEntry: (entry: NotebookEntry) => void;
  respond: (entry: NotebookEntry) => void;
  entries: LiveEntry[];
}

/** Extract the query by stripping the /command from anywhere in text. */
function stripCommand(text: string): string {
  return text.replace(/\/\w+\s*/, '').trim();
}

export function useSlashCommandRouter({
  addEntry, respond, entries,
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
        const context = recentContext(entriesRef.current);
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

/** Build a brief context string from recent entries. */
function recentContext(entries: LiveEntry[]): string {
  const recent = entries.slice(-6);
  return recent
    .filter((le) => 'content' in le.entry && typeof le.entry.content === 'string')
    .map((le) => (le.entry as { content: string }).content)
    .join('\n')
    .slice(0, 500);
}
