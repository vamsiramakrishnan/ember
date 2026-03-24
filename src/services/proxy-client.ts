/**
 * Proxy client — calls the Vercel Edge Function API routes
 * instead of the Gemini SDK directly. Keeps the API key server-side.
 *
 * In development with VITE_GEMINI_API_KEY set, falls back to direct
 * SDK calls for convenience. In production (no VITE_ key), uses the proxy.
 */
import { readNdjsonStream } from './ndjson-stream';
import type { Tool } from '@google/genai';

/** Whether we should use the server-side proxy. */
export function useProxy(): boolean {
  const clientKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  return !clientKey;
}

/** Base URL for API routes (empty string = same origin). */
const API_BASE = '';

/** Shared request body shape for text generation endpoints. */
interface TextGenBody {
  messages: Array<{ role: string; parts: Array<{ text?: string }> }>;
  model?: string;
  systemInstruction?: string;
  thinkingLevel?: string;
  tools?: Tool[];
}

/** POST JSON to an API route; throw on non-OK response. */
async function postJson(path: string, body: unknown): Promise<Response> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({
      error: res.statusText,
    })) as { error: string };
    throw new Error(`Proxy error: ${err.error}`);
  }

  return res;
}

/**
 * Stream text from the /api/gemini-text endpoint.
 * Returns collected text chunks.
 */
export async function proxyTextGeneration(
  body: TextGenBody,
): Promise<string> {
  const res = await postJson('/api/gemini-text', body);
  return readNdjsonStream(res);
}

/**
 * Stream text from the /api/gemini-text endpoint, yielding chunks.
 */
export async function proxyTextGenerationStream(
  body: TextGenBody,
  onChunk: (chunk: string, accumulated: string) => void,
): Promise<string> {
  const res = await postJson('/api/gemini-text', body);
  return readNdjsonStream(res, onChunk);
}

/** Generate images via /api/gemini-image (NDJSON streaming to avoid 25s timeout). */
export async function proxyImageGeneration(body: {
  prompt: string;
  useSearch?: boolean;
  aspectRatio?: string;
  imageSize?: string;
  systemInstruction?: string;
}): Promise<{
  images: Array<{ data: string; mimeType: string }>;
  text: string;
}> {
  const res = await postJson('/api/gemini-image', body);
  return readImageNdjson(res);
}

/** Parse NDJSON from the image endpoint. Skips heartbeats, returns final result. */
async function readImageNdjson(res: Response): Promise<{
  images: Array<{ data: string; mimeType: string }>;
  text: string;
}> {
  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';
  let result: { images: Array<{ data: string; mimeType: string }>; text: string } | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const parsed = JSON.parse(trimmed) as Record<string, unknown>;
        if (parsed.error) throw new Error(String(parsed.error));
        if (parsed.status === 'generating') continue; // heartbeat — skip
        if (Array.isArray(parsed.images)) {
          result = parsed as { images: Array<{ data: string; mimeType: string }>; text: string };
        }
      } catch (e) {
        if (e instanceof Error && e.message !== trimmed) throw e;
      }
    }
  }

  if (!result) throw new Error('No image data received');
  return result;
}

/** Generate HTML via /api/gemini-html. Streams the HTML string. */
export async function proxyHtmlGeneration(body: {
  prompt: string;
  context?: string;
  useSearch?: boolean;
}): Promise<string> {
  const res = await postJson('/api/gemini-html', body);
  return res.text();
}

/**
 * Stream speech audio via /api/gemini-tts.
 * Returns the raw streaming Response for the caller to read with
 * readAudioStream(). This keeps the connection alive and avoids
 * buffering the entire audio in memory on the proxy side.
 */
export async function proxyTtsStream(body: {
  script: string;
  speakers: Array<{ speaker: string; voiceName: string }>;
  model?: string;
}): Promise<Response> {
  return postJson('/api/gemini-tts', body);
}

/** Analyse an image via /api/gemini-multimodal. */
export async function proxyMultimodalAnalysis(body: {
  imageData: string;
  mimeType: string;
  prompt?: string;
  systemInstruction?: string;
  useSearch?: boolean;
  mode?: 'analyse' | 'extract';
}): Promise<string> {
  const res = await postJson('/api/gemini-multimodal', body);
  const data = await res.json() as { text: string };
  return data.text;
}
