/**
 * Audio transcription — sends recorded audio to Gemini for speech-to-text.
 *
 * Uses Gemini 3.1 Flash Lite Preview which excels at audio transcription.
 * Supports both direct SDK path and proxy path (via the image endpoint
 * which already handles inlineData parts).
 */
import { getGeminiClient } from './gemini';
import { useProxy, proxyImageGeneration } from './proxy-client';

const TRANSCRIPTION_MODEL = 'gemini-3.1-flash-lite-preview';

const TRANSCRIPTION_PROMPT = `Transcribe the audio exactly as spoken. Output ONLY the transcribed text — no timestamps, no speaker labels, no formatting, no quotation marks. If you cannot hear any speech, respond with an empty string.`;

/**
 * Transcribe audio data to text.
 * @param base64Data — base64-encoded audio (webm, mp4, or wav)
 * @param mimeType — MIME type of the audio
 * @returns Transcribed text
 */
export async function transcribeAudio(
  base64Data: string,
  mimeType: string,
): Promise<string> {
  if (useProxy()) {
    return transcribeViaProxy(base64Data, mimeType);
  }

  const client = getGeminiClient();
  if (!client) throw new Error('No Gemini API key configured');

  const response = await client.models.generateContent({
    model: TRANSCRIPTION_MODEL,
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { mimeType, data: base64Data } },
        { text: TRANSCRIPTION_PROMPT },
      ],
    }],
  });

  return response.text?.trim() ?? '';
}

/** Proxy path: reuse the image endpoint which already supports inlineData.
 *  We're not generating images — just using it as a generic multimodal endpoint. */
async function transcribeViaProxy(
  base64Data: string,
  mimeType: string,
): Promise<string> {
  const result = await proxyImageGeneration({
    prompt: TRANSCRIPTION_PROMPT,
    referenceImages: [{ mimeType, data: base64Data }],
  });
  return result.text?.trim() ?? '';
}
