/**
 * Context Conversation Builder — converts recent notebook entries
 * into an agent message array for the tutor's conversation window.
 */
import type { LiveEntry } from '@/types/entries';
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
    }
  }

  // Inject context as the first user message if we have context
  // and no prior messages, or prepend to the latest
  const fullText = contextPrefix
    ? `${contextPrefix}\n\n[Student writes]: ${latestText}`
    : latestText;

  messages.push({ role: 'user', parts: [{ text: fullText }] });
  return messages;
}
