/**
 * Tests for gemini-html — HTML generation via Gemini.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('../gemini', () => ({
  getGeminiClient: vi.fn(() => null),
}));

vi.mock('../proxy-client', () => ({
  useProxy: vi.fn(() => false),
  proxyHtmlGeneration: vi.fn(),
}));

vi.mock('../token-context', () => ({
  EMBER_STYLE_CONTEXT: 'mock-style-context',
}));

describe('gemini-html', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  test('HTML_MODEL is defined', async () => {
    const { HTML_MODEL } = await import('../gemini-html');
    expect(HTML_MODEL).toBe('gemini-3-flash-preview');
  });

  test('generateHtml uses proxy when useProxy returns true', async () => {
    const proxyClient = await import('../proxy-client');
    vi.mocked(proxyClient.useProxy).mockReturnValue(true);
    vi.mocked(proxyClient.proxyHtmlGeneration).mockResolvedValue(
      '```html\n<div>Hello</div>\n```',
    );

    const { generateHtml } = await import('../gemini-html');
    const result = await generateHtml({ prompt: 'test concept' });
    expect(result).toBe('<div>Hello</div>');
  });

  test('generateHtml strips markdown fences from proxy response', async () => {
    const proxyClient = await import('../proxy-client');
    vi.mocked(proxyClient.useProxy).mockReturnValue(true);
    vi.mocked(proxyClient.proxyHtmlGeneration).mockResolvedValue(
      '```html\n<p>content</p>\n```',
    );

    const { generateHtml } = await import('../gemini-html');
    const result = await generateHtml({ prompt: 'test' });
    expect(result).not.toContain('```');
    expect(result).toBe('<p>content</p>');
  });

  test('generateHtml throws when no client and not using proxy', async () => {
    const proxyClient = await import('../proxy-client');
    vi.mocked(proxyClient.useProxy).mockReturnValue(false);

    const gemini = await import('../gemini');
    vi.mocked(gemini.getGeminiClient).mockReturnValue(null);

    const { generateHtml } = await import('../gemini-html');
    await expect(generateHtml({ prompt: 'test' })).rejects.toThrow(
      'Gemini API key not configured',
    );
  });

  test('generateHtml passes context when provided', async () => {
    const proxyClient = await import('../proxy-client');
    vi.mocked(proxyClient.useProxy).mockReturnValue(true);
    vi.mocked(proxyClient.proxyHtmlGeneration).mockResolvedValue('<div>ok</div>');

    const { generateHtml } = await import('../gemini-html');
    await generateHtml({ prompt: 'test', context: 'student context' });

    expect(vi.mocked(proxyClient.proxyHtmlGeneration)).toHaveBeenCalledWith(
      expect.objectContaining({ context: 'student context' }),
    );
  });
});
