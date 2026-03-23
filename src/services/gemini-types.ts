/**
 * Gemini SDK type re-exports — single source of truth for typed SDK usage.
 *
 * All service files should import SDK types from here rather than using
 * Record<string, unknown>. This ensures type safety and centralises
 * SDK version coupling.
 */
import type {
  GenerateContentConfig,
  Tool,
  ToolListUnion,
  Content,
} from '@google/genai';

export type { GenerateContentConfig, Tool, ToolListUnion, Content };

/** Tool configuration used throughout Ember's agents. */
export type EmberToolConfig = Tool;

/** Content message used in Gemini conversations. */
export interface GeminiMessage {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

/** A part within a Gemini message. */
export interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
  functionCall?: { name: string; args: Record<string, unknown> };
  functionResponse?: { name: string; response: { result: string } };
}

/**
 * Build a GenerateContentConfig from agent options.
 * Replaces the duplicated Record<string, unknown> config building.
 */
export function buildAgentConfig(opts: {
  systemInstruction?: string;
  thinkingLevel?: string;
  tools?: ToolListUnion;
  responseMimeType?: string;
  responseSchema?: unknown;
  responseModalities?: string[];
}): GenerateContentConfig {
  const config: GenerateContentConfig = {};

  if (opts.systemInstruction) {
    config.systemInstruction = opts.systemInstruction;
  }
  if (opts.thinkingLevel) {
    (config as Record<string, unknown>).thinkingConfig = {
      thinkingLevel: opts.thinkingLevel,
    };
  }
  if (opts.tools && opts.tools.length > 0) {
    config.tools = opts.tools;
  }
  if (opts.responseMimeType) {
    config.responseMimeType = opts.responseMimeType;
  }
  if (opts.responseSchema) {
    config.responseSchema = opts.responseSchema as GenerateContentConfig['responseSchema'];
  }
  if (opts.responseModalities) {
    (config as Record<string, unknown>).responseModalities = opts.responseModalities;
  }

  return config;
}
