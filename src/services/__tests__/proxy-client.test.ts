/**
 * Tests for proxy-client — server-side proxy for Gemini API calls.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('../ndjson-stream', () => ({
  readNdjsonStream: vi.fn(async () => 'streamed text'),
}));

describe('proxy-client', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  test('useProxy returns true when no client-side API key', async () => {
    const { useProxy } = await import('../proxy-client');
    // VITE_GEMINI_API_KEY is not set in test environment
    expect(useProxy()).toBe(true);
  });

  test('proxyTextGeneration calls /api/gemini-text', async () => {
    const ndjson = await import('../ndjson-stream');
    vi.mocked(ndjson.readNdjsonStream).mockResolvedValue('result text');

    const mockResponse = { ok: true, body: {} };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

    const { proxyTextGeneration } = await import('../proxy-client');
    const result = await proxyTextGeneration({
      messages: [{ role: 'user', parts: [{ text: 'hello' }] }],
    });
    expect(result).toBe('result text');
    expect(fetch).toHaveBeenCalledWith(
      '/api/gemini-text',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  test('proxyTextGeneration throws on non-OK response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      statusText: 'Internal Server Error',
      json: vi.fn().mockResolvedValue({ error: 'server error' }),
    }));

    const { proxyTextGeneration } = await import('../proxy-client');
    await expect(
      proxyTextGeneration({ messages: [] }),
    ).rejects.toThrow('Proxy error: server error');
  });

  test('proxyTextGeneration handles json parse failure in error response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      statusText: 'Bad Gateway',
      json: vi.fn().mockRejectedValue(new Error('parse error')),
    }));

    const { proxyTextGeneration } = await import('../proxy-client');
    await expect(
      proxyTextGeneration({ messages: [] }),
    ).rejects.toThrow('Proxy error: Bad Gateway');
  });

  test('proxyTextGenerationStream passes onChunk to readNdjsonStream', async () => {
    const ndjson = await import('../ndjson-stream');
    vi.mocked(ndjson.readNdjsonStream).mockResolvedValue('streamed');

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));

    const { proxyTextGenerationStream } = await import('../proxy-client');
    const onChunk = vi.fn();
    await proxyTextGenerationStream({ messages: [] }, onChunk);
    expect(ndjson.readNdjsonStream).toHaveBeenCalledWith(
      expect.anything(),
      onChunk,
    );
  });

  test('proxyHtmlGeneration calls /api/gemini-html', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue('<div>html</div>'),
    }));

    const { proxyHtmlGeneration } = await import('../proxy-client');
    const result = await proxyHtmlGeneration({ prompt: 'test' });
    expect(result).toBe('<div>html</div>');
  });

  test('proxyMultimodalAnalysis calls /api/gemini-multimodal', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ text: 'analysis' }),
    }));

    const { proxyMultimodalAnalysis } = await import('../proxy-client');
    const result = await proxyMultimodalAnalysis({
      imageData: 'data',
      mimeType: 'image/png',
    });
    expect(result).toBe('analysis');
  });

  test('proxyImageGeneration handles NDJSON with heartbeats', async () => {
    const encoder = new TextEncoder();
    const lines = [
      JSON.stringify({ status: 'generating' }) + '\n',
      JSON.stringify({ images: [{ data: 'img', mimeType: 'image/png' }], text: 'desc' }) + '\n',
    ];

    let readCount = 0;
    const mockReader = {
      read: vi.fn().mockImplementation(async () => {
        if (readCount < lines.length) {
          return { done: false, value: encoder.encode(lines[readCount++]!) };
        }
        return { done: true, value: undefined };
      }),
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      body: { getReader: () => mockReader },
    }));

    const { proxyImageGeneration } = await import('../proxy-client');
    const result = await proxyImageGeneration({ prompt: 'test' });
    expect(result.images).toHaveLength(1);
    expect(result.text).toBe('desc');
  });

  test('proxyImageGeneration throws when no image data received', async () => {
    const encoder = new TextEncoder();
    let readCount = 0;
    const mockReader = {
      read: vi.fn().mockImplementation(async () => {
        if (readCount === 0) {
          readCount++;
          return { done: false, value: encoder.encode(JSON.stringify({ status: 'generating' }) + '\n') };
        }
        return { done: true, value: undefined };
      }),
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      body: { getReader: () => mockReader },
    }));

    const { proxyImageGeneration } = await import('../proxy-client');
    await expect(
      proxyImageGeneration({ prompt: 'test' }),
    ).rejects.toThrow('No image data received');
  });
});
