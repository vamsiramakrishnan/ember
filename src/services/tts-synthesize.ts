/**
 * TTS synthesis — converts a dialogue script to a WAV audio blob URL.
 *
 * Uses generateContentStream for incremental audio delivery (streaming).
 * Supports both proxy (production) and direct SDK (development) paths.
 */
import { getGeminiClient } from './gemini';
import { useProxy, proxyTtsStream } from './proxy-client';
import { readAudioStream } from './audio-stream';
import { pcmToWav } from './pcm-to-wav';

const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

const SPEAKERS = [
  { speaker: 'Tutor', voiceName: 'Kore' },
  { speaker: 'Student', voiceName: 'Puck' },
];

/**
 * Build a structured TTS prompt with audio profile and director's notes.
 * Per Gemini TTS prompting guide: context → pacing → transcript.
 */
export function buildTtsPrompt(script: string, topic: string): string {
  return [
    `Audio Profile: Warm, intimate podcast. Two people at a quiet desk discussing "${topic}".`,
    `Director's Notes:`,
    `- Tutor (Kore): Measured pace, gentle emphasis. Brief pauses before key ideas.`,
    `- Student (Puck): Curious, genuine reactions. Faster when excited.`,
    `- Pacing: Conversational, natural beats between turns.`,
    ``, `Transcript:`, script,
  ].join('\n');
}

/** Synthesize a single script segment to a WAV blob URL. */
export async function synthesizeSegment(
  script: string, topic: string,
): Promise<string | null> {
  const prompt = buildTtsPrompt(script, topic);

  if (useProxy()) {
    const res = await proxyTtsStream({
      script: prompt, speakers: SPEAKERS, model: TTS_MODEL,
    });
    const { blob } = await readAudioStream(res);
    return URL.createObjectURL(blob);
  }

  return synthesizeDirect(prompt);
}

/** Direct SDK streaming path (dev mode with client-side API key). */
async function synthesizeDirect(prompt: string): Promise<string | null> {
  const client = getGeminiClient();
  if (!client) {
    throw new Error('No Gemini API key — TTS requires a key or the proxy.');
  }

  const chunks: Uint8Array[] = [];
  const response = await client.models.generateContentStream({
    model: TTS_MODEL,
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: SPEAKERS.map((s) => ({
            speaker: s.speaker,
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: s.voiceName },
            },
          })),
        },
      },
    },
  });

  for await (const chunk of response) {
    const part = chunk.candidates?.[0]?.content?.parts?.[0];
    if (!part || !('inlineData' in part)) continue;
    const data = part.inlineData;
    if (!data?.data) continue;
    chunks.push(base64ToBytes(data.data));
  }

  if (!chunks.length) return null;

  const totalLen = chunks.reduce((n, c) => n + c.length, 0);
  const pcm = new Uint8Array(totalLen);
  let offset = 0;
  for (const c of chunks) { pcm.set(c, offset); offset += c.length; }

  const wav = pcmToWav(pcm, 24000, 1, 16);
  return URL.createObjectURL(new Blob([wav], { type: 'audio/wav' }));
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
