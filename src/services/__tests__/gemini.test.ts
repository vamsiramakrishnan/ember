/**
 * Tests for gemini.ts — core Gemini client, availability checks,
 * and text generation functions.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContentStream: vi.fn(),
    },
  })),
}));

vi.mock('../proxy-client', () => ({
  useProxy: vi.fn(() => false),
  proxyTextGeneration: vi.fn(),
  proxyTextGenerationStream: vi.fn(),
}));

vi.mock('../gemini-helpers', () => ({
  buildToolsArray: vi.fn(() => []),
  buildConfig: vi.fn(() => ({})),
  collectStreamChunks: vi.fn(async () => 'collected text'),
  streamWithCallback: vi.fn(async () => 'streamed text'),
}));

describe('gemini', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  test('MODELS has expected model keys', async () => {
    const { MODELS } = await import('../gemini');
    expect(MODELS.text).toBeDefined();
    expect(MODELS.heavy).toBeDefined();
    expect(MODELS.image).toBeDefined();
    expect(MODELS.fallback).toBeDefined();
    expect(MODELS.gemma).toBeDefined();
  });

  test('isGeminiAvailable returns boolean', async () => {
    const { isGeminiAvailable } = await import('../gemini');
    const result = isGeminiAvailable();
    expect(typeof result).toBe('boolean');
  });

  test('getGeminiClient returns null when no API key', async () => {
    const { getGeminiClient } = await import('../gemini');
    // In test env, VITE_GEMINI_API_KEY is not set
    const client = getGeminiClient();
    expect(client).toBeNull();
  });

  test('generateText uses proxy when useProxy returns true', async () => {
    const proxyClient = await import('../proxy-client');
    vi.mocked(proxyClient.useProxy).mockReturnValue(true);
    vi.mocked(proxyClient.proxyTextGeneration).mockResolvedValue('proxy result');

    const { generateText } = await import('../gemini');
    const result = await generateText({ prompt: 'test' });
    expect(result).toBe('proxy result');
  });

  test('generateTextStream uses proxy when useProxy returns true', async () => {
    const proxyClient = await import('../proxy-client');
    vi.mocked(proxyClient.useProxy).mockReturnValue(true);
    vi.mocked(proxyClient.proxyTextGenerationStream).mockResolvedValue('streamed');

    const { generateTextStream } = await import('../gemini');
    const onChunk = vi.fn();
    const result = await generateTextStream({ prompt: 'test', onChunk });
    expect(result).toBe('streamed');
  });

  test('generateTextWithHistory uses proxy path', async () => {
    const proxyClient = await import('../proxy-client');
    vi.mocked(proxyClient.useProxy).mockReturnValue(true);
    vi.mocked(proxyClient.proxyTextGeneration).mockResolvedValue('history result');

    const { generateTextWithHistory } = await import('../gemini');
    const result = await generateTextWithHistory([
      { role: 'user', text: 'hello' },
    ]);
    expect(result).toBe('history result');
  });

  test('GeminiTextOptions interface accepted by generateText', async () => {
    const proxyClient = await import('../proxy-client');
    vi.mocked(proxyClient.useProxy).mockReturnValue(true);
    vi.mocked(proxyClient.proxyTextGeneration).mockResolvedValue('ok');

    const { generateText } = await import('../gemini');
    const result = await generateText({
      prompt: 'test',
      systemInstruction: 'Be helpful',
      useSearch: true,
      model: 'custom-model',
    });
    expect(result).toBe('ok');
  });
});
