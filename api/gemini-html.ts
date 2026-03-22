/**
 * /api/gemini-html — Vercel Edge Function proxy for Gemini HTML generation.
 * Uses gemini-3-flash-preview with high thinking for concept visualisation.
 * Keeps the API key server-side.
 */
import { GoogleGenAI } from '@google/genai';

export const config = { runtime: 'edge' };

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

interface HtmlRequestBody {
  prompt: string;
  context?: string;
  useSearch?: boolean;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const apiKey = process.env['GEMINI_API_KEY'];
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'GEMINI_API_KEY not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  let body: HtmlRequestBody;
  try {
    body = await req.json() as HtmlRequestBody;
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  if (!body.prompt) {
    return new Response(
      JSON.stringify({ error: 'prompt is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const client = new GoogleGenAI({ apiKey });

  const tools: Record<string, unknown>[] = [];
  if (body.useSearch) {
    tools.push({ googleSearch: {} });
  }

  const geminiConfig: Record<string, unknown> = {
    thinkingConfig: { thinkingLevel: 'HIGH' },
  };
  if (tools.length > 0) {
    geminiConfig.tools = tools;
  }

  const fullPrompt = `Generate a beautiful, self-contained HTML page that visualises the following concept. The HTML must include all CSS inline (no external dependencies except Google Fonts). Include the Google Fonts link for Cormorant Garamond, Crimson Pro, and IBM Plex Mono.

${EMBER_STYLE_CONTEXT}

${body.context ? `Student context: ${body.context}\n\n` : ''}Concept to visualise: ${body.prompt}

Return ONLY the complete HTML — no markdown fences, no explanation. The HTML should be a complete document starting with <!DOCTYPE html>.`;

  try {
    const response = await client.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      config: geminiConfig,
      contents: [
        { role: 'user', parts: [{ text: fullPrompt }] },
      ],
    });

    // Stream the HTML back
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            if (chunk.text) {
              controller.enqueue(encoder.encode(chunk.text));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
