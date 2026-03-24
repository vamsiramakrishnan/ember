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

