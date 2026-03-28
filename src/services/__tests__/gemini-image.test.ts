/**
 * Tests for gemini-image — image generation via Gemini.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('../gemini', () => ({
  getGeminiClient: vi.fn(() => null),
  MODELS: { image: 'gemini-3.1-flash-image-preview' },
}));

vi.mock('../proxy-client', () => ({
  useProxy: vi.fn(() => false),
  proxyImageGeneration: vi.fn(),
}));

describe('gemini-image', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  test('generateImage uses proxy when useProxy returns true', async () => {
    const proxyClient = await import('../proxy-client');
    vi.mocked(proxyClient.useProxy).mockReturnValue(true);
    vi.mocked(proxyClient.proxyImageGeneration).mockResolvedValue({
      images: [{ data: 'base64', mimeType: 'image/png' }],
      text: 'description',
    });

    const { generateImage } = await import('../gemini-image');
    const result = await generateImage({ prompt: 'a concept' });
    expect(result.images).toHaveLength(1);
    expect(result.text).toBe('description');
  });

  test('generateImage throws when no client and not using proxy', async () => {
    const proxyClient = await import('../proxy-client');
    vi.mocked(proxyClient.useProxy).mockReturnValue(false);

    const { generateImage } = await import('../gemini-image');
    await expect(generateImage({ prompt: 'test' })).rejects.toThrow(
      'Gemini API key not configured',
    );
  });

  test('generateImage passes aspect ratio and image size to proxy', async () => {
    const proxyClient = await import('../proxy-client');
    vi.mocked(proxyClient.useProxy).mockReturnValue(true);
    vi.mocked(proxyClient.proxyImageGeneration).mockResolvedValue({
      images: [],
      text: '',
    });

    const { generateImage } = await import('../gemini-image');
    await generateImage({
      prompt: 'test',
      aspectRatio: '16:9',
      imageSize: '1K',
    });

    expect(vi.mocked(proxyClient.proxyImageGeneration)).toHaveBeenCalledWith(
      expect.objectContaining({
        aspectRatio: '16:9',
        imageSize: '1K',
      }),
    );
  });

  test('GeneratedImage interface shape', async () => {
    const img: import('../gemini-image').GeneratedImage = {
      data: 'abc',
      mimeType: 'image/jpeg',
    };
    expect(img.data).toBe('abc');
    expect(img.mimeType).toBe('image/jpeg');
  });
});
