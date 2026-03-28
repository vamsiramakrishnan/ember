/**
 * /api/gemini-tts — Vercel Edge Function proxy for Gemini TTS.
 *
 * Uses generateContentStream() to stream audio chunks incrementally.
 * This avoids the 25s initial-response timeout — first audio chunk
 * arrives within seconds, keeping the connection alive.
 *
 * Streams NDJSON lines:
 *   { "audio": "<base64 PCM chunk>" }     — audio data
 *   { "done": true, "mimeType": "..." }   — signals completion
 *
 * Client accumulates PCM chunks and builds the WAV header at the end.
 */
import { GoogleGenAI } from '@google/genai';

export const config = { runtime: 'edge', maxDuration: 120 };

interface TtsRequestBody {
  script: string;
  speakers: Array<{ speaker: string; voiceName: string }>;
  model?: string;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const apiKey = process.env['GEMINI_API_KEY'];
  if (!apiKey) {
    return jsonError('GEMINI_API_KEY not configured', 500);
  }

  let body: TtsRequestBody;
  try {
    body = await req.json() as TtsRequestBody;
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  if (!body.script || !body.speakers?.length) {
    return jsonError('Missing script or speakers', 400);
  }

  const client = new GoogleGenAI({ apiKey });
  const model = body.model || 'gemini-2.5-flash-preview-tts';
  const encoder = new TextEncoder();
  const startMs = Date.now();
  console.log(`[gemini-tts] model=${model} speakers=${body.speakers.length} scriptLen=${body.script.length}`);

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await client.models.generateContentStream({
          model,
          contents: [{ parts: [{ text: body.script }] }],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              multiSpeakerVoiceConfig: {
                speakerVoiceConfigs: body.speakers.map((s) => ({
                  speaker: s.speaker,
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: s.voiceName },
                  },
                })),
              },
            },
          },
        });

        let mimeType = 'audio/L16;rate=24000';

        for await (const chunk of response) {
          const part = chunk.candidates?.[0]?.content?.parts?.[0];
          if (!part || !('inlineData' in part)) continue;
          const data = part.inlineData;
          if (!data?.data) continue;

          if (data.mimeType) mimeType = data.mimeType;

          controller.enqueue(
            encoder.encode(JSON.stringify({ audio: data.data }) + '\n'),
          );
        }

        console.log(`[gemini-tts] done duration=${Date.now() - startMs}ms mimeType=${mimeType}`);
        controller.enqueue(
          encoder.encode(JSON.stringify({ done: true, mimeType }) + '\n'),
        );
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'TTS failed';
        console.error(`[gemini-tts] failed duration=${Date.now() - startMs}ms error="${msg}"`);
        controller.enqueue(
          encoder.encode(JSON.stringify({ error: msg }) + '\n'),
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
    },
  });
}

function jsonError(error: string, status: number): Response {
  return new Response(
    JSON.stringify({ error }),
    { status, headers: { 'Content-Type': 'application/json' } },
  );
}
