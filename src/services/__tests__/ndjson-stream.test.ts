/**
 * Tests for ndjson-stream.ts — NDJSON stream reader.
 */
import { describe, it, expect, vi } from 'vitest';
import { readNdjsonStream } from '../ndjson-stream';

/** Build a mock Response from a string body. */
function mockResponse(body: string): Response {
  const encoder = new TextEncoder();
  const chunks = [encoder.encode(body)];
  let index = 0;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(chunks[index++]);
      } else {
        controller.close();
      }
    },
  });
  return new Response(stream);
}

/** Build a mock Response that delivers chunks one at a time. */
function mockChunkedResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const encoded = chunks.map((c) => encoder.encode(c));
  let index = 0;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (index < encoded.length) {
        controller.enqueue(encoded[index++]);
      } else {
        controller.close();
      }
    },
  });
  return new Response(stream);
}

describe('readNdjsonStream', () => {
  it('accumulates text from NDJSON lines', async () => {
    const body = '{"text":"Hello "}\n{"text":"world"}\n';
    const result = await readNdjsonStream(mockResponse(body));
    expect(result).toBe('Hello world');
  });

  it('calls onChunk for each text chunk', async () => {
    const body = '{"text":"A"}\n{"text":"B"}\n';
    const onChunk = vi.fn();
    await readNdjsonStream(mockResponse(body), onChunk);
    expect(onChunk).toHaveBeenCalledTimes(2);
    expect(onChunk).toHaveBeenCalledWith('A', 'A');
    expect(onChunk).toHaveBeenCalledWith('B', 'AB');
  });

  it('skips lines without text field', async () => {
    const body = '{"text":"OK"}\n{"status":"done"}\n';
    const result = await readNdjsonStream(mockResponse(body));
    expect(result).toBe('OK');
  });

  it('skips malformed JSON lines', async () => {
    const body = '{"text":"Good"}\nnot-json\n{"text":" data"}\n';
    const result = await readNdjsonStream(mockResponse(body));
    expect(result).toBe('Good data');
  });

  it('skips empty lines', async () => {
    const body = '\n{"text":"A"}\n\n{"text":"B"}\n\n';
    const result = await readNdjsonStream(mockResponse(body));
    expect(result).toBe('AB');
  });

  it('handles split chunks across boundary', async () => {
    // A line split across two chunks
    const chunks = ['{"text":"He', 'llo"}\n{"text":" world"}\n'];
    const result = await readNdjsonStream(mockChunkedResponse(chunks));
    expect(result).toBe('Hello world');
  });

  it('processes remaining buffer after stream ends', async () => {
    // No trailing newline
    const body = '{"text":"Final"}';
    const result = await readNdjsonStream(mockResponse(body));
    expect(result).toBe('Final');
  });

  it('throws when response has no body', async () => {
    const response = { body: null } as Response;
    await expect(readNdjsonStream(response)).rejects.toThrow('No response body');
  });

  it('returns empty string for empty body', async () => {
    const result = await readNdjsonStream(mockResponse(''));
    expect(result).toBe('');
  });
});
