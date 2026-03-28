/**
 * Tests for gemma — ultra-lightweight model service.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('../gemini', () => ({
  getGeminiClient: vi.fn(() => null),
  isGeminiAvailable: vi.fn(() => false),
  MODELS: { gemma: 'gemma-3-1b-it' },
}));

vi.mock('../proxy-client', () => ({
  useProxy: vi.fn(() => false),
}));

vi.mock('../ndjson-stream', () => ({
  readNdjsonStream: vi.fn(async () => 'ndjson result'),
}));

vi.mock('../json-cast', () => ({
  castJson: vi.fn((raw: string) => {
    try { return JSON.parse(raw); } catch { return null; }
  }),
}));

describe('gemma', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  test('gemmaGenerate throws when AI not available', async () => {
    const { gemmaGenerate } = await import('../gemma');
    await expect(gemmaGenerate('test')).rejects.toThrow('No AI service available');
  });

  test('gemmaStream throws when AI not available', async () => {
    const { gemmaStream } = await import('../gemma');
    await expect(gemmaStream('test')).rejects.toThrow('No AI service available');
  });

  test('gemmaGenerateJson returns null for unparseable response', async () => {
    const gemini = await import('../gemini');
    vi.mocked(gemini.isGeminiAvailable).mockReturnValue(true);

    const proxyClient = await import('../proxy-client');
    vi.mocked(proxyClient.useProxy).mockReturnValue(true);

    // Mock fetch for the proxy path
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      body: { getReader: () => ({ read: vi.fn().mockResolvedValue({ done: true }) }) },
    });
    vi.stubGlobal('fetch', mockFetch);

    const ndjson = await import('../ndjson-stream');
    vi.mocked(ndjson.readNdjsonStream).mockResolvedValue('not json at all');

    const { gemmaGenerateJson } = await import('../gemma');
    const result = await gemmaGenerateJson('test');
    expect(result).toBeNull();
  });

  test('GemmaConfig interface accepts systemInstruction and maxOutputTokens', () => {
    const config: import('../gemma').GemmaConfig = {
      systemInstruction: 'Be concise',
      maxOutputTokens: 256,
    };
    expect(config.systemInstruction).toBe('Be concise');
    expect(config.maxOutputTokens).toBe(256);
  });
});
