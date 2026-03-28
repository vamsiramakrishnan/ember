/**
 * /api/gemini-image — Vercel Edge Function proxy for Gemini image generation.
 * Keeps the API key server-side.
 *
 * Uses streaming response with an early heartbeat to avoid Vercel's 25s
 * initial-response timeout. Image generation can take 15-30s on Gemini's
 * side, so we send a keep-alive comment within the first few seconds,
 * then stream the full JSON result once generation completes.
 *
 * Response format: NDJSON
 *   {"status":"generating"}\n     ← heartbeat (sent immediately)
 *   {"images":[...],"text":""}\n  ← final result
 *   OR
 *   {"error":"..."}\n             ← on failure
 */
import { GoogleGenAI } from '@google/genai';

export const config = { runtime: 'edge', maxDuration: 60 };

interface ImageRequestBody {
  prompt: string;
  useSearch?: boolean;
  aspectRatio?: string;
  imageSize?: string;
  /** Optional reference images (e.g. style palette) sent as inlineData. */
  referenceImages?: Array<{ mimeType: string; data: string }>;
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

  // Stream response to avoid 25s initial-response timeout.
  // Send a heartbeat immediately, then the real result when ready.
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  const write = (obj: unknown) => writer.write(encoder.encode(JSON.stringify(obj) + '\n'));

  // Fire-and-forget: run generation in background, write results to stream
  const startMs = Date.now();
  console.log(`[gemini-image] search=${!!body.useSearch} refs=${body.referenceImages?.length ?? 0} promptLen=${body.prompt.length}`);

  void (async () => {
    try {
      // Heartbeat — tells the client (and Vercel) we're alive
      await write({ status: 'generating' });

      const client = new GoogleGenAI({ apiKey });

      const tools: Record<string, unknown>[] = [];
      if (body.useSearch) {
        tools.push({ googleSearch: { searchTypes: { webSearch: {} } } });
      }

      const imageConfig: Record<string, unknown> = {};
      if (body.aspectRatio) imageConfig.aspectRatio = body.aspectRatio;
      if (body.imageSize) imageConfig.imageSize = body.imageSize;

      const geminiConfig: Record<string, unknown> = {
        responseModalities: ['IMAGE', 'TEXT'],
      };
      // Note: image models do NOT support systemInstruction — it must be
      // injected into the prompt by the caller before reaching this edge fn.
      if (Object.keys(imageConfig).length > 0) geminiConfig.imageConfig = imageConfig;
      if (tools.length > 0) geminiConfig.tools = tools;

      // Build message parts: reference images first, then prompt text
      const messageParts: Array<Record<string, unknown>> = [];
      if (body.referenceImages) {
        for (const ref of body.referenceImages) {
          messageParts.push({ inlineData: { mimeType: ref.mimeType, data: ref.data } });
        }
      }
      messageParts.push({ text: body.prompt });

      const response = await client.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        config: geminiConfig,
        contents: [
          { role: 'user', parts: messageParts },
        ],
      });

      const images: Array<{ data: string; mimeType: string }> = [];
      const textChunks: string[] = [];

      const parts = response.candidates?.[0]?.content?.parts;
      if (parts) {
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

      console.log(`[gemini-image] done images=${images.length} duration=${Date.now() - startMs}ms`);
      await write({ images, text: textChunks.join('') });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[gemini-image] failed duration=${Date.now() - startMs}ms error="${message}"`);
      await write({ error: message });
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
    },
  });
}
