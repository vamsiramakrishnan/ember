/**
 * Gemini API helpers — shared logic for building tool arrays,
 * configs, and processing response streams.
 *
 * Extracted from gemini.ts to eliminate duplication across the
 * four generate* functions.
 */
import type { GenerateContentResponse, GenerateContentConfig, Tool } from '@google/genai';

/** Options that control which tools to include. */
interface ToolOptions {
  useSearch?: boolean;
  useUrlContext?: boolean;
  useCodeExecution?: boolean;
}

/** Build the tools array from boolean option flags. */
export function buildToolsArray(
  options?: ToolOptions,
): Tool[] {
  const tools: Tool[] = [];
  if (options?.useSearch) tools.push({ googleSearch: {} });
  if (options?.useUrlContext) tools.push({ urlContext: {} });
  if (options?.useCodeExecution) tools.push({ codeExecution: {} });
  return tools;
}

/** Build the config object from options and a pre-built tools array. */
export function buildConfig(
  options?: ToolOptions & { systemInstruction?: string },
  tools?: Tool[],
): GenerateContentConfig {
  const config: GenerateContentConfig = {};
  if (tools && tools.length > 0) config.tools = tools;
  if (options?.systemInstruction) {
    config.systemInstruction = options.systemInstruction;
  }
  return config;
}

/**
 * Collect all text from a Gemini streaming response into a single string.
 * Used by generateText and generateTextWithHistory.
 */
export async function collectStreamChunks(
  response: AsyncIterable<GenerateContentResponse>,
): Promise<string> {
  const chunks: string[] = [];
  for await (const chunk of response) {
    const parts = chunk.candidates?.[0]?.content?.parts;
    if (!parts) continue;
    for (const part of parts) {
      if (part.text) {
        chunks.push(part.text);
      }
    }
  }
  return chunks.join('');
}

/**
 * Stream text from a Gemini response, calling onChunk for each piece.
 * Returns the full accumulated text. Used by generateTextStream
 * and generateTextStreamWithHistory.
 */
export async function streamWithCallback(
  response: AsyncIterable<GenerateContentResponse>,
  onChunk: (chunk: string, accumulated: string) => void,
): Promise<string> {
  let accumulated = '';
  for await (const chunk of response) {
    const parts = chunk.candidates?.[0]?.content?.parts;
    if (!parts) continue;
    for (const part of parts) {
      if (part.text) {
        const text = part.text;
        accumulated += text;
        onChunk(text, accumulated);
      }
    }
  }
  return accumulated;
}
