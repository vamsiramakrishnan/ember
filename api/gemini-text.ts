/**
 * /api/gemini-text — Vercel Edge Function proxy for Gemini text generation.
 * Keeps the API key server-side. Streams the response back to the client.
 */
import { GoogleGenAI } from '@google/genai';

export const config = { runtime: 'edge' };

interface TextRequestBody {
  messages: Array<{ role: 'user' | 'model'; parts: Array<{ text?: string }> }>;
  model?: string;
  systemInstruction?: string;
  thinkingLevel?: string;
  tools?: Record<string, unknown>[];
  /** When set, Gemini guarantees JSON output matching this schema. */
  responseMimeType?: string;
  responseSchema?: Record<string, unknown>;
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

  let body: TextRequestBody;
  try {
    body = await req.json() as TextRequestBody;
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return new Response(
      JSON.stringify({ error: 'messages array is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const client = new GoogleGenAI({ apiKey });

  const geminiConfig: Record<string, unknown> = {};
  if (body.systemInstruction) {
    geminiConfig.systemInstruction = body.systemInstruction;
  }
  if (body.thinkingLevel) {
    geminiConfig.thinkingConfig = { thinkingLevel: body.thinkingLevel };
  }
  if (body.tools && body.tools.length > 0) {
    geminiConfig.tools = body.tools;
  }
  if (body.responseMimeType) {
    geminiConfig.responseMimeType = body.responseMimeType;
  }
  if (body.responseSchema) {
    geminiConfig.responseSchema = body.responseSchema;
  }

  const model = body.model ?? 'gemini-3.1-flash-lite-preview';
  const startMs = Date.now();
  console.log(`[gemini-text] model=${model} messages=${body.messages.length} thinking=${body.thinkingLevel ?? 'none'}`);

  try {
    const response = await client.models.generateContentStream({
      model,
      config: geminiConfig,
      contents: body.messages,
    });

    // Stream chunks back as newline-delimited JSON
    const encoder = new TextEncoder();
    let chunkCount = 0;
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const parts = chunk.candidates?.[0]?.content?.parts;
            if (!parts) continue;
            for (const part of parts) {
              if ('text' in part && part.text) {
                chunkCount++;
                controller.enqueue(
                  encoder.encode(JSON.stringify({ text: part.text }) + '\n'),
                );
              }
            }
          }
          console.log(`[gemini-text] done chunks=${chunkCount} duration=${Date.now() - startMs}ms`);
          controller.close();
        } catch (err) {
          console.error(`[gemini-text] stream error: ${err instanceof Error ? err.message : err}`);
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[gemini-text] failed model=${model} duration=${Date.now() - startMs}ms error="${message}"`);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
