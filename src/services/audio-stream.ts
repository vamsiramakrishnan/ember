/**
 * Audio stream reader — accumulates PCM chunks from a streaming TTS
 * response and builds a playable WAV blob when complete.
 *
 * Also supports an onChunk callback for progress tracking.
 */
import { pcmToWav } from './pcm-to-wav';

interface AudioStreamResult {
  blob: Blob;
  mimeType: string;
}

/**
 * Read a streaming TTS NDJSON response, accumulate PCM audio chunks,
 * and return a WAV blob when the stream completes.
 *
 * Each NDJSON line is either:
 *   { audio: string }           — base64-encoded PCM chunk
 *   { done: true, mimeType }    — stream complete
 *   { error: string }           — server error
 */
export async function readAudioStream(
  response: Response,
  onProgress?: (chunksReceived: number) => void,
): Promise<AudioStreamResult> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  const chunks: Uint8Array[] = [];
  let buffer = '';
  let mimeType = 'audio/L16;rate=24000';
  let chunkCount = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line) as {
            audio?: string;
            done?: boolean;
            mimeType?: string;
            error?: string;
          };

          if (parsed.error) throw new Error(parsed.error);

          if (parsed.audio) {
            chunks.push(base64ToBytes(parsed.audio));
            chunkCount++;
            onProgress?.(chunkCount);
          }

          if (parsed.done && parsed.mimeType) {
            mimeType = parsed.mimeType;
          }
        } catch (e) {
          if (e instanceof Error && e.message !== '') throw e;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (chunks.length === 0) {
    throw new Error('No audio data received from TTS stream');
  }

  // Concatenate all PCM chunks
  const totalLen = chunks.reduce((n, c) => n + c.length, 0);
  const pcm = new Uint8Array(totalLen);
  let offset = 0;
  for (const chunk of chunks) {
    pcm.set(chunk, offset);
    offset += chunk.length;
  }

  // Parse sample rate from mimeType (e.g. "audio/L16;rate=24000")
  const rateMatch = mimeType.match(/rate=(\d+)/);
  const sampleRate = rateMatch?.[1] ? parseInt(rateMatch[1], 10) : 24000;

  const wav = pcmToWav(pcm, sampleRate, 1, 16);
  return {
    blob: new Blob([wav], { type: 'audio/wav' }),
    mimeType: 'audio/wav',
  };
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
