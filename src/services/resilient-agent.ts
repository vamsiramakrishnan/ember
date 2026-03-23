/**
 * Resilient Agent Runner — tiered fallback for API failures.
 *
 * Tier 1: Try the configured model
 * Tier 2: Retry once after 1s delay
 * Tier 3: Fall back to a cheaper/more-available model
 *
 * Never shows an error to the student. If all tiers fail,
 * returns a graceful "the tutor is reflecting" message.
 */
import { runTextAgent, runTextAgentStreaming, type AgentTextResult } from './run-agent';
import type { AgentConfig } from './agents';
import type { AgentMessage } from './run-agent';

const FALLBACK_MODEL = 'gemini-2.0-flash-lite';

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

const GRACEFUL_FALLBACK: AgentTextResult = {
  text: '{"type": "silence", "text": "The tutor is taking a moment to reflect..."}',
  citations: [],
};

/** Try the primary model, retry once, then fall back to cheaper model. */
export async function resilientTextAgent(
  agent: AgentConfig,
  messages: AgentMessage[],
): Promise<AgentTextResult> {
  // Tier 1: primary model
  try {
    return await runTextAgent(agent, messages);
  } catch (err) {
    console.warn('[Ember] Tier 1 failed:', err);
  }

  // Tier 2: retry after delay
  await delay(1000);
  try {
    return await runTextAgent(agent, messages);
  } catch (err) {
    console.warn('[Ember] Tier 2 failed:', err);
  }

  // Tier 3: fallback model
  try {
    const fallback: AgentConfig = { ...agent, model: FALLBACK_MODEL };
    return await runTextAgent(fallback, messages);
  } catch (err) {
    console.warn('[Ember] Tier 3 failed:', err);
  }

  // All tiers failed — return graceful message
  return { ...GRACEFUL_FALLBACK };
}

/** Streaming variant with tiered fallback. */
export async function resilientStreamingAgent(
  agent: AgentConfig,
  messages: AgentMessage[],
  onChunk: (chunk: string, accumulated: string) => void,
): Promise<AgentTextResult> {
  // Tier 1
  try {
    return await runTextAgentStreaming(agent, messages, onChunk);
  } catch (err) {
    console.warn('[Ember] Streaming Tier 1 failed:', err);
  }

  // Tier 2: retry
  await delay(1000);
  try {
    return await runTextAgentStreaming(agent, messages, onChunk);
  } catch (err) {
    console.warn('[Ember] Streaming Tier 2 failed:', err);
  }

  // Tier 3: non-streaming fallback with cheaper model
  try {
    const fallback: AgentConfig = { ...agent, model: FALLBACK_MODEL };
    const result = await runTextAgent(fallback, messages);
    onChunk(result.text, result.text);
    return result;
  } catch (err) {
    console.warn('[Ember] Streaming Tier 3 failed:', err);
  }

  const fallbackText = GRACEFUL_FALLBACK.text;
  onChunk(fallbackText, fallbackText);
  return { text: fallbackText, citations: [] };
}
