/**
 * Resilient Agent Runner — tiered fallback for API failures.
 *
 * Tier 1: Try the configured model (gemini-3.1-flash-lite-preview)
 * Tier 2: Retry once after 1s delay (same model — transient errors)
 * Tier 3: Fall back to gemini-2.5-flash-lite
 *
 * Error-code-aware: 429 (rate limit) and 503 (overloaded) get longer
 * back-off before retry. 400 (bad request) skips straight to fallback.
 *
 * Never shows an error to the student. If all tiers fail,
 * returns a graceful "the tutor is reflecting" message.
 */
import { runTextAgent, runTextAgentStreaming, type AgentTextResult } from './run-agent';
import { MODELS } from './gemini';
import type { AgentConfig } from './agents';
import type { AgentMessage } from './run-agent';

const FALLBACK_MODEL = MODELS.fallback;

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

const GRACEFUL_FALLBACK: AgentTextResult = {
  text: '{"type": "silence", "text": "The tutor is taking a moment to reflect..."}',
  citations: [],
};

/** HTTP-style error codes we can detect from Gemini SDK errors. */
function extractErrorCode(err: unknown): number | null {
  if (!err || typeof err !== 'object') return null;
  const e = err as Record<string, unknown>;
  // @google/genai errors often have status or code
  if (typeof e.status === 'number') return e.status;
  if (typeof e.code === 'number') return e.code;
  // Some errors embed it in the message
  const msg = typeof e.message === 'string' ? e.message : '';
  const match = msg.match(/(\b[45]\d{2}\b)/);
  return match?.[1] ? parseInt(match[1], 10) : null;
}

/** Choose delay based on error code. */
function backoffForError(err: unknown, base: number): number {
  const code = extractErrorCode(err);
  if (code === 429) return base * 3;    // Rate limit — longer wait
  if (code === 503) return base * 2;    // Overloaded — moderate wait
  return base;                           // Default
}

/** Whether this error means the request itself is bad (don't retry same model). */
function isClientError(err: unknown): boolean {
  const code = extractErrorCode(err);
  return code !== null && code >= 400 && code < 500 && code !== 429;
}

/** Try the primary model, retry once, then cascade through fallback models. */
export async function resilientTextAgent(
  agent: AgentConfig,
  messages: AgentMessage[],
): Promise<AgentTextResult> {
  // Tier 1: primary model
  let lastErr: unknown;
  try {
    return await runTextAgent(agent, messages);
  } catch (err) {
    lastErr = err;
    console.warn('[Ember] Tier 1 failed:', err);
  }

  // Tier 2: retry (skip if client error — same request will fail again)
  if (!isClientError(lastErr)) {
    await delay(backoffForError(lastErr, 1000));
    try {
      return await runTextAgent(agent, messages);
    } catch (err) {
      lastErr = err;
      console.warn('[Ember] Tier 2 retry failed:', err);
    }
  }

  // Tier 3: fallback to gemini-2.5-flash-lite
  try {
    const fallback: AgentConfig = { ...agent, model: FALLBACK_MODEL };
    return await runTextAgent(fallback, messages);
  } catch (err) {
    console.warn(`[Ember] Fallback ${FALLBACK_MODEL} failed:`, err);
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
  let lastErr: unknown;

  // Tier 1: streaming with primary model
  try {
    return await runTextAgentStreaming(agent, messages, onChunk);
  } catch (err) {
    lastErr = err;
    console.warn('[Ember] Streaming Tier 1 failed:', err);
  }

  // Tier 2: retry streaming (skip on client errors)
  if (!isClientError(lastErr)) {
    await delay(backoffForError(lastErr, 1000));
    try {
      return await runTextAgentStreaming(agent, messages, onChunk);
    } catch (err) {
      lastErr = err;
      console.warn('[Ember] Streaming Tier 2 failed:', err);
    }
  }

  // Tier 3: non-streaming fallback with gemini-2.5-flash-lite
  try {
    const fallback: AgentConfig = { ...agent, model: FALLBACK_MODEL };
    const result = await runTextAgent(fallback, messages);
    onChunk(result.text, result.text);
    return result;
  } catch (err) {
    console.warn(`[Ember] Streaming fallback ${FALLBACK_MODEL} failed:`, err);
  }

  const fallbackText = GRACEFUL_FALLBACK.text;
  onChunk(fallbackText, fallbackText);
  return { text: fallbackText, citations: [] };
}

// Re-export for downstream use
export { MODELS };
