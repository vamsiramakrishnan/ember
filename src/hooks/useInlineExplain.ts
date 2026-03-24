/**
 * useInlineExplain — selection → context resolve → tutor → inline-response.
 *
 * When the student selects text and taps "explain", this hook:
 * 1. Resolves the selected text with Tier 2 graph context
 * 2. Builds a focused prompt with the quote + surrounding entry context
 * 3. Calls the tutor agent for a concise explanation
 * 4. Creates an `inline-response` entry (quoted text + explanation)
 *
 * The whole flow is ~300ms for Tier 2 context + one agent call.
 */
import { useCallback, useRef } from 'react';
import { resolveCommandContext } from '@/services/command-context';
import { micro } from '@/services/agents/config';
import { runTextAgent } from '@/services/run-agent';
import type { NotebookEntry, LiveEntry } from '@/types/entries';

/**
 * Dedicated agent for inline explanations — plain prose output only.
 * Must NOT use the full TUTOR_AGENT which outputs structured JSON
 * for the tutor-response-parser.
 */
const EXPLAIN_AGENT = micro(
  `You are Ember's tutor. You explain concepts with warmth, clarity, and intellectual precision.

Rules:
- Write 2-4 sentences of plain prose. No JSON, no markdown headers, no structured output.
- Use the student's vocabulary level based on their mastery context.
- If the concept connects to something the student already knows, draw the connection.
- Do not repeat the quoted text. Do not use preamble like "Sure!" or "Great question!".
- Write in the tutor's voice: warm serif prose, like a margin annotation in a library book.`,
);

/**
 * Safety net: if the agent accidentally returns JSON-wrapped text,
 * extract the content string. This handles the case where the model
 * falls back to structured output despite the system instruction.
 */
function stripJsonWrapper(raw: string): string {
  // If it looks like JSON, try to extract .content
  if (raw.startsWith('{') || raw.startsWith('```')) {
    try {
      const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const parsed = JSON.parse(cleaned) as Record<string, unknown>;
      if (typeof parsed.content === 'string') return parsed.content;
    } catch {
      // Not valid JSON — return as-is
    }
  }
  return raw;
}

interface InlineExplainDeps {
  entries: LiveEntry[];
  notebookId?: string;
  addEntry: (entry: NotebookEntry) => void;
}

export function useInlineExplain({ entries, notebookId, addEntry }: InlineExplainDeps) {
  const entriesRef = useRef(entries);
  entriesRef.current = entries;

  const requestInlineExplain = useCallback(async (
    selectedText: string,
    sourceEntryId: string,
  ) => {
    try {
      // Find the source entry for surrounding context
      const sourceEntry = entriesRef.current.find((le) => le.id === sourceEntryId);
      const sourceContent = sourceEntry && 'content' in sourceEntry.entry
        ? (sourceEntry.entry as { content: string }).content
        : '';

      // Tier 2 context — graph-aware (active concepts, gaps, threads)
      const ctx = await resolveCommandContext(
        selectedText, entriesRef.current, 2, 'inline-explain', notebookId,
      );

      const promptParts = [
        'The student selected this passage and asked you to explain it:',
        '',
        `"${selectedText}"`,
        '',
      ];

      if (sourceContent && sourceContent !== selectedText) {
        const trimmed = sourceContent.slice(0, 400);
        promptParts.push(`From the surrounding entry: "${trimmed}"`);
        promptParts.push('');
      }

      if (ctx.formatted) {
        promptParts.push(ctx.formatted);
        promptParts.push('');
      }

      promptParts.push(
        'Write a concise, clear explanation (2-4 sentences). ' +
        'Pitch it to the student\'s current understanding level. ' +
        'If this connects to concepts they\'ve explored, mention the connection. ' +
        'Do not repeat the quoted text. Do not use preamble.',
      );

      const result = await runTextAgent(EXPLAIN_AGENT, [{
        role: 'user',
        parts: [{ text: promptParts.join('\n') }],
      }]);

      const explanation = stripJsonWrapper(result.text.trim());
      if (!explanation) return;

      const entry: NotebookEntry = {
        type: 'inline-response',
        quotedText: selectedText.slice(0, 300),
        content: explanation,
        sourceEntryId,
        intent: 'explain',
      };

      addEntry(entry);
    } catch (err) {
      console.error('[Ember] Inline explain failed:', err);
      addEntry({
        type: 'tutor-marginalia',
        content: '_Could not generate explanation — try again._',
      });
    }
  }, [notebookId, addEntry]);

  return { requestInlineExplain };
}
