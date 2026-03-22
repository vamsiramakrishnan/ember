/**
 * /api/gemini-image — Vercel Edge Function proxy for Gemini image generation.
 * Keeps the API key server-side. Returns images as base64 JSON.
 */
import { GoogleGenAI } from '@google/genai';

export const config = { runtime: 'edge' };

interface ImageRequestBody {
  prompt: string;
  useSearch?: boolean;
  aspectRatio?: string;
  imageSize?: string;
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

  let body: ImageRequestBody;
  try {
    body = await req.json() as ImageRequestBody;
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
    tools.push({ googleSearch: { searchTypes: { webSearch: {} } } });
  }

  const geminiConfig: Record<string, unknown> = {
    imageConfig: {
      aspectRatio: body.aspectRatio ?? '',
      imageSize: body.imageSize ?? '1K',
      personGeneration: '',
    },
    responseModalities: ['IMAGE', 'TEXT'],
  };
  if (tools.length > 0) {
    geminiConfig.tools = tools;
  }

  try {
    const response = await client.models.generateContentStream({
      model: 'gemini-3.1-flash-image-preview',
      config: geminiConfig,
      contents: [
        { role: 'user', parts: [{ text: body.prompt }] },
      ],
    });

    const images: Array<{ data: string; mimeType: string }> = [];
    const textChunks: string[] = [];

    for await (const chunk of response) {
      const parts = chunk.candidates?.[0]?.content?.parts;
      if (!parts) continue;
      for (const part of parts) {
        if ('inlineData' in part && part.inlineData) {
          images.push({
            data: part.inlineData.data ?? '',
            mimeType: part.inlineData.mimeType ?? 'image/png',
          });
        } else if ('text' in part && part.text) {
          textChunks.push(part.text);
        }
      }
    }

    return new Response(
      JSON.stringify({ images, text: textChunks.join('') }),
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
