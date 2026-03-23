/**
 * Structured Generator — unified pipeline for generating typed content
 * from the tutor agent. Replaces the near-identical implementations in
 * reading-material-gen, flashcard-gen, and exercise-gen.
 *
 * Pattern: system prompt + topic + context → agent → JSON → validate → entry
 */
import { VISUALISER_AGENT } from './agents';
import { runTextAgent } from './run-agent';
import { parseStructured } from './json-parser';
import { recentContext } from './entry-utils';
import type { NotebookEntry, LiveEntry } from '@/types/entries';
import type { AgentConfig } from './agents';

export interface GenerationContract<T> {
  /** System prompt instructing the agent what to generate. */
  systemPrompt: string;
  /** Agent to use. Defaults to VISUALISER_AGENT. */
  agent?: AgentConfig;
  /** Validate and transform the parsed JSON into a NotebookEntry. */
  validate: (parsed: T) => NotebookEntry | null;
  /** Label shown in the silence marker while generating. */
  silenceLabel?: string;
}

/**
 * Generate structured content from the tutor agent.
 * Handles: context building, agent call, JSON extraction, validation.
 */
export async function generateStructured<T>(
  topic: string,
  entries: LiveEntry[],
  contract: GenerationContract<T>,
): Promise<NotebookEntry | null> {
  try {
    const context = recentContext(entries);
    const agent = contract.agent ?? VISUALISER_AGENT;

    const prompt = [
      `${contract.systemPrompt}`,
      '',
      `Topic: ${topic}`,
      context ? `\nStudent's recent exploration:\n${context}` : '',
      '\nOutput JSON only.',
    ].join('\n');

    const result = await runTextAgent(agent, [{
      role: 'user',
      parts: [{ text: prompt }],
    }]);

    const parsed = parseStructured<T>(result.text);
    if (!parsed) return null;

    return contract.validate(parsed);
  } catch {
    // Generation failed — not critical
  }
  return null;
}
