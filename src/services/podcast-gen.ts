/**
 * Podcast Generation — creates NotebookLM-style audio discussions.
 *
 * Two-step pipeline:
 * 1. Generate a two-speaker dialogue script via standard Gemini model
 * 2. Convert script to speech via Gemini TTS with multi-speaker config
 *
 * Supports both direct Gemini SDK (dev) and proxy (production).
 * Returns a WAV blob URL for playback in the notebook.
 */
import { getGeminiClient } from './gemini';
import { useProxy, proxyTtsGeneration } from './proxy-client';
import { VISUALISER_AGENT } from './agents';
import { runTextAgent } from './run-agent';
import { recentContext } from './entry-utils';
import type { NotebookEntry, LiveEntry } from '@/types/entries';

const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

const SPEAKERS = [
  { speaker: 'Tutor', voiceName: 'Kore' },
  { speaker: 'Student', voiceName: 'Puck' },
];

/** Generate a podcast-style audio discussion about a topic. */
export async function generatePodcast(
  topic: string,
  entries: LiveEntry[],
): Promise<NotebookEntry | null> {
  try {
    // Step 1: Generate dialogue script
    const context = recentContext(entries, 8, 800);
    const script = await generateScript(topic, context);
    if (!script) {
      return errorEntry('Could not generate dialogue script. Try again.');
    }

    // Step 2: Convert to speech
    const audioDataUrl = await synthesizeSpeech(script);
    if (!audioDataUrl) {
      // Return script-only fallback so the work isn't lost
      return {
        type: 'podcast',
        topic,
        audioUrl: '',
        transcript: script,
      };
    }

    return {
      type: 'podcast',
      topic,
      audioUrl: audioDataUrl,
      transcript: script,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Ember] Podcast generation failed:', err);
    return errorEntry(`Podcast generation failed: ${msg}`);
  }
}

async function generateScript(
  topic: string, context: string,
): Promise<string | null> {
  const result = await runTextAgent(VISUALISER_AGENT, [{
    role: 'user',
    parts: [{ text: SCRIPT_PROMPT(topic, context) }],
  }]);

  const text = result.text.trim();
  if (!text || text.length < 100) return null;
  return text.replace(/^```\w*\s*/i, '').replace(/```\s*$/i, '').trim();
}

async function synthesizeSpeech(
  script: string,
): Promise<string | null> {
  let audioBase64: string;

  if (useProxy()) {
    // Production: use server-side TTS proxy
    const result = await proxyTtsGeneration({
      script,
      speakers: SPEAKERS,
      model: TTS_MODEL,
    });
    audioBase64 = result.audioData;
  } else {
    // Development: direct SDK call
    const client = getGeminiClient();
    if (!client) {
      throw new Error('No Gemini API key — TTS requires either a client-side key or the server proxy.');
    }

    const response = await client.models.generateContent({
      model: TTS_MODEL,
      contents: [{ parts: [{ text: script }] }],
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

    const part = response.candidates?.[0]?.content?.parts?.[0];
    const audio = part && 'inlineData' in part ? part.inlineData : null;
    if (!audio?.data) return null;
    audioBase64 = audio.data;
  }

  // Convert base64 PCM to WAV blob URL
  const pcmBytes = Uint8Array.from(
    atob(audioBase64), (c) => c.charCodeAt(0),
  );
  const wav = pcmToWav(pcmBytes, 24000, 1, 16);
  const blob = new Blob([wav], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

// ─── Helpers ──────────────────────────────────────────────────────────

/** Prepend a WAV header to raw PCM data. */
function pcmToWav(
  pcm: Uint8Array, sampleRate: number,
  channels: number, bitsPerSample: number,
): ArrayBuffer {
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);
  const buffer = new ArrayBuffer(44 + pcm.length);
  const view = new DataView(buffer);

  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) {
      view.setUint8(offset + i, s.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + pcm.length, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, 'data');
  view.setUint32(40, pcm.length, true);
  new Uint8Array(buffer, 44).set(pcm);
  return buffer;
}

/** Error entry visible to the student. */
function errorEntry(message: string): NotebookEntry {
  return { type: 'tutor-marginalia', content: message };
}

function SCRIPT_PROMPT(topic: string, context: string): string {
  return `Write a short podcast-style dialogue (400-600 words) between two speakers about: ${topic}

Format EXACTLY as:
Tutor: [text]
Student: [text]

Rules:
- Two speakers only: "Tutor" and "Student"
- Conversational, warm, intellectually curious
- Natural interruptions, reactions ("Right!", "That's fascinating", "Wait, so...")
- The Tutor explains concepts; the Student asks genuine questions
- Build from foundations to insight — don't dump information
- End with an open question that invites further exploration
- No stage directions, no [laughs], just dialogue

${context ? `Student's recent exploration:\n${context}\n\n` : ''}Output ONLY the dialogue, nothing else.`;
}
