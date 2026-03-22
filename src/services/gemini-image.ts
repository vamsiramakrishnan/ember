/**
 * Gemini image generation service.
 * Uses gemini-3.1-flash-image-preview for generating concept diagrams,
 * whiteboard sketches, and visual explanations in Ember's notebook style.
 */
import { getGeminiClient, MODELS } from './gemini';

export interface GeneratedImage {
  /** Base64-encoded image data. */
  data: string;
  /** MIME type (e.g. 'image/png'). */
  mimeType: string;
}

export interface ImageGenerationResult {
  /** Generated images, if any. */
  images: GeneratedImage[];
  /** Any text response accompanying the image. */
  text: string;
}

export interface ImageGenerationOptions {
  /** The prompt describing what to generate. */
  prompt: string;
  /** Enable Google Search for reference. */
  useSearch?: boolean;
  /** Aspect ratio for the generated image. */
  aspectRatio?: string;
  /** Image size — defaults to '1K'. */
  imageSize?: string;
}

/**
 * Generate images using Gemini's image model.
 * Returns both images and any accompanying text.
 */
export async function generateImage(
  options: ImageGenerationOptions,
): Promise<ImageGenerationResult> {
  const client = getGeminiClient();
  if (!client) {
    throw new Error('Gemini API key not configured');
  }

  const tools: Record<string, unknown>[] = [];
  if (options.useSearch) {
    tools.push({
      googleSearch: {
        searchTypes: { webSearch: {} },
      },
    });
  }

  const config: Record<string, unknown> = {
    imageConfig: {
      aspectRatio: options.aspectRatio ?? '',
      imageSize: options.imageSize ?? '1K',
      personGeneration: '',
    },
    responseModalities: ['IMAGE', 'TEXT'],
  };
  if (tools.length > 0) {
    config.tools = tools;
  }

  const contents = [
    {
      role: 'user' as const,
      parts: [{ text: options.prompt }],
    },
  ];

  const response = await client.models.generateContentStream({
    model: MODELS.image,
    config,
    contents,
  });

  const images: GeneratedImage[] = [];
  const textChunks: string[] = [];

  for await (const chunk of response) {
    const parts = chunk.candidates?.[0]?.content?.parts;
    if (!parts) continue;

    for (const part of parts) {
      if ('inlineData' in part && part.inlineData) {
        images.push({
          data: part.inlineData.data ?? '',
          mimeType: part.inlineData.mimeType ?? 'image/png',
        });
      } else if ('text' in part && part.text) {
        textChunks.push(part.text);
      }
    }
  }

  return {
    images,
    text: textChunks.join(''),
  };
}
