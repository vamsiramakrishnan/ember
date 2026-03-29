/**
 * Gemini API client — core service for AI-powered tutor responses.
 * Uses the Interactions API for text generation with typed SSE streaming.
 *
 * Supports dual-mode: direct SDK (dev) or server proxy (production).
 * The proxy path still uses the legacy generateContent format.
 */
import { GoogleGenAI } from '@google/genai';
import type { Interactions } from '@google/genai';
import { buildToolsArray } from './gemini-helpers';
import { convertToolsToInteractions, extractDeltaText, isCompleteEvent } from './gemini-interactions';
import { useProxy, proxyTextGeneration, proxyTextGenerationStream } from './proxy-client';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
let clientInstance: GoogleGenAI | null = null;

/** Returns the singleton Gemini client, or null if no API key is set. */
export function getGeminiClient(): GoogleGenAI | null {
  if (!API_KEY) return null;
  if (!clientInstance) clientInstance = new GoogleGenAI({ apiKey: API_KEY });
  return clientInstance;
}

/** Whether Gemini is available (client-side key or production proxy). */
export function isGeminiAvailable(): boolean {
  return !!API_KEY || import.meta.env.PROD === true;
}

/** Models used by Ember. */
export const MODELS = {
  text: 'gemini-3.1-flash-lite-preview',
  /** Heavy model for research, critique, and HTML generation. */
  heavy: 'gemini-3-flash-preview',
  image: 'gemini-3.1-flash-image-preview',
  /** Fallback when gemini-3.1-flash-lite-preview fails with error codes. */
  fallback: 'gemini-2.5-flash-lite',
  /** Ultra-lightweight model for cell tagging, status narration, classification. */
  gemma: 'gemma-3-1b-it',
} as const;

export interface GeminiTextOptions {
  prompt: string;
  systemInstruction?: string;
  useSearch?: boolean;
  useUrlContext?: boolean;
  useCodeExecution?: boolean;
  model?: string;
  /** Chain to a previous interaction for server-side state. */
  previousInteractionId?: string;
}

/** Require a valid client or throw. */
function requireClient(): GoogleGenAI {
  const client = getGeminiClient();
  if (!client) throw new Error('Gemini API key not configured');
  return client;
}

/** Build Interactions API tools from boolean flags. */
function buildInteractionTools(
  opts?: Pick<GeminiTextOptions, 'useSearch' | 'useUrlContext' | 'useCodeExecution'>,
): Interactions.Tool[] {
  const legacy = buildToolsArray(opts);
  return convertToolsToInteractions(legacy);
}

/** Build contents array from a single prompt string (for proxy path). */
function promptContents(prompt: string) {
  return [{ role: 'user' as const, parts: [{ text: prompt }] }];
}

/** Build contents array from a message history (for proxy path). */
function historyContents(
  messages: Array<{ role: 'user' | 'model'; text: string }>,
) {
  return messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] }));
}

// ─── Interactions API streaming helpers ─────────────────────────

/** Collect all text from a streaming interaction. */
async function collectInteractionStream(
  stream: AsyncIterable<Interactions.InteractionSSEEvent>,
): Promise<{ text: string; interactionId: string }> {
  const chunks: string[] = [];
  let interactionId = '';
  for await (const event of stream) {
    const text = extractDeltaText(event);
    if (text) chunks.push(text);
    if (isCompleteEvent(event)) {
      interactionId = event.interaction.id;
    }
  }
  return { text: chunks.join(''), interactionId };
}

/** Stream text from an interaction, calling onChunk for each piece. */
async function streamInteractionWithCallback(
  stream: AsyncIterable<Interactions.InteractionSSEEvent>,
  onChunk: (chunk: string, accumulated: string) => void,
): Promise<{ text: string; interactionId: string }> {
  let accumulated = '';
  let interactionId = '';
  for await (const event of stream) {
    const text = extractDeltaText(event);
    if (text) {
      accumulated += text;
      onChunk(text, accumulated);
    }
    if (isCompleteEvent(event)) {
      interactionId = event.interaction.id;
    }
  }
  return { text: accumulated, interactionId };
}

// ─── Public API ─────────────────────────────────────────────────

