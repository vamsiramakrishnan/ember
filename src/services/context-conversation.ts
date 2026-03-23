/**
 * Context Conversation Builder — converts recent notebook entries
 * into an agent message array for the tutor's conversation window.
 */
import type { LiveEntry } from '@/types/entries';
import type { NotebookEntry } from '@/types/entries';
import type { AgentMessage } from './run-agent';

export function buildConversationMessages(
  entries: LiveEntry[],
  latestText: string,
  contextPrefix?: string,
): AgentMessage[] {
  const recent = entries.slice(-12);
  const messages: AgentMessage[] = [];

  for (const le of recent) {
    const e = le.entry;
    const isStudent = ['prose', 'question', 'hypothesis', 'scratch'].includes(e.type);
    const isTutor = e.type.startsWith('tutor-');

    if (isStudent && 'content' in e) {
      messages.push({ role: 'user', parts: [{ text: `[${e.type}]: ${e.content}` }] });
    } else if (isTutor && 'content' in e) {
      messages.push({ role: 'model', parts: [{ text: e.content }] });
    } else {
      const summary = summarizeEntry(e, le.id);
      if (summary) {
        const role = isStudent ? 'user' : 'model';
        messages.push({ role, parts: [{ text: summary }] });
      }
    }
  }

  const fullText = contextPrefix
    ? `${contextPrefix}\n\n[Student writes]: ${latestText}`
    : latestText;

  messages.push({ role: 'user', parts: [{ text: fullText }] });
  return messages;
}

/** Summarize non-text entries for context inclusion. Includes entry ID
 *  so the tutor can call get_entry_content(entry_id) to drill down. */
function summarizeEntry(e: NotebookEntry, id?: string): string | null {
  const ref = id ? ` (id:${id})` : '';
  switch (e.type) {
    case 'code-cell':
      return `[Code (${e.language})${ref}]: ${e.source.slice(0, 200)}`;
    case 'image':
      return `[Image${ref}: ${e.alt ?? 'no description'}${e.caption ? ` — ${e.caption}` : ''}]`;
    case 'sketch':
      return `[Sketch${ref}]`;
    case 'file-upload':
      return `[File${ref}: ${e.file.name} (${e.file.mimeType}) — use get_entry_content or read_file_content to inspect]`;
    case 'document':
      return `[Document${ref}: ${e.file.name} — searchable via search_history${e.extractedText ? `, preview: ${e.extractedText.slice(0, 120)}` : ''}]`;
    case 'embed':
      return `[Link: ${e.title ?? e.url}${e.description ? ` — ${e.description}` : ''}]`;
    case 'reading-material':
      return `[Reading material${ref}: "${e.title}" — ${e.slides.length} slides: ${e.slides.map((s) => s.heading).join(', ')}. Use get_entry_content to read slides.]`;
    case 'flashcard-deck':
      return `[Flashcard deck${ref}: "${e.title}" — ${e.cards.length} cards. Use get_entry_content to see cards.]`;
    case 'exercise-set':
      return `[Exercise set${ref}: "${e.title}" — ${e.exercises.length} exercises (${e.difficulty}). Use get_entry_content to see problems.]`;
    case 'concept-diagram':
      return `[Concept diagram${ref}${e.title ? `: ${e.title}` : ''} — ${e.items.map((i) => i.label).join(', ')}]`;
    case 'thinker-card':
      return `[Thinker: ${e.thinker.name} (${e.thinker.dates}) — gift: ${e.thinker.gift}]`;
    case 'visualization':
      return e.caption ? `[Visualization: ${e.caption}]` : null;
    case 'illustration':
      return e.caption ? `[Illustration: ${e.caption}]` : null;
    default:
      return null;
  }
}
