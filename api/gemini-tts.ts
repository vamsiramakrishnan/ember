/**
 * /api/gemini-tts — Vercel Edge Function proxy for Gemini TTS.
 * Converts a multi-speaker dialogue script to speech audio.
 * Returns base64-encoded PCM audio data.
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
    return new Response(
      JSON.stringify({ error: 'GEMINI_API_KEY not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  let body: TtsRequestBody;
  try {
    body = await req.json() as TtsRequestBody;
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  if (!body.script || !body.speakers?.length) {
    return new Response(
      JSON.stringify({ error: 'Missing script or speakers' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    const client = new GoogleGenAI({ apiKey });
    const model = body.model || 'gemini-2.5-flash-preview-tts';

    const response = await client.models.generateContent({
      model,
      contents: [{ parts: [{ text: body.script }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: body.speakers.map((s) => ({
              speaker: s.speaker,
              voiceConfig: { prebuiltVoiceConfig: { voiceName: s.voiceName } },
            })),
          },
        },
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    const audio = part && 'inlineData' in part ? part.inlineData : null;

    if (!audio?.data) {
      return new Response(
        JSON.stringify({ error: 'No audio data in response' }),
        { status: 502, headers: { 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({
        audioData: audio.data,
        mimeType: audio.mimeType ?? 'audio/L16;rate=24000',
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'TTS generation failed';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