/** Generate text using the Interactions API. Returns the full response text. */
export async function generateText(
  options: GeminiTextOptions,
): Promise<string> {
  if (useProxy()) {
    return proxyTextGeneration({
      messages: promptContents(options.prompt),
      model: options.model,
      systemInstruction: options.systemInstruction,
    });
  }

  const client = requireClient();
  const tools = buildInteractionTools(options);
  const stream = await client.interactions.create({
    model: options.model ?? MODELS.text,
    input: options.prompt,
    system_instruction: options.systemInstruction,
    tools: tools.length > 0 ? tools : undefined,
    previous_interaction_id: options.previousInteractionId,
    stream: true,
  });
  const result = await collectInteractionStream(stream);
  return result.text;
}

/** Stream text using the Interactions API. Yields chunks via callback. */
export async function generateTextStream(
  options: GeminiTextOptions & {
    onChunk: (chunk: string, accumulated: string) => void;
  },
): Promise<string> {
  if (useProxy()) {
    return proxyTextGenerationStream({
      messages: promptContents(options.prompt),
      model: options.model,
      systemInstruction: options.systemInstruction,
    }, options.onChunk);
  }

  const client = requireClient();
  const tools = buildInteractionTools(options);
  const stream = await client.interactions.create({
    model: options.model ?? MODELS.text,
    input: options.prompt,
    system_instruction: options.systemInstruction,
    tools: tools.length > 0 ? tools : undefined,
    previous_interaction_id: options.previousInteractionId,
    stream: true,
  });
  const result = await streamInteractionWithCallback(stream, options.onChunk);
  return result.text;
}

/** Generate text with conversation history. Collects all chunks. */
export async function generateTextWithHistory(
  messages: Array<{ role: 'user' | 'model'; text: string }>,
  options?: Omit<GeminiTextOptions, 'prompt'>,
): Promise<string> {
  if (useProxy()) {
    return proxyTextGeneration({
      messages: historyContents(messages),
      model: options?.model,
      systemInstruction: options?.systemInstruction,
    });
  }

  const client = requireClient();
  const tools = buildInteractionTools(options);

  // Build Turn-based input from message history for Interactions API
  const turns: Interactions.Turn[] = messages.map((m) => ({
    role: m.role === 'model' ? 'model' : 'user',
    parts: [{ type: 'text' as const, text: m.text }],
  }));

  const stream = await client.interactions.create({
    model: options?.model ?? MODELS.text,
    input: turns,
    system_instruction: options?.systemInstruction,
    tools: tools.length > 0 ? tools : undefined,
    previous_interaction_id: options?.previousInteractionId,
    stream: true,
  });
  const result = await collectInteractionStream(stream);
  return result.text;
}

/** Stream text with conversation history. Yields chunks via callback. */
export async function generateTextStreamWithHistory(
  messages: Array<{ role: 'user' | 'model'; text: string }>,
  options?: Omit<GeminiTextOptions, 'prompt'> & {
    onChunk?: (chunk: string, accumulated: string) => void;
  },
): Promise<string> {
  if (useProxy()) {
    const onChunk = options?.onChunk;
    if (onChunk) {
      return proxyTextGenerationStream({
        messages: historyContents(messages),
        model: options?.model,
        systemInstruction: options?.systemInstruction,
      }, onChunk);
    }
    return proxyTextGeneration({
      messages: historyContents(messages),
      model: options?.model,
      systemInstruction: options?.systemInstruction,
    });
  }

  const client = requireClient();
  const tools = buildInteractionTools(options);

  const turns: Interactions.Turn[] = messages.map((m) => ({
    role: m.role === 'model' ? 'model' : 'user',
    parts: [{ type: 'text' as const, text: m.text }],
  }));

  const stream = await client.interactions.create({
    model: options?.model ?? MODELS.text,
    input: turns,
    system_instruction: options?.systemInstruction,
    tools: tools.length > 0 ? tools : undefined,
    previous_interaction_id: options?.previousInteractionId,
    stream: true,
  });

  const onChunk = options?.onChunk;
  if (onChunk) {
    const result = await streamInteractionWithCallback(stream, onChunk);
    return result.text;
  }
  const result = await collectInteractionStream(stream);
  return result.text;
}
