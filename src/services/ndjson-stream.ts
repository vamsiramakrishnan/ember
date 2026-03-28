/**
 * NDJSON stream reader — shared helper for parsing newline-delimited
 * JSON streams from the Vercel Edge Function proxy endpoints.
 *
 * Extracts text chunks from the stream, optionally calling a callback
 * for each chunk (streaming mode) or just collecting them (batch mode).
 */

/**
 * Read an NDJSON stream from a Response body, extracting text chunks.
 *
 * @param response - The fetch Response whose body contains NDJSON lines
 *   with `{ text?: string }` payloads.
 * @param onChunk - Optional callback invoked for each text chunk with
 *   the chunk text and the accumulated full text so far.
 * @returns The full accumulated text from all chunks.
 */
export async function readNdjsonStream(
  response: Response,
  onChunk?: (chunk: string, accumulated: string) => void,
): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let accumulated = '';
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        accumulated = parseLine(line, accumulated, onChunk);
      }
    }

    // Process any remaining buffer
    if (buffer.trim()) {
      accumulated = parseLine(buffer, accumulated, onChunk);
    }
  } finally {
    reader.releaseLock();
  }

  return accumulated;
}

/** Parse a single NDJSON line. Returns updated accumulated text. */
function parseLine(
  line: string,
  accumulated: string,
  onChunk?: (chunk: string, accumulated: string) => void,
): string {
  if (!line.trim()) return accumulated;
  try {
    const parsed = JSON.parse(line) as { text?: string };
    if (parsed.text) {
      accumulated += parsed.text;
      onChunk?.(parsed.text, accumulated);
    }
  } catch {
    // skip malformed lines
  }
  return accumulated;
}
