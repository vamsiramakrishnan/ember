/**
 * Resilient Agent Runner — immediate fallback on first failure.
 *
 * Model-aware fallback (no retry, no delay — UX is critical):
 *   gemini-3.1-flash-lite-preview  →  gemini-2.5-flash-lite
 *   gemini-3-flash-preview         →  gemini-3.1-flash-lite-preview
 *
 * Tier 1: Try the configured model
 * Tier 2: Immediately fall back to the mapped fallback model
 *
 * Never shows an error to the student. If both tiers fail,
 * returns a graceful "the tutor is reflecting" message.
 */
import { runTextAgent, runTextAgentStreaming, type AgentTextResult } from './run-agent';
import { MODELS } from './gemini';
import type { AgentConfig } from './agents';
import type { AgentMessage } from './run-agent';

/**
 * Model-aware fallback map.
 * Heavy model (3-flash) falls back to the light model (3.1-flash-lite).
 * Light model (3.1-flash-lite) falls back to previous-gen lite (2.5-flash-lite).
 */
const FALLBACK_MAP: Record<string, string> = {
  'gemini-3-flash-preview': MODELS.text,
  [MODELS.text]: MODELS.fallback,
};

/** Resolve the fallback model for a given primary. */
function fallbackFor(primary: string): string {
  return FALLBACK_MAP[primary] ?? MODELS.fallback;
}

const GRACEFUL_FALLBACK: AgentTextResult = {
  text: '{"type": "silence", "text": "The tutor is taking a moment to reflect..."}',
  citations: [],
};

/** Try the primary model, then immediately fall back on any failure. */
export async function resilientTextAgent(
  agent: AgentConfig,
  messages: AgentMessage[],
): Promise<AgentTextResult> {
  // Tier 1: primary model
  try {
    return await runTextAgent(agent, messages);
  } catch (err) {
    console.warn('[Ember] Primary failed, falling back:', err);
  }

  // Tier 2: immediate fallback — no retry, no delay
  const fb = fallbackFor(agent.model);
  try {
    return await runTextAgent({ ...agent, model: fb }, messages);
  } catch (err) {
    console.warn(`[Ember] Fallback ${fb} failed:`, err);
  }

  return { ...GRACEFUL_FALLBACK };
}

/** Streaming variant with immediate fallback. */
export async function resilientStreamingAgent(
  agent: AgentConfig,
  messages: AgentMessage[],
  onChunk: (chunk: string, accumulated: string) => void,
): Promise<AgentTextResult> {
  // Tier 1: streaming with primary model
  try {
    return await runTextAgentStreaming(agent, messages, onChunk);
  } catch (err) {
    console.warn('[Ember] Streaming primary failed, falling back:', err);
  }

  // Tier 2: immediate fallback (non-streaming for reliability)
  const fb = fallbackFor(agent.model);
  try {
    const result = await runTextAgent({ ...agent, model: fb }, messages);
    onChunk(result.text, result.text);
    return result;
  } catch (err) {
    console.warn(`[Ember] Streaming fallback ${fb} failed:`, err);
  }

  const fallbackText = GRACEFUL_FALLBACK.text;
  onChunk(fallbackText, fallbackText);
  return { text: fallbackText, citations: [] };
}

export { MODELS, fallbackFor };
