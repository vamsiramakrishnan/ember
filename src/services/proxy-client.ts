/**
 * Proxy client — calls the Vercel Edge Function API routes
 * instead of the Gemini SDK directly. Keeps the API key server-side.
 *
 * In development with VITE_GEMINI_API_KEY set, falls back to direct
 * SDK calls for convenience. In production (no VITE_ key), uses the proxy.
 */

/** Whether we should use the server-side proxy. */
export function useProxy(): boolean {
  // If no client-side key, we must use the proxy
  const clientKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  return !clientKey;
}

/** Base URL for API routes (empty string = same origin). */
const API_BASE = '';

/**
 * Stream text from the /api/gemini-text endpoint.
 * Returns collected text chunks.
 */
export async function proxyTextGeneration(body: {
  messages: Array<{ role: string; parts: Array<{ text?: string }> }>;
  model?: string;
  systemInstruction?: string;
  thinkingLevel?: string;
  tools?: Record<string, unknown>[];
}): Promise<string> {
  const res = await fetch(`${API_BASE}/api/gemini-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText })) as { error: string };
    throw new Error(`Proxy error: ${err.error}`);
  }

  // Read NDJSON stream
  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line) as { text?: string };
        if (parsed.text) chunks.push(parsed.text);
      } catch {
        // skip malformed lines
      }
    }
  }

  // Process any remaining buffer
  if (buffer.trim()) {
    try {
      const parsed = JSON.parse(buffer) as { text?: string };
      if (parsed.text) chunks.push(parsed.text);
    } catch {
      // skip
    }
  }

  return chunks.join('');
}

/**
 * Stream text from the /api/gemini-text endpoint, yielding chunks.
 */
export async function proxyTextGenerationStream(
  body: {
    messages: Array<{ role: string; parts: Array<{ text?: string }> }>;
    model?: string;
    systemInstruction?: string;
    thinkingLevel?: string;
    tools?: Record<string, unknown>[];
  },
  onChunk: (chunk: string, accumulated: string) => void,
): Promise<string> {
  const res = await fetch(`${API_BASE}/api/gemini-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText })) as { error: string };
    throw new Error(`Proxy error: ${err.error}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let accumulated = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line) as { text?: string };
        if (parsed.text) {
          accumulated += parsed.text;
          onChunk(parsed.text, accumulated);
        }
      } catch { /* skip malformed */ }
    }
  }

  if (buffer.trim()) {
    try {
      const parsed = JSON.parse(buffer) as { text?: string };
      if (parsed.text) {
        accumulated += parsed.text;
        onChunk(parsed.text, accumulated);
      }
    } catch { /* skip */ }
  }

  return accumulated;
}

/**
 * Generate images via /api/gemini-image.
 */
export async function proxyImageGeneration(body: {
  prompt: string;
  useSearch?: boolean;
  aspectRatio?: string;
  imageSize?: string;
}): Promise<{
  images: Array<{ data: string; mimeType: string }>;
  text: string;
}> {
  const res = await fetch(`${API_BASE}/api/gemini-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText })) as { error: string };
    throw new Error(`Proxy error: ${err.error}`);
  }

  return res.json() as Promise<{
    images: Array<{ data: string; mimeType: string }>;
    text: string;
  }>;
}

/**
 * Generate HTML via /api/gemini-html. Streams the HTML string.
 */
export async function proxyHtmlGeneration(body: {
  prompt: string;
  context?: string;
  useSearch?: boolean;
}): Promise<string> {
  const res = await fetch(`${API_BASE}/api/gemini-html`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText })) as { error: string };
    throw new Error(`Proxy error: ${err.error}`);
  }

  return res.text();
}

/**
 * Analyse an image via /api/gemini-multimodal.
 */
export async function proxyMultimodalAnalysis(body: {
  imageData: string;
  mimeType: string;
  prompt?: string;
  systemInstruction?: string;
  useSearch?: boolean;
  mode?: 'analyse' | 'extract';
}): Promise<string> {
  const res = await fetch(`${API_BASE}/api/gemini-multimodal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText })) as { error: string };
    throw new Error(`Proxy error: ${err.error}`);
  }

  const data = await res.json() as { text: string };
  return data.text;
}
