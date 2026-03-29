/**
 * Gemini Interactions API adapter — converts between Ember's existing
 * generateContent-style tool declarations and the Interactions API format.
 *
 * The Interactions API uses a flat tool format:
 *   { type: 'function', name, description, parameters }
 *
 * Ember's existing agents use the generateContent format:
 *   { functionDeclarations: [{ name, description, parameters }] }
 *
 * This module handles the conversion and provides typed helpers
 * for working with Interaction responses (outputs, function calls,
 * streaming SSE events).
 */
import type { Tool } from '@google/genai';
import type { Interactions } from '@google/genai';

// ─── Type re-exports for Interactions API ────────────────────────

export type InteractionTool = Interactions.Tool;
export type InteractionContent = Interactions.Content;
export type InteractionSSEEvent = Interactions.InteractionSSEEvent;
export type InteractionContentDelta = Interactions.ContentDelta;
export type InteractionFunctionCall = Interactions.FunctionCallContent;
export type InteractionFunctionResult = Interactions.FunctionResultContent;
export type InteractionTextContent = Interactions.TextContent;
export type InteractionThoughtContent = Interactions.ThoughtContent;
export type Interaction = Interactions.Interaction;
export type InteractionUsage = Interactions.Usage;

// ─── Thinking level conversion ──────────────────────────────────

type LegacyThinkingLevel = 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH';
type InteractionsThinkingLevel = 'minimal' | 'low' | 'medium' | 'high';

/** Convert uppercase thinking levels (generateContent) to lowercase (Interactions). */
export function toInteractionsThinkingLevel(
  level: LegacyThinkingLevel,
): InteractionsThinkingLevel {
  return level.toLowerCase() as InteractionsThinkingLevel;
}

// ─── Tool format conversion ─────────────────────────────────────

interface LegacyFunctionDeclaration {
  name: string;
  description?: string;
  parameters?: unknown;
}

interface LegacyToolGroup {
  functionDeclarations?: LegacyFunctionDeclaration[];
  googleSearch?: Record<string, unknown>;
  urlContext?: Record<string, unknown>;
  codeExecution?: Record<string, unknown>;
}

/**
 * Convert generateContent-style tool declarations to Interactions API format.
 *
 * Input:  [{ functionDeclarations: [{ name, description, parameters }] }]
 * Output: [{ type: 'function', name, description, parameters }]
 *
 * Also handles built-in tools (googleSearch, urlContext, codeExecution).
 */
export function convertToolsToInteractions(
  legacyTools: Tool[],
): InteractionTool[] {
  const result: InteractionTool[] = [];

  for (const tool of legacyTools) {
    const t = tool as unknown as LegacyToolGroup;

    if (t.functionDeclarations) {
      for (const fn of t.functionDeclarations) {
        result.push({
          type: 'function',
          name: fn.name,
          description: fn.description,
          parameters: fn.parameters,
        });
      }
    }

    if (t.googleSearch || ('googleSearch' in tool)) {
      result.push({ type: 'google_search' });
    }

    if (t.urlContext || ('urlContext' in tool)) {
      result.push({ type: 'url_context' });
    }

    if (t.codeExecution || ('codeExecution' in tool)) {
      result.push({ type: 'code_execution' });
    }
  }

  return result;
}

// ─── Response extraction helpers ────────────────────────────────

/** Extract all text from an Interaction's outputs. */
export function extractText(interaction: Interaction): string {
  if (!interaction.outputs) return '';
  return interaction.outputs
    .filter((o): o is InteractionTextContent => o.type === 'text')
    .map((o) => o.text)
    .join('');
}

/** Extract function calls from an Interaction's outputs. */
export function extractFunctionCalls(
  interaction: Interaction,
): InteractionFunctionCall[] {
  if (!interaction.outputs) return [];
  return interaction.outputs.filter(
    (o): o is InteractionFunctionCall => o.type === 'function_call',
  );
}

/** Extract thought/reasoning content from outputs. */
export function extractThoughts(
  interaction: Interaction,
): InteractionThoughtContent[] {
  if (!interaction.outputs) return [];
  return interaction.outputs.filter(
    (o): o is InteractionThoughtContent => o.type === 'thought',
  );
}

/** Extract usage statistics. */
export function extractUsage(
  interaction: Interaction,
): InteractionUsage | undefined {
  return interaction.usage;
}

/** Check if an interaction requires tool execution. */
export function requiresAction(interaction: Interaction): boolean {
  return interaction.status === 'requires_action';
}

/** Check if an interaction is complete. */
export function isComplete(interaction: Interaction): boolean {
  return interaction.status === 'completed';
}

/** Check if an interaction failed. */
export function isFailed(interaction: Interaction): boolean {
  return interaction.status === 'failed' || interaction.status === 'cancelled';
}

// ─── Streaming event helpers ────────────────────────────────────

/** Extract text from a content.delta SSE event. */
export function extractDeltaText(event: InteractionSSEEvent): string | null {
  if (event.event_type !== 'content.delta') return null;
  const delta = (event as InteractionContentDelta).delta;
  if (delta.type === 'text') return delta.text;
  return null;
}

/** Extract a function call from a content.delta SSE event. */
export function extractDeltaFunctionCall(
  event: InteractionSSEEvent,
): { id: string; name: string; arguments: Record<string, unknown> } | null {
  if (event.event_type !== 'content.delta') return null;
  const delta = (event as InteractionContentDelta).delta;
  if (delta.type !== 'function_call') return null;
  const fc = delta as unknown as {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
  };
  return { id: fc.id, name: fc.name, arguments: fc.arguments };
}

/** Check if an SSE event signals interaction completion. */
export function isCompleteEvent(
  event: InteractionSSEEvent,
): event is Interactions.InteractionCompleteEvent {
  return event.event_type === 'interaction.complete';
}

/** Extract usage from an interaction.complete SSE event. */
export function extractEventUsage(
  event: InteractionSSEEvent,
): InteractionUsage | undefined {
  if (!isCompleteEvent(event)) return undefined;
  return event.interaction.usage;
}

// ─── Function result builder ────────────────────────────────────

/** Build a function result content block to send back to the model. */
export function buildFunctionResult(
  callId: string,
  name: string,
  result: unknown,
): InteractionFunctionResult {
  return {
    type: 'function_result',
    call_id: callId,
    name,
    result: typeof result === 'string' ? result : JSON.stringify(result),
  };
}
