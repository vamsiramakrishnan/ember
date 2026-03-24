/** Agentic Loop — runs a Gemini agent with function calling.
 * Streams directly from the first call on the final turn (no re-streaming).
 * Respects agent.maxTurns and detects stuck loops. */
import { getGeminiClient } from './gemini';
import { useProxy } from './proxy-client';
import { runTextAgent, runTextAgentStreaming } from './run-agent';
import { AGENT_TOOL_DECLARATIONS } from './agent-tools';
import { GRAPH_TOOL_DECLARATIONS } from './graph-tools';
import { executeTool, extractDeferredActions } from './tool-executor';
import type { DeferredAction } from './tool-executor';
import type { GraphDeferredAction } from './graph-tools';
import type { AgentConfig } from './agents';
import type { AgentMessage } from './run-agent';
const DEFAULT_MAX_ITERATIONS = 8;

export interface AgenticResult {
  text: string;
  toolCalls: string[];
  deferredActions: Array<DeferredAction | GraphDeferredAction>;
}

export interface LoopContext {
  studentId: string;
  notebookId: string;
}

type FunctionCallPart = {
  functionCall: { name: string; args: Record<string, unknown> };
};

type StreamCb = (chunk: string, accumulated: string) => void;

/** Fallback: re-stream when the final turn had no text (rare edge case). */
async function _streamFallback(
  client: ReturnType<typeof getGeminiClient> & object,
  model: string, config: Record<string, unknown>,
  contents: AgentMessage[], cb: StreamCb,
): Promise<string> {
  const stream = await client.models.generateContentStream({ model, config, contents });
  let acc = '';
  for await (const chunk of stream) {
    for (const p of chunk.candidates?.[0]?.content?.parts ?? []) {
      if ('text' in p && p.text) { acc += p.text; cb(p.text, acc); }
    }
  }
  return acc;
}

/** Shared loop. When onFinalText is provided, emits text from the final turn. */
async function _runLoop(
  agent: AgentConfig, messages: AgentMessage[],
  context: LoopContext, onFinalText?: StreamCb,
  signal?: AbortSignal,
): Promise<AgenticResult> {
  const client = getGeminiClient();
  if (!client) throw new Error('Gemini API key not configured');
  const tools = [...agent.tools, ...AGENT_TOOL_DECLARATIONS, ...GRAPH_TOOL_DECLARATIONS];
  const config: Record<string, unknown> = {
    thinkingConfig: { thinkingLevel: agent.thinkingLevel },
    systemInstruction: agent.systemInstruction, tools,
  };
  const toolCalls: string[] = [];
  const deferredActions: Array<DeferredAction | GraphDeferredAction> = [];
  let currentMessages = [...messages];
  const maxIter = agent.maxTurns ?? DEFAULT_MAX_ITERATIONS;
  const lastToolResults = new Map<string, string>();

  for (let iter = 0; iter < maxIter; iter++) {
    if (signal?.aborted) break;
    const response = await client.models.generateContent({
      model: agent.model, config, contents: currentMessages,
    });
    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) break;

    const fnCalls = parts.filter(
      (p): p is FunctionCallPart => 'functionCall' in p && Boolean(p.functionCall),
    );

    if (fnCalls.length === 0) {
      const text = parts
        .filter((p): p is { text: string } => 'text' in p && Boolean(p.text))
        .map((p) => p.text).join('');
      if (onFinalText && text) {
        onFinalText(text, text); // Emit already-received text — no re-stream
      } else if (onFinalText && !text) {
        const fallback = await _streamFallback(
          client, agent.model, config, currentMessages, onFinalText,
        );
        return { text: fallback, toolCalls, deferredActions };
      }
      return { text, toolCalls, deferredActions };
    }

    for (const part of fnCalls) {
      const { name, args } = part.functionCall;
      toolCalls.push(`${name}(${JSON.stringify(args)})`);
      const deferred = extractDeferredActions(name, args);
      if (deferred) deferredActions.push(deferred);
    }
    const results = await Promise.all(
      fnCalls.map((p) => executeTool(p.functionCall.name, p.functionCall.args, context)),
    );
    if (signal?.aborted) break;

    // Loop detection: break if every tool returned same result as prior iteration
    let stuckCount = 0;
    for (let i = 0; i < fnCalls.length; i++) {
      const name = fnCalls[i]!.functionCall.name;
      const resultStr = JSON.stringify(results[i]);
      if (lastToolResults.get(name) === resultStr) stuckCount++;
      lastToolResults.set(name, resultStr);
    }
    if (stuckCount === fnCalls.length) break;

    const fnResponses = fnCalls.map((part, i) => ({
      functionResponse: { name: part.functionCall.name, response: { result: results[i]! } },
    }));
    currentMessages = [
      ...currentMessages,
      { role: 'model' as const, parts: fnCalls },
      { role: 'user' as const, parts: fnResponses },
    ];
  }
  return { text: '', toolCalls, deferredActions };
}

/** Run an agent with function calling tools (non-streaming). */
export async function runAgenticLoop(
  agent: AgentConfig, messages: AgentMessage[], context: LoopContext,
  signal?: AbortSignal,
): Promise<AgenticResult> {
  if (!getGeminiClient() && useProxy()) {
    const result = await runTextAgent(agent, messages, signal);
    return { text: result.text, toolCalls: [], deferredActions: [] };
  }
  return _runLoop(agent, messages, context, undefined, signal);
}

/** Run an agent with function calling, streaming the final text. */
export async function runAgenticLoopStreaming(
  agent: AgentConfig, messages: AgentMessage[],
  context: LoopContext, onChunk: StreamCb,
  signal?: AbortSignal,
): Promise<AgenticResult> {
  if (!getGeminiClient() && useProxy()) {
    const result = await runTextAgentStreaming(agent, messages, onChunk, signal);
    return { text: result.text, toolCalls: [], deferredActions: [] };
  }
  return _runLoop(agent, messages, context, onChunk, signal);
}
