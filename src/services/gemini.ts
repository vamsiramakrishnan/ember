/**
 * Gemini API client — core service for AI-powered tutor responses.
 * Supports: text generation, Google Search grounding, URL context,
 * and code execution tools.
 *
 * Supports dual-mode: direct SDK (dev) or server proxy (production).
 */
import { GoogleGenAI } from '@google/genai';
import {
  buildToolsArray,
  buildConfig,
  collectStreamChunks,
  streamWithCallback,
} from './gemini-helpers';
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
  image: 'gemini-3.1-flash-image-preview',
  /** Fallback when primary text model fails with error codes. */
  fallback: 'gemini-2.0-flash-lite',
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
}

/** Require a valid client or throw. */
function requireClient(): GoogleGenAI {
  const client = getGeminiClient();
  if (!client) throw new Error('Gemini API key not configured');
  return client;
}

/** Internal: start a streaming content generation request. */
function startStream(
  client: GoogleGenAI,
  contents: Array<{ role: string; parts: Array<{ text: string }> }>,
  opts?: Omit<GeminiTextOptions, 'prompt'>,
) {
  const tools = buildToolsArray(opts);
  const config = buildConfig(opts, tools);
  return client.models.generateContentStream({
    model: opts?.model ?? MODELS.text,
    config,
    contents,
  });
}

/** Build contents array from a single prompt string. */
function promptContents(prompt: string) {
  return [{ role: 'user' as const, parts: [{ text: prompt }] }];
}

/** Build contents array from a message history. */
function historyContents(
  messages: Array<{ role: 'user' | 'model'; text: string }>,
) {
  return messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] }));
}

/** Generate text using Gemini. Returns the full response text. */
export async function generateText(
  options: GeminiTextOptions,
): Promise<string> {
  // Proxy path
  if (useProxy()) {
    return proxyTextGeneration({
      messages: promptContents(options.prompt),
      model: options.model,
      systemInstruction: options.systemInstruction,
    });
  }

  const response = await startStream(
    requireClient(), promptContents(options.prompt), options,
  );
  return collectStreamChunks(response);
}

/** Stream text using Gemini. Yields chunks via callback. */
export async function generateTextStream(
  options: GeminiTextOptions & {
    onChunk: (chunk: string, accumulated: string) => void;
  },
): Promise<string> {
  // Proxy path
  if (useProxy()) {
    return proxyTextGenerationStream({
      messages: promptContents(options.prompt),
      model: options.model,
      systemInstruction: options.systemInstruction,
    }, options.onChunk);
  }

  const response = await startStream(
    requireClient(), promptContents(options.prompt), options,
  );
  return streamWithCallback(response, options.onChunk);
}

/** Generate text with conversation history. Collects all chunks. */
export async function generateTextWithHistory(
  messages: Array<{ role: 'user' | 'model'; text: string }>,
  options?: Omit<GeminiTextOptions, 'prompt'>,
): Promise<string> {
  // Proxy path
  if (useProxy()) {
    return proxyTextGeneration({
      messages: historyContents(messages),
      model: options?.model,
      systemInstruction: options?.systemInstruction,
    });
  }

  const response = await startStream(
    requireClient(), historyContents(messages), options,
  );
  return collectStreamChunks(response);
}

/** Stream text with conversation history. Yields chunks via callback. */
export async function generateTextStreamWithHistory(
  messages: Array<{ role: 'user' | 'model'; text: string }>,
  options?: Omit<GeminiTextOptions, 'prompt'> & {
    onChunk?: (chunk: string, accumulated: string) => void;
  },
): Promise<string> {
  // Proxy path
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

  const response = await startStream(
    requireClient(), historyContents(messages), options,
  );
  const onChunk = options?.onChunk;
  if (onChunk) return streamWithCallback(response, onChunk);
  return collectStreamChunks(response);
}
