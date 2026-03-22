/**
 * Gemini HTML generation service.
 * Uses gemini-3-flash-preview with high thinking for generating
 * beautiful HTML representations of concepts, diagrams, and
 * visual explanations — all aligned with Ember's warm notebook aesthetic.
 *
 * Generated HTML follows Ember's design philosophy:
 * - Cormorant Garamond, Crimson Pro, IBM Plex Mono typefaces
 * - Warm paper palette (#FAF6F1, #2C2825, etc.)
 * - No pure black or white, no box shadows, no gradients
 * - Quiet, generous spacing
 */
import { getGeminiClient } from './gemini';

export const HTML_MODEL = 'gemini-3-flash-preview';

/** Ember design tokens injected into the HTML generation prompt. */
const EMBER_STYLE_CONTEXT = `
Use these design tokens for all generated HTML:
- Background: #FAF6F1 (paper)
- Primary text: #2C2825 (ink)
- Soft text: rgba(44, 40, 37, 0.72) (ink-soft)
- Faint text: rgba(44, 40, 37, 0.45) (ink-faint)
- Margin accent: #8B7355 (margin)
- Sage accent: #6B8F71 (sage)
- Indigo accent: #4A5899 (indigo)
- Amber accent: #B8860B (amber)
- Rule lines: rgba(44, 40, 37, 0.12)
- Fonts: 'Cormorant Garamond' for headings, 'Crimson Pro' for body, 'IBM Plex Mono' for code/labels
- Corner radius: 2px max
- No box shadows, no gradients, no pure black or white
- Borders: 1px solid with very low opacity
- Feel: warm, quiet, like a well-typeset notebook page
`;

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
  // Strip any markdown fences if the model wrapped the response
  html = html.replace(/^```html\s*/i, '').replace(/```\s*$/i, '').trim();

  return html;
}
