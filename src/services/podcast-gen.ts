/**
 * Podcast Generation — creates NotebookLM-style audio discussions.
 *
 * Two-step pipeline:
 * 1. Generate a concise two-speaker dialogue script via a lightweight agent
 * 2. Convert script to speech via Gemini TTS with structured prompt
 *
 * Supports both direct Gemini SDK (dev) and proxy (production).
 * Returns a structured podcast entry for the PodcastPlayer component.
 */
import { getGeminiClient } from './gemini';
import { useProxy, proxyTtsGeneration } from './proxy-client';
import { micro } from './agents';
import { runTextAgent } from './run-agent';
import { recentContext } from './entry-utils';
import { pcmToWav } from './pcm-to-wav';
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
    const context = recentContext(entries, 6, 500);
    const script = await generateScript(topic, context);
    if (!script) {
      return errorEntry('Could not generate dialogue script. Try again.');
    }

    const audioDataUrl = await synthesizeSpeech(script, topic);
    if (!audioDataUrl) {
      return { type: 'podcast', topic, audioUrl: '', transcript: script };
    }

    return { type: 'podcast', topic, audioUrl: audioDataUrl, transcript: script };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Ember] Podcast generation failed:', err);
    return errorEntry(`Podcast generation failed: ${msg}`);
  }
}

/** Step 1: Generate a concise dialogue script via a lightweight micro-agent. */
async function generateScript(
  topic: string, context: string,
): Promise<string | null> {
  const agent = micro(SCRIPT_SYSTEM);
  const result = await runTextAgent(agent, [{
    role: 'user',
    parts: [{ text: SCRIPT_PROMPT(topic, context) }],
  }]);

  const text = result.text.trim();
  if (!text || text.length < 80) return null;
  return text.replace(/^```\w*\s*/i, '').replace(/```\s*$/i, '').trim();
}

/** Step 2: Convert dialogue to speech with a structured TTS prompt. */
async function synthesizeSpeech(
  script: string, topic: string,
): Promise<string | null> {
  const ttsPrompt = buildTtsPrompt(script, topic);
  let audioBase64: string;

  if (useProxy()) {
    const result = await proxyTtsGeneration({
      script: ttsPrompt,
      speakers: SPEAKERS,
      model: TTS_MODEL,
    });
    audioBase64 = result.audioData;
  } else {
    const client = getGeminiClient();
    if (!client) {
      throw new Error('No Gemini API key — TTS requires either a key or the server proxy.');
    }

    const response = await client.models.generateContent({
      model: TTS_MODEL,
      contents: [{ parts: [{ text: ttsPrompt }] }],
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

  const pcmBytes = Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0));
  const wav = pcmToWav(pcmBytes, 24000, 1, 16);
  const blob = new Blob([wav], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

// ─── TTS prompt construction ───────────────────────────────────────

/**
 * Build a structured TTS prompt following the Gemini prompting guide:
 * Audio profile → Scene → Director's notes → Transcript.
 */
function buildTtsPrompt(script: string, topic: string): string {
  return [
    `Audio Profile: Warm, intimate podcast. Two people at a quiet desk in a library discussing "${topic}".`,
    `Director's Notes:`,
    `- Tutor (Kore): Measured pace, gentle emphasis on key concepts. Brief pauses before important ideas.`,
    `- Student (Puck): Curious, genuine reactions. Slightly faster when excited by an insight.`,
    `- Pacing: Conversational, natural beats between turns. No urgency.`,
    ``,
    `Transcript:`,
    script,
  ].join('\n');
}

function errorEntry(message: string): NotebookEntry {
  return { type: 'tutor-marginalia', content: message };
}

const SCRIPT_SYSTEM = `You write short podcast dialogue scripts. Output ONLY the dialogue. Format: "Speaker: text". Two speakers: "Tutor" and "Student". 150-250 words max.`;

function SCRIPT_PROMPT(topic: string, context: string): string {
  return `Write a short podcast dialogue (150-250 words) about: ${topic}

Format: Tutor: [line] / Student: [line]
Style: Warm, curious, natural. Build to one insight. End with a question.${context ? `\nContext:\n${context}` : ''}`;
}
