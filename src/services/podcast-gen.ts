/**
 * Podcast Generation — creates NotebookLM-style audio discussions.
 *
 * Two-step pipeline:
 * 1. Generate a two-speaker dialogue script via standard Gemini model
 * 2. Convert script to speech via Gemini TTS with multi-speaker config
 *
 * Returns a WAV blob URL for playback in the notebook.
 */
import { getGeminiClient } from './gemini';
import { VISUALISER_AGENT } from './agents';
import { runTextAgent } from './run-agent';
import { recentContext } from './entry-utils';
import type { NotebookEntry, LiveEntry } from '@/types/entries';

const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

/** Generate a podcast-style audio discussion about a topic. */
export async function generatePodcast(
  topic: string,
  entries: LiveEntry[],
): Promise<NotebookEntry | null> {
  try {
    // Step 1: Generate dialogue script
    const context = recentContext(entries, 8, 800);
    const script = await generateScript(topic, context);
    if (!script) return null;

    // Step 2: Convert to speech
    const audioDataUrl = await synthesizeSpeech(script);
    if (!audioDataUrl) return null;

    return {
      type: 'visualization',
      html: buildAudioPlayerHtml(topic, script, audioDataUrl),
      caption: `podcast: ${topic.slice(0, 50)}`,
    };
  } catch (err) {
    console.error('[Ember] Podcast generation failed:', err);
    return null;
  }
}

async function generateScript(topic: string, context: string): Promise<string | null> {
  const result = await runTextAgent(VISUALISER_AGENT, [{
    role: 'user',
    parts: [{ text: SCRIPT_PROMPT(topic, context) }],
  }]);

  const text = result.text.trim();
  if (!text || text.length < 100) return null;
  // Clean any markdown fences
  return text.replace(/^```\w*\s*/i, '').replace(/```\s*$/i, '').trim();
}

async function synthesizeSpeech(script: string): Promise<string | null> {
  const client = getGeminiClient();
  if (!client) return null;

  const response = await client.models.generateContent({
    model: TTS_MODEL,
    contents: [{ parts: [{ text: script }] }],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: [
            { speaker: 'Tutor', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
            { speaker: 'Student', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
          ],
        },
      },
    },
  });

  const part = response.candidates?.[0]?.content?.parts?.[0];
  const audio = part && 'inlineData' in part ? part.inlineData : null;
  if (!audio?.data) return null;

  // Convert base64 PCM to WAV data URL
  const pcmBytes = Uint8Array.from(atob(audio.data), (c) => c.charCodeAt(0));
  const wav = pcmToWav(pcmBytes, 24000, 1, 16);
  const blob = new Blob([wav], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

/** Prepend a WAV header to raw PCM data. */
function pcmToWav(pcm: Uint8Array, sampleRate: number, channels: number, bitsPerSample: number): ArrayBuffer {
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);
  const buffer = new ArrayBuffer(44 + pcm.length);
  const view = new DataView(buffer);

  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
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

function buildAudioPlayerHtml(topic: string, script: string, audioUrl: string): string {
  const escapedScript = script.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<!DOCTYPE html><html><head>
<meta charset="utf-8"><style>
body { margin: 0; padding: 20px; font-family: 'Crimson Pro', serif; color: #2C2825; background: #FAF6F1; }
h2 { font-family: 'Cormorant Garamond', serif; font-weight: 300; font-size: 22px; margin: 0 0 12px; }
.label { font-family: 'IBM Plex Mono', monospace; font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: #9B9590; margin-bottom: 12px; }
audio { width: 100%; margin: 8px 0 16px; border-radius: 2px; }
.script { font-size: 14px; line-height: 1.7; color: #5C5550; white-space: pre-wrap; max-height: 200px; overflow-y: auto; border-top: 1px solid #DDD6CC; padding-top: 12px; }
details summary { cursor: pointer; font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: #9B9590; letter-spacing: 1px; }
</style></head><body>
<div class="label">podcast</div>
<h2>${topic}</h2>
<audio controls src="${audioUrl}"></audio>
<details><summary>show transcript</summary>
<div class="script">${escapedScript}</div>
</details>
</body></html>`;
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
