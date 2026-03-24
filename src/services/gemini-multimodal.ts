/**
 * Gemini multimodal analysis service.
 * Analyses images (sketches, diagrams, photos of handwritten work)
 * that students share in the notebook, extracting concepts and
 * generating tutor responses grounded in visual content.
 *
 * Supports dual-mode: direct SDK (dev) or server proxy (production).
 */
import { getGeminiClient, MODELS } from './gemini';
import { useProxy, proxyMultimodalAnalysis } from './proxy-client';
import { TUTOR_SYSTEM_PROMPT } from './tutor-prompt';

export interface MultimodalAnalysisOptions {
  /** Base64-encoded image data. */
  imageData: string;
  /** MIME type of the image (e.g. 'image/png', 'image/jpeg'). */
  mimeType: string;
  /** Optional text prompt accompanying the image. */
  prompt?: string;
  /** Enable Google Search for grounding visual content. */
  useSearch?: boolean;
}

/**
 * Analyse an image and generate a tutor response.
 * Returns raw text — the caller should parse it into a NotebookEntry.
 */
export async function analyseImage(
  options: MultimodalAnalysisOptions,
): Promise<string> {
  // Proxy path
  if (useProxy()) {
    return proxyMultimodalAnalysis({
      imageData: options.imageData,
      mimeType: options.mimeType,
      prompt: options.prompt,
      systemInstruction: TUTOR_SYSTEM_PROMPT,
      useSearch: options.useSearch,
      mode: 'analyse',
    });
  }

  const client = getGeminiClient();
  if (!client) {
    throw new Error('Gemini API key not configured');
  }

  const tools: Record<string, unknown>[] = [];
  if (options.useSearch) {
    tools.push({ googleSearch: {} });
  }

  const config: Record<string, unknown> = {
    systemInstruction: TUTOR_SYSTEM_PROMPT,
  };
  if (tools.length > 0) {
    config.tools = tools;
  }

  const parts: Array<Record<string, unknown>> = [
    {
      inlineData: {
        mimeType: options.mimeType,
        data: options.imageData,
      },
    },
  ];

  if (options.prompt) {
    parts.push({ text: options.prompt });
  } else {
    parts.push({
      text: 'The student has shared this image. Analyse what it shows — is it a sketch, a diagram, handwritten notes, or something else? Respond as the tutor would, connecting what you see to the student\'s learning journey. Respond with a JSON object as specified in your instructions.',
    });
  }

  const contents = [{ role: 'user' as const, parts }];

  const response = await client.models.generateContentStream({
    model: MODELS.text,
    config,
    contents,
  });

  const chunks: string[] = [];
  for await (const chunk of response) {
    const responseParts = chunk.candidates?.[0]?.content?.parts;
    if (!responseParts) continue;
    for (const part of responseParts) {
      if ('text' in part && part.text) {
        chunks.push(part.text);
      }
    }
  }

  return chunks.join('');
}

/**
 * Extract text content from an image (OCR-like functionality).
 * Useful for analysing photos of handwritten student work.
 */
export async function extractTextFromImage(
  imageData: string,
  mimeType: string,
): Promise<string> {
  // Proxy path
  if (useProxy()) {
    return proxyMultimodalAnalysis({
      imageData,
      mimeType,
      prompt: 'Extract all text visible in this image. Preserve the layout and structure as much as possible. Return only the extracted text, no commentary.',
      mode: 'extract',
    });
  }

  const client = getGeminiClient();
  if (!client) {
    throw new Error('Gemini API key not configured');
  }

  const contents = [
    {
      role: 'user' as const,
      parts: [
        {
          inlineData: { mimeType, data: imageData },
        },
        {
          text: 'Extract all text visible in this image. Preserve the layout and structure as much as possible. Return only the extracted text, no commentary.',
        },
      ],
    },
  ];

  const response = await client.models.generateContentStream({
    model: MODELS.text,
    config: {},
    contents,
  });

  const chunks: string[] = [];
  for await (const chunk of response) {
    if (chunk.text) {
      chunks.push(chunk.text);
    }
  }

  return chunks.join('');
}
