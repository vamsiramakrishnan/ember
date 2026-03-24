/**
 * Resilient Agent Runner — tiered fallback for API failures.
 *
 * Model-aware fallback:
 *   gemini-3.1-flash-lite-preview  →  gemini-2.5-flash-lite
 *   gemini-3-flash-preview         →  gemini-3.1-flash-lite-preview
 *
 * Tier 1: Try the configured model
 * Tier 2: Retry once after delay (same model — transient errors)
 * Tier 3: Fall back to the mapped fallback model
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

/**
 * Model-aware fallback map.
 * Heavy model (3-flash) falls back to the light model (3.1-flash-lite).
 * Light model (3.1-flash-lite) falls back to previous-gen lite (2.5-flash-lite).
 */
const FALLBACK_MAP: Record<string, string> = {
  'gemini-3-flash-preview': MODELS.text,       // heavy → light
  [MODELS.text]: MODELS.fallback,              // light → 2.5-flash-lite
};

/** Resolve the fallback model for a given primary. */
function fallbackFor(primary: string): string {
  return FALLBACK_MAP[primary] ?? MODELS.fallback;
}

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
  if (typeof e.status === 'number') return e.status;
  if (typeof e.code === 'number') return e.code;
  const msg = typeof e.message === 'string' ? e.message : '';
  const match = msg.match(/(\b[45]\d{2}\b)/);
  return match?.[1] ? parseInt(match[1], 10) : null;
}

/** Choose delay based on error code. */
function backoffForError(err: unknown, base: number): number {
  const code = extractErrorCode(err);
  if (code === 429) return base * 3;
  if (code === 503) return base * 2;
  return base;
}

/** Whether this error means the request itself is bad (don't retry same model). */
function isClientError(err: unknown): boolean {
  const code = extractErrorCode(err);
  return code !== null && code >= 400 && code < 500 && code !== 429;
}

/** Try the primary model, retry once, then fall back to mapped model. */
export async function resilientTextAgent(
  agent: AgentConfig,
  messages: AgentMessage[],
): Promise<AgentTextResult> {
  let lastErr: unknown;

  // Tier 1: primary model
  try {
    return await runTextAgent(agent, messages);
  } catch (err) {
    lastErr = err;
    console.warn('[Ember] Tier 1 failed:', err);
  }

  // Tier 2: retry (skip if client error)
  if (!isClientError(lastErr)) {
    await delay(backoffForError(lastErr, 1000));
    try {
      return await runTextAgent(agent, messages);
    } catch (err) {
      lastErr = err;
      console.warn('[Ember] Tier 2 retry failed:', err);
    }
  }

  // Tier 3: model-aware fallback
  const fb = fallbackFor(agent.model);
  try {
    const fallback: AgentConfig = { ...agent, model: fb };
    return await runTextAgent(fallback, messages);
  } catch (err) {
    console.warn(`[Ember] Fallback ${fb} failed:`, err);
  }

  return { ...GRACEFUL_FALLBACK };
}

/** Streaming variant with tiered fallback. */
export async function resilientStreamingAgent(
  agent: AgentConfig,
  messages: AgentMessage[],
  onChunk: (chunk: string, accumulated: string) => void,
): Promise<AgentTextResult> {
  let lastErr: unknown;

  // Tier 1
  try {
    return await runTextAgentStreaming(agent, messages, onChunk);
  } catch (err) {
    lastErr = err;
    console.warn('[Ember] Streaming Tier 1 failed:', err);
  }

  // Tier 2: retry (skip on client errors)
  if (!isClientError(lastErr)) {
    await delay(backoffForError(lastErr, 1000));
    try {
      return await runTextAgentStreaming(agent, messages, onChunk);
    } catch (err) {
      lastErr = err;
      console.warn('[Ember] Streaming Tier 2 failed:', err);
    }
  }

  // Tier 3: model-aware fallback (non-streaming for reliability)
  const fb = fallbackFor(agent.model);
  try {
    const fallback: AgentConfig = { ...agent, model: fb };
    const result = await runTextAgent(fallback, messages);
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
