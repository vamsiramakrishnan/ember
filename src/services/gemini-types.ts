/**
 * Gemini SDK type re-exports — single source of truth for typed SDK usage.
 *
 * All service files should import SDK types from here rather than using
 * Record<string, unknown>. This ensures type safety and centralises
 * SDK version coupling.
 *
 * Includes both generateContent (legacy) and Interactions API types.
 */
import type {
  GenerateContentConfig,
  Tool,
  ToolListUnion,
  Content,
  Interactions,
} from '@google/genai';

export type { GenerateContentConfig, Tool, ToolListUnion, Content };

// ─── Interactions API types ─────────────────────────────────────

export type InteractionTool = Interactions.Tool;
export type InteractionContent = Interactions.Content;
export type InteractionSSEEvent = Interactions.InteractionSSEEvent;
export type Interaction = Interactions.Interaction;
export type InteractionUsage = Interactions.Usage;
export type InteractionFunctionCall = Interactions.FunctionCallContent;
export type InteractionFunctionResult = Interactions.FunctionResultContent;

// ─── Legacy types (still used by proxy path) ────────────────────

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

