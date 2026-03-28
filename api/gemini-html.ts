/**
 * /api/gemini-html — Vercel Edge Function proxy for Gemini HTML generation.
 * Uses gemini-3-flash-preview with high thinking for concept visualisation.
 * Keeps the API key server-side.
 */
import { GoogleGenAI } from '@google/genai';

export const config = { runtime: 'edge' };

/**
 * IMPORTANT: Keep these values in sync with src/tokens/colors.ts and
 * src/services/token-context.ts. This file runs as a Vercel Edge Function
 * and cannot import from the src/ directory via @/ aliases.
 */
const EMBER_STYLE_CONTEXT = `
Use these design tokens for all generated HTML:
- Background: #F6F1EA (paper)
- Primary text: #2C2825 (ink)
- Soft text: #5C5550 (ink-soft)
- Faint text: #9B9590 (ink-faint)
- Ghost text: #C8C2BA (ink-ghost)
- Margin accent: #B8564F (margin)
- Sage accent: #6B8F71 (sage)
- Indigo accent: #5B6B8A (indigo)
- Amber accent: #C49A3C (amber)
- Rule lines: #DDD6CC
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

  const startMs = Date.now();
  console.log(`[gemini-html] promptLen=${body.prompt.length} search=${!!body.useSearch}`);

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
          let bytes = 0;
          for await (const chunk of response) {
            if (chunk.text) {
              const encoded = encoder.encode(chunk.text);
              bytes += encoded.byteLength;
              controller.enqueue(encoded);
            }
          }
          console.log(`[gemini-html] done bytes=${bytes} duration=${Date.now() - startMs}ms`);
          controller.close();
        } catch (err) {
          console.error(`[gemini-html] stream error: ${err instanceof Error ? err.message : err}`);
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
    console.error(`[gemini-html] failed duration=${Date.now() - startMs}ms error="${message}"`);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
