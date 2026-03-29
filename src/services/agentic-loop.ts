/**
 * Agentic Loop — runs a Gemini agent with function calling
 * via the Interactions API.
 *
 * Uses previous_interaction_id to chain iterations instead of
 * re-sending the full message history on every turn. The server
 * retains prior context; each iteration sends only the new
 * function results.
 *
 * Respects agent.maxTurns and detects stuck loops.
 */
import { getGeminiClient } from './gemini';
import { useProxy } from './proxy-client';
import { runTextAgent, runTextAgentStreaming } from './run-agent';
import { AGENT_TOOL_DECLARATIONS } from './agent-tools';
import { GRAPH_TOOL_DECLARATIONS } from './graph-tools';
import {
  convertToolsToInteractions,
  toInteractionsThinkingLevel,
  extractText,
  extractFunctionCalls,
  buildFunctionResult,
} from './gemini-interactions';
import { executeTool, extractDeferredActions } from './tool-executor';
import type { DeferredAction } from './tool-executor';
import type { GraphDeferredAction } from './graph-tools';
import type { AgentConfig } from './agents';
import type { AgentMessage } from './run-agent';
import type { Interactions } from '@google/genai';

const DEFAULT_MAX_ITERATIONS = 8;

export interface AgenticResult {
  text: string;
  toolCalls: string[];
  deferredActions: Array<DeferredAction | GraphDeferredAction>;
  /** Interaction ID for session chaining. */
  interactionId?: string;
}

export interface LoopContext {
  studentId: string;
  notebookId: string;
}

type StreamCb = (chunk: string, accumulated: string) => void;

/** Convert AgentMessage[] to Interactions Turn[] for the initial request. */
function toInitialTurns(messages: AgentMessage[]): Interactions.Turn[] {
  return messages.map((msg) => ({
    role: msg.role === 'model' ? 'model' as const : 'user' as const,
    parts: msg.parts
      .filter((p) => p.text)
      .map((p) => ({ type: 'text' as const, text: p.text ?? '' })),
  }));
}

/**
 * Core agentic loop using the Interactions API.
 *
 * Flow:
 * 1. Send initial messages → get Interaction
 * 2. If function_calls in outputs → execute tools → send results via
 *    a new interaction chained with previous_interaction_id → repeat
 * 3. If text in outputs → done
 */
async function _runLoop(
  agent: AgentConfig,
  messages: AgentMessage[],
  context: LoopContext,
  onFinalText?: StreamCb,
  signal?: AbortSignal,
): Promise<AgenticResult> {
  const client = getGeminiClient();
  if (!client) throw new Error('Gemini API key not configured');

  const allLegacyTools = [
    ...agent.tools,
    ...AGENT_TOOL_DECLARATIONS as unknown as import('@google/genai').Tool[],
    ...GRAPH_TOOL_DECLARATIONS as unknown as import('@google/genai').Tool[],
  ];
  const tools = convertToolsToInteractions(allLegacyTools);

  const toolCalls: string[] = [];
  const deferredActions: Array<DeferredAction | GraphDeferredAction> = [];
  const maxIter = agent.maxTurns ?? DEFAULT_MAX_ITERATIONS;
  const lastToolResults = new Map<string, string>();

  // Shared config for all iterations
  const baseParams = {
    model: agent.model,
    system_instruction: agent.systemInstruction,
    tools: tools.length > 0 ? tools : undefined,
    generation_config: {
      thinking_level: toInteractionsThinkingLevel(agent.thinkingLevel),
    },
    stream: false as const,
  };

  // First call: send the full conversation
  let interaction = await client.interactions.create({
    ...baseParams,
    input: toInitialTurns(messages),
  });

  for (let iter = 0; iter < maxIter; iter++) {
    if (signal?.aborted) break;

    const fnCalls = extractFunctionCalls(interaction);

    // No function calls → we have the final text response
    if (fnCalls.length === 0) {
      const text = extractText(interaction);
      if (onFinalText && text) onFinalText(text, text);
      return {
        text,
        toolCalls,
        deferredActions,
        interactionId: interaction.id,
      };
    }

    // Record function calls and extract deferred actions
    for (const fc of fnCalls) {
      toolCalls.push(`${fc.name}(${JSON.stringify(fc.arguments)})`);
      const deferred = extractDeferredActions(fc.name, fc.arguments);
      if (deferred) deferredActions.push(deferred);
    }

    // Execute all tools in parallel
    const results = await Promise.all(
      fnCalls.map((fc) =>
        executeTool(fc.name, fc.arguments, context),
      ),
    );
    if (signal?.aborted) break;

    // Stuck-loop detection: break if every tool returned same result
    let stuckCount = 0;
    for (let i = 0; i < fnCalls.length; i++) {
      const name = fnCalls[i]!.name;
      const resultStr = JSON.stringify(results[i]);
      if (lastToolResults.get(name) === resultStr) stuckCount++;
      lastToolResults.set(name, resultStr);
    }
    if (stuckCount === fnCalls.length) break;

    // Build function results and chain to previous interaction
    const fnResults = fnCalls.map((fc, i) =>
      buildFunctionResult(fc.id, fc.name, results[i]!),
    );

    interaction = await client.interactions.create({
      ...baseParams,
      input: fnResults as unknown as Interactions.FunctionResultContent,
      previous_interaction_id: interaction.id,
    });
  }

  // Exhausted iterations — return whatever we have
  const text = extractText(interaction);
  if (onFinalText && text) onFinalText(text, text);
  return {
    text,
    toolCalls,
    deferredActions,
    interactionId: interaction.id,
  };
}

/** Run an agent with function calling tools (non-streaming). */
export async function runAgenticLoop(
  agent: AgentConfig,
  messages: AgentMessage[],
  context: LoopContext,
  signal?: AbortSignal,
): Promise<AgenticResult> {
  if (!getGeminiClient() && useProxy()) {
    const result = await runTextAgent(agent, messages, signal);
    return { text: result.text, toolCalls: [], deferredActions: [] };
  }
  return _runLoop(agent, messages, context, undefined, signal);
}

/** Run an agent with function calling, emitting final text via callback. */
export async function runAgenticLoopStreaming(
  agent: AgentConfig,
  messages: AgentMessage[],
  context: LoopContext,
  onChunk: StreamCb,
  signal?: AbortSignal,
): Promise<AgenticResult> {
  if (!getGeminiClient() && useProxy()) {
    const result = await runTextAgentStreaming(agent, messages, onChunk, signal);
    return { text: result.text, toolCalls: [], deferredActions: [] };
  }
  return _runLoop(agent, messages, context, onChunk, signal);
}
