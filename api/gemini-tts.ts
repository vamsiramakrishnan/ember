/**
 * /api/gemini-tts — Vercel Serverless Function proxy for Gemini TTS.
 *
 * Uses Node.js runtime (NOT Edge) because the Gemini TTS SDK returns
 * a single blocking response (no streaming). Edge Functions require the
 * first byte within 25s, which TTS cannot guarantee. Node.js serverless
 * functions support maxDuration without that constraint.
 *
 * Returns base64-encoded PCM audio data as JSON.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export const config = { maxDuration: 120 };

interface TtsRequestBody {
  script: string;
  speakers: Array<{ speaker: string; voiceName: string }>;
  model?: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env['GEMINI_API_KEY'];
  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    return;
  }

  const body = req.body as TtsRequestBody;
  if (!body?.script || !body?.speakers?.length) {
    res.status(400).json({ error: 'Missing script or speakers' });
    return;
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
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: s.voiceName },
              },
            })),
          },
        },
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    const audio = part && 'inlineData' in part
      ? part.inlineData : null;

    if (!audio?.data) {
      res.status(502).json({ error: 'No audio data in response' });
      return;
    }

    res.status(200).json({
      audioData: audio.data,
      mimeType: audio.mimeType ?? 'audio/L16;rate=24000',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'TTS failed';
    console.error('[gemini-tts] Error:', message);
    res.status(500).json({ error: message });
  }
}
