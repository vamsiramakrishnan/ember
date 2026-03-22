/**
 * Gemini API client — core service for AI-powered tutor responses.
 * Uses Google's GenAI SDK with gemini-3.1-flash-lite-preview for text
 * and gemini-3.1-flash-image-preview for image generation.
 *
 * Supports: text generation, Google Search grounding, URL context,
 * and code execution tools.
 */
import { GoogleGenAI } from '@google/genai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

let clientInstance: GoogleGenAI | null = null;

/** Returns the singleton Gemini client, or null if no API key is set. */
export function getGeminiClient(): GoogleGenAI | null {
  if (!API_KEY) return null;
  if (!clientInstance) {
    clientInstance = new GoogleGenAI({ apiKey: API_KEY });
  }
  return clientInstance;
}

/**
 * Whether Gemini is available — either via client-side key (dev)
 * or via server-side proxy (production on Vercel).
 * In production, we assume the proxy is available.
 */
export function isGeminiAvailable(): boolean {
  // Client-side key available (local dev)
  if (API_KEY) return true;
  // In production (no VITE_ key), assume proxy routes are deployed
  if (import.meta.env.PROD) return true;
  return false;
}

/** Models used by Ember. */
export const MODELS = {
  text: 'gemini-3.1-flash-lite-preview',
  image: 'gemini-3.1-flash-image-preview',
} as const;

export interface GeminiTextOptions {
  /** The prompt to send. */
  prompt: string;
  /** System instruction for the model. */
  systemInstruction?: string;
  /** Enable Google Search grounding. */
  useSearch?: boolean;
  /** Enable URL context tool. */
  useUrlContext?: boolean;
  /** Enable code execution tool. */
  useCodeExecution?: boolean;
  /** Model override — defaults to text model. */
  model?: string;
}

/**
 * Generate text using Gemini. Returns the full response text.
 * Collects all chunks from the stream into a single string.
 */
export async function generateText(
  options: GeminiTextOptions,
): Promise<string> {
  const client = getGeminiClient();
  if (!client) {
    throw new Error('Gemini API key not configured');
  }

  const tools: Record<string, unknown>[] = [];
  if (options.useSearch) {
    tools.push({ googleSearch: {} });
  }
  if (options.useUrlContext) {
    tools.push({ urlContext: {} });
  }
  if (options.useCodeExecution) {
    tools.push({ codeExecution: {} });
  }

  const config: Record<string, unknown> = {};
  if (tools.length > 0) {
    config.tools = tools;
  }
  if (options.systemInstruction) {
    config.systemInstruction = options.systemInstruction;
  }

  const contents = [
    {
      role: 'user' as const,
      parts: [{ text: options.prompt }],
    },
  ];

  const response = await client.models.generateContentStream({
    model: options.model ?? MODELS.text,
    config,
    contents,
  });

  const chunks: string[] = [];
  for await (const chunk of response) {
    const parts = chunk.candidates?.[0]?.content?.parts;
    if (!parts) continue;
    for (const part of parts) {
      if ('text' in part && part.text) {
        chunks.push(part.text);
      }
    }
  }

  return chunks.join('');
}

/**
 * Generate text with conversation history.
 * Each message has a role ('user' | 'model') and text content.
 */
export async function generateTextWithHistory(
  messages: Array<{ role: 'user' | 'model'; text: string }>,
  options?: Omit<GeminiTextOptions, 'prompt'>,
): Promise<string> {
  const client = getGeminiClient();
  if (!client) {
    throw new Error('Gemini API key not configured');
  }

  const tools: Record<string, unknown>[] = [];
  if (options?.useSearch) {
    tools.push({ googleSearch: {} });
  }
  if (options?.useUrlContext) {
    tools.push({ urlContext: {} });
  }
  if (options?.useCodeExecution) {
    tools.push({ codeExecution: {} });
  }

  const config: Record<string, unknown> = {};
  if (tools.length > 0) {
    config.tools = tools;
  }
  if (options?.systemInstruction) {
    config.systemInstruction = options.systemInstruction;
  }

  const contents = messages.map((m) => ({
    role: m.role,
    parts: [{ text: m.text }],
  }));

  const response = await client.models.generateContentStream({
    model: options?.model ?? MODELS.text,
    config,
    contents,
  });

  const chunks: string[] = [];
  for await (const chunk of response) {
    const parts = chunk.candidates?.[0]?.content?.parts;
    if (!parts) continue;
    for (const part of parts) {
      if ('text' in part && part.text) {
        chunks.push(part.text);
      }
    }
  }

  return chunks.join('');
}
