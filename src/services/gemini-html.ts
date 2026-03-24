/**
 * Gemini HTML generation service.
 * Uses gemini-3-flash-preview with high thinking for generating
 * beautiful HTML representations of concepts, diagrams, and
 * visual explanations — all aligned with Ember's warm notebook aesthetic.
 *
 * Supports dual-mode: direct SDK (dev) or server proxy (production).
 */
import { getGeminiClient } from './gemini';
import { useProxy, proxyHtmlGeneration } from './proxy-client';
import { EMBER_STYLE_CONTEXT } from './token-context';

export const HTML_MODEL = 'gemini-3-flash-preview';

export interface HtmlGenerationOptions {
  /** What to generate — description of the concept or visual. */
  prompt: string;
  /** Additional context about the student's current exploration. */
  context?: string;
  /** Enable Google Search for factual grounding. */
  useSearch?: boolean;
}

/**
 * Generate a self-contained HTML representation of a concept.
 * Uses high thinking for thoughtful, well-crafted output.
 * Returns a complete HTML string ready to render in an iframe or shadow DOM.
 */
export async function generateHtml(
  options: HtmlGenerationOptions,
): Promise<string> {
  // Proxy path
  if (useProxy()) {
    const html = await proxyHtmlGeneration({
      prompt: options.prompt,
      context: options.context,
      useSearch: options.useSearch,
    });
    return html.replace(/^```html\s*/i, '').replace(/```\s*$/i, '').trim();
  }

  const client = getGeminiClient();
  if (!client) {
    throw new Error('Gemini API key not configured');
  }

  const tools: Record<string, unknown>[] = [];
  if (options.useSearch) {
    tools.push({ googleSearch: {} });
  }

  const config: Record<string, unknown> = {
    thinkingConfig: {
      thinkingLevel: 'HIGH',
    },
  };
  if (tools.length > 0) {
    config.tools = tools;
  }

  const componentRef = `
You have a pre-built component library available. Use these custom HTML elements:
- <ember-card accent="sage|indigo|amber|margin"> with .card-title, .card-meta, .card-body
- <ember-timeline> with .tl-item, .tl-dot, .tl-date, .tl-title, .tl-content
- <ember-carousel> with .carousel-track containing cards
- <ember-compare> with two children and .compare-header
- <ember-quote> with .quote-text and .quote-attr
- <ember-node> with .node-label and .node-sub
- <ember-tree> with .tree-label, .tree-node, .tree-leaf

The CSS for these components is already injected. Generate ONLY the <body> content using these components.
For custom visuals (charts, spatial diagrams), use inline SVG with Ember colour tokens.
`;

  const fullPrompt = `Generate the body content for a visualization page. The component CSS is pre-injected — you only need to write the HTML body content.

${EMBER_STYLE_CONTEXT}

${componentRef}

${options.context ? `Student context: ${options.context}\n\n` : ''}Concept to visualise: ${options.prompt}

Return ONLY the body HTML — no <!DOCTYPE>, no <html>, no <head> tags. Just the content that goes inside <body>.`;

  const contents = [
    {
      role: 'user' as const,
      parts: [{ text: fullPrompt }],
    },
  ];

  const response = await client.models.generateContentStream({
    model: HTML_MODEL,
    config,
    contents,
  });

  const chunks: string[] = [];
  for await (const chunk of response) {
    if (chunk.text) {
      chunks.push(chunk.text);
    }
  }

  let html = chunks.join('');
  html = html.replace(/^```html\s*/i, '').replace(/```\s*$/i, '').trim();

  return html;
}
