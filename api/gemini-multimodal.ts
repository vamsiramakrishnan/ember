/**
 * /api/gemini-multimodal — Vercel Edge Function proxy for multimodal analysis.
 * Handles image analysis (student sketches, handwritten notes) and OCR.
 * Keeps the API key server-side.
 */
import { GoogleGenAI } from '@google/genai';

export const config = { runtime: 'edge' };

interface MultimodalRequestBody {
  /** Base64-encoded image data. */
  imageData: string;
  /** MIME type of the image. */
  mimeType: string;
  /** Optional text prompt. */
  prompt?: string;
  /** System instruction override. */
  systemInstruction?: string;
  /** Whether to use search grounding. */
  useSearch?: boolean;
  /** 'analyse' or 'extract' mode. */
  mode?: 'analyse' | 'extract';
}

const DEFAULT_ANALYSE_PROMPT =
  "The student has shared this image. Analyse what it shows — is it a sketch, a diagram, handwritten notes, or something else? Respond as the tutor would, connecting what you see to the student's learning journey. Respond with a JSON object: {\"type\": \"tutor-marginalia\", \"content\": \"...\"} or {\"type\": \"tutor-question\", \"content\": \"...\"}";

const EXTRACT_PROMPT =
  'Extract all text visible in this image. Preserve the layout and structure as much as possible. Return only the extracted text, no commentary.';

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

  let body: MultimodalRequestBody;
  try {
    body = await req.json() as MultimodalRequestBody;
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  if (!body.imageData || !body.mimeType) {
    return new Response(
      JSON.stringify({ error: 'imageData and mimeType are required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const client = new GoogleGenAI({ apiKey });

  const tools: Record<string, unknown>[] = [];
  if (body.useSearch) {
    tools.push({ googleSearch: {} });
  }

  const geminiConfig: Record<string, unknown> = {};
  if (body.systemInstruction) {
    geminiConfig.systemInstruction = body.systemInstruction;
  }
  if (tools.length > 0) {
    geminiConfig.tools = tools;
  }

  const textPrompt = body.mode === 'extract'
    ? EXTRACT_PROMPT
    : (body.prompt ?? DEFAULT_ANALYSE_PROMPT);

  try {
    const response = await client.models.generateContentStream({
      model: 'gemini-3.1-flash-lite-preview',
      config: geminiConfig,
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType: body.mimeType, data: body.imageData } },
            { text: textPrompt },
          ],
        },
      ],
    });

    const chunks: string[] = [];
    for await (const chunk of response) {
      const parts = chunk.candidates?.[0]?.content?.parts;
      if (!parts) continue;
      for (const part of parts) {
        if ('text' in part && part.text) {
          chunks.push(part.text);
        }
      }
    }

    return new Response(
      JSON.stringify({ text: chunks.join('') }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
