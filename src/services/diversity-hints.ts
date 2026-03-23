/**
 * Diversity Hints — injects session state into the tutor's context
 * so it avoids repetitive response patterns.
 *
 * Appends a [SESSION CONTEXT] block to the last user message with
 * information about covered topics, last response type, consecutive
 * entries, and introduced thinkers.
 */
import { getSessionState } from '@/state';
import type { AgentMessage } from './run-agent';

/**
 * Mutate the messages array to append diversity hints to the last
 * user message. No-op if there are no hints or no suitable message.
 */
export function appendDiversityHints(messages: AgentMessage[]): void {
  const session = getSessionState();
  const hints: string[] = [];

  if (session.coveredTopics.length > 0) {
    const recent = session.coveredTopics.slice(-8).join(', ');
    hints.push(`Topics already covered this session: ${recent}. Do not repeat these.`);
  }
  if (session.lastTutorMode) {
    hints.push(
      `Your last response type was "${session.lastTutorMode}". Vary your response type.`,
    );
  }
  if (session.consecutiveTutorEntries >= 2) {
    hints.push('You have made multiple responses in a row. Keep this one brief.');
  }
  if (session.introducedThinkers.length > 0) {
    hints.push(
      `Thinkers already introduced: ${session.introducedThinkers.join(', ')}. Do not re-introduce them.`,
    );
  }

  if (hints.length === 0) return;

  const hint = '\n\n[SESSION CONTEXT]\n' + hints.join('\n');
  const lastMsg = messages[messages.length - 1];

  if (lastMsg && lastMsg.role === 'user' && lastMsg.parts[0] && 'text' in lastMsg.parts[0]) {
    lastMsg.parts[0].text += hint;
  }
}
