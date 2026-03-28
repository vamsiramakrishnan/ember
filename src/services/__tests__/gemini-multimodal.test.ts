/**
 * Tests for gemini-multimodal — image analysis and text extraction.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('../gemini', () => ({
  getGeminiClient: vi.fn(() => null),
  MODELS: { text: 'gemini-3.1-flash-lite-preview' },
}));

vi.mock('../proxy-client', () => ({
  useProxy: vi.fn(() => false),
  proxyMultimodalAnalysis: vi.fn(),
}));

vi.mock('../tutor-prompt', () => ({
  TUTOR_SYSTEM_PROMPT: 'mock tutor prompt',
}));

describe('gemini-multimodal', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  test('analyseImage uses proxy when useProxy returns true', async () => {
    const proxyClient = await import('../proxy-client');
    vi.mocked(proxyClient.useProxy).mockReturnValue(true);
    vi.mocked(proxyClient.proxyMultimodalAnalysis).mockResolvedValue('analysis result');

    const { analyseImage } = await import('../gemini-multimodal');
    const result = await analyseImage({
      imageData: 'base64data',
      mimeType: 'image/png',
    });
    expect(result).toBe('analysis result');
  });

  test('analyseImage passes prompt when provided', async () => {
    const proxyClient = await import('../proxy-client');
    vi.mocked(proxyClient.useProxy).mockReturnValue(true);
    vi.mocked(proxyClient.proxyMultimodalAnalysis).mockResolvedValue('ok');

    const { analyseImage } = await import('../gemini-multimodal');
    await analyseImage({
      imageData: 'data',
      mimeType: 'image/jpeg',
      prompt: 'What is this?',
    });

    expect(vi.mocked(proxyClient.proxyMultimodalAnalysis)).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: 'What is this?' }),
    );
  });

  test('analyseImage throws when no client and not using proxy', async () => {
    const proxyClient = await import('../proxy-client');
    vi.mocked(proxyClient.useProxy).mockReturnValue(false);

    const { analyseImage } = await import('../gemini-multimodal');
    await expect(
      analyseImage({ imageData: 'data', mimeType: 'image/png' }),
    ).rejects.toThrow('Gemini API key not configured');
  });

  test('extractTextFromImage uses proxy path', async () => {
    const proxyClient = await import('../proxy-client');
    vi.mocked(proxyClient.useProxy).mockReturnValue(true);
    vi.mocked(proxyClient.proxyMultimodalAnalysis).mockResolvedValue('extracted text');

    const { extractTextFromImage } = await import('../gemini-multimodal');
    const result = await extractTextFromImage('base64', 'image/png');
    expect(result).toBe('extracted text');
  });

  test('extractTextFromImage throws when no client and not proxy', async () => {
    const proxyClient = await import('../proxy-client');
    vi.mocked(proxyClient.useProxy).mockReturnValue(false);

    const { extractTextFromImage } = await import('../gemini-multimodal');
    await expect(
      extractTextFromImage('data', 'image/png'),
    ).rejects.toThrow('Gemini API key not configured');
  });
});
