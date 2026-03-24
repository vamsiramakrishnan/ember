/**
 * Gemma Service — ultra-lightweight model for micro-tasks.
 *
 * Uses gemma-3-1b-it via the Gemini API for tasks that don't need
 * the full power of Flash: cell tagging, status narration, classification.
 *
 * Key constraint: Gemma does NOT support JSON mode (responseMimeType).
 * All structured output uses the json-cast module to extract JSON
 * from freeform text responses.
 *
 * Cost: ~10x cheaper than flash-lite. Latency: ~2-3x faster on small prompts.
 */
import { getGeminiClient, isGeminiAvailable, MODELS } from './gemini';
import { useProxy } from './proxy-client';
import { readNdjsonStream } from './ndjson-stream';
import { castJson } from './json-cast';

export interface GemmaConfig {
  systemInstruction?: string;
  maxOutputTokens?: number;
}

type ChunkCb = (chunk: string, accumulated: string) => void;

/**
 * Run a single prompt through Gemma. Returns raw text.
 */
export async function gemmaGenerate(
  prompt: string, config?: GemmaConfig,
): Promise<string> {
  return gemmaStream(prompt, undefined, config);
}

/**
 * Run a prompt and extract JSON from the response.
 * Returns null if no valid JSON could be extracted.
 */
export async function gemmaGenerateJson<T = unknown>(
  prompt: string, config?: GemmaConfig,
): Promise<T | null> {
  const raw = await gemmaGenerate(prompt, config);
  return castJson<T>(raw);
}

/**
 * Stream text from Gemma, calling onChunk for each piece.
 * Returns the full accumulated text.
 */
export async function gemmaStream(
  prompt: string, onChunk?: ChunkCb, config?: GemmaConfig,
): Promise<string> {
  if (!isGeminiAvailable()) throw new Error('No AI service available');
  return useProxy()
    ? gemmaViaProxy(prompt, config, onChunk)
    : gemmaViaSdk(prompt, config, onChunk);
}

// ─── Direct SDK path ────────────────────────────────────

function buildGemmaConfig(config?: GemmaConfig): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (config?.systemInstruction) out.systemInstruction = config.systemInstruction;
  if (config?.maxOutputTokens) out.maxOutputTokens = config.maxOutputTokens;
  return out;
}

async function gemmaViaSdk(
  prompt: string, config?: GemmaConfig, onChunk?: ChunkCb,
): Promise<string> {
  const client = getGeminiClient();
  if (!client) throw new Error('Gemini API key not configured');

  const response = await client.models.generateContentStream({
    model: MODELS.gemma,
    config: buildGemmaConfig(config),
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });

  let accumulated = '';
  for await (const chunk of response) {
    const parts = chunk.candidates?.[0]?.content?.parts;
    if (!parts) continue;
    for (const part of parts) {
      if ('text' in part && part.text) {
        accumulated += part.text;
        onChunk?.(part.text, accumulated);
      }
    }
  }
  return accumulated;
}

// ─── Proxy path (production) ────────────────────────────

async function gemmaViaProxy(
  prompt: string, config?: GemmaConfig, onChunk?: ChunkCb,
): Promise<string> {
  const res = await fetch('/api/gemini-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', parts: [{ text: prompt }] }],
      model: MODELS.gemma,
      systemInstruction: config?.systemInstruction,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(
      () => ({ error: res.statusText }),
    ) as { error: string };
    throw new Error(`Gemma proxy error: ${err.error}`);
  }
  return readNdjsonStream(res, onChunk);
}
