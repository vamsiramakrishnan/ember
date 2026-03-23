/**
 * Agentic Loop — runs a Gemini agent with function calling.
 *
 * Unlike runTextAgent (which just streams text), this loop:
 * 1. Sends the prompt + tool declarations
 * 2. If the model returns a function call → execute it → feed result back
 * 3. Repeat until the model returns final text
 * 4. Collect deferred write actions (annotations, lexicon additions)
 *
 * Max iterations: 5 (prevent infinite loops).
 * The agent can traverse File Search, query the knowledge graph,
 * look up specific concepts/thinkers/terms, and create new data.
 */
/**
 * Agentic Loop — runs a Gemini agent with function calling.
 *
 * The loop has two tool sets:
 * 1. AGENT_TOOL_DECLARATIONS — original tools (search, lookup, create)
 * 2. GRAPH_TOOL_DECLARATIONS — persistent graph traversal tools
 *
 * Both are available to the agent in every turn. The agent decides
 * which to call based on what it needs to know.
 *
 * Loop control:
 * - Max 8 iterations (up from 5 — graph exploration needs more room)
 * - Tool calls execute in parallel within a turn
 * - Deferred writes are collected but not executed until post-response
 * - Streaming mode: tool turns are non-streaming, final turn streams
 */
import { getGeminiClient } from './gemini';
import { AGENT_TOOL_DECLARATIONS } from './agent-tools';
import { GRAPH_TOOL_DECLARATIONS } from './graph-tools';
import { executeTool, extractDeferredActions } from './tool-executor';
import type { DeferredAction } from './tool-executor';
import type { GraphDeferredAction } from './graph-tools';
import type { AgentConfig } from './agents';
import type { AgentMessage } from './run-agent';
import type { Subgraph } from './knowledge-graph';

const MAX_ITERATIONS = 8;

export interface AgenticResult {
  text: string;
  toolCalls: string[];
  deferredActions: Array<DeferredAction | GraphDeferredAction>;
}

/**
 * Run an agent with function calling tools.
 * The agent can call tools during generation to explore data.
 */
export async function runAgenticLoop(
  agent: AgentConfig,
  messages: AgentMessage[],
  context: {
    studentId: string;
    notebookId: string;
    graph: Subgraph | null;
  },
): Promise<AgenticResult> {
  const client = getGeminiClient();
  if (!client) throw new Error('Gemini API key not configured');

  const tools = [
    ...agent.tools,
    ...AGENT_TOOL_DECLARATIONS,
    ...GRAPH_TOOL_DECLARATIONS,
  ];

  const config: Record<string, unknown> = {
    thinkingConfig: { thinkingLevel: agent.thinkingLevel },
    systemInstruction: agent.systemInstruction,
    tools,
  };

  const toolCalls: string[] = [];
  const deferredActions: Array<DeferredAction | GraphDeferredAction> = [];
  let currentMessages = [...messages];

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    const response = await client.models.generateContent({
      model: agent.model,
      config,
      contents: currentMessages,
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) break;

    // Check for function calls
    const functionCalls = parts.filter(
      (p): p is { functionCall: { name: string; args: Record<string, unknown> } } =>
        'functionCall' in p && Boolean(p.functionCall),
    );

    // If no function calls, we have the final text
    if (functionCalls.length === 0) {
      const text = parts
        .filter((p): p is { text: string } => 'text' in p && Boolean(p.text))
        .map((p) => p.text)
        .join('');
      return { text, toolCalls, deferredActions };
    }

    // Execute tool calls in parallel for speed
    for (const part of functionCalls) {
      const { name, args } = part.functionCall;
      toolCalls.push(`${name}(${JSON.stringify(args)})`);
      const deferred = extractDeferredActions(name, args);
      if (deferred) deferredActions.push(deferred);
    }

    const results = await Promise.all(
      functionCalls.map((part) =>
        executeTool(part.functionCall.name, part.functionCall.args, context),
      ),
    );

    const functionResponses = functionCalls.map((part, i) => ({
      functionResponse: {
        name: part.functionCall.name,
        response: { result: results[i]! },
      },
    }));

    // Feed results back and continue
    currentMessages = [
      ...currentMessages,
      { role: 'model' as const, parts: functionCalls },
      { role: 'user' as const, parts: functionResponses },
    ];
  }

  // Max iterations reached — return whatever we have
  return { text: '', toolCalls, deferredActions };
}

/**
 * Run an agent with function calling tools, streaming the final text.
 * Tool calls are handled non-streaming; the final text response streams
 * chunk-by-chunk via the onChunk callback.
 */
export async function runAgenticLoopStreaming(
  agent: AgentConfig,
  messages: AgentMessage[],
  context: {
    studentId: string;
    notebookId: string;
    graph: Subgraph | null;
  },
  onChunk: (chunk: string, accumulated: string) => void,
): Promise<AgenticResult> {
  const client = getGeminiClient();
  if (!client) throw new Error('Gemini API key not configured');

  const tools = [...agent.tools, ...AGENT_TOOL_DECLARATIONS, ...GRAPH_TOOL_DECLARATIONS];
  const config: Record<string, unknown> = {
    thinkingConfig: { thinkingLevel: agent.thinkingLevel },
    systemInstruction: agent.systemInstruction,
    tools,
  };

  const toolCalls: string[] = [];
  const deferredActions: Array<DeferredAction | GraphDeferredAction> = [];
  let currentMessages = [...messages];

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    // Use non-streaming for tool-call iterations
    const probe = await client.models.generateContent({
      model: agent.model, config, contents: currentMessages,
    });

    const parts = probe.candidates?.[0]?.content?.parts;
    if (!parts) break;

    const functionCalls = parts.filter(
      (p): p is { functionCall: { name: string; args: Record<string, unknown> } } =>
        'functionCall' in p && Boolean(p.functionCall),
    );

    // No tool calls — this is the final turn. Re-stream it.
    if (functionCalls.length === 0) {
      const stream = await client.models.generateContentStream({
        model: agent.model, config, contents: currentMessages,
      });
      let accumulated = '';
      for await (const chunk of stream) {
        const cParts = chunk.candidates?.[0]?.content?.parts;
        if (!cParts) continue;
        for (const p of cParts) {
          if ('text' in p && p.text) {
            accumulated += p.text;
            onChunk(p.text, accumulated);
          }
        }
      }
      return { text: accumulated, toolCalls, deferredActions };
    }

    // Execute tool calls in parallel
    for (const part of functionCalls) {
      const { name, args } = part.functionCall;
      toolCalls.push(`${name}(${JSON.stringify(args)})`);
      const deferred = extractDeferredActions(name, args);
      if (deferred) deferredActions.push(deferred);
    }

    const results = await Promise.all(
      functionCalls.map((part) =>
        executeTool(part.functionCall.name, part.functionCall.args, context),
      ),
    );

    const functionResponses = functionCalls.map((part, i) => ({
      functionResponse: {
        name: part.functionCall.name,
        response: { result: results[i]! },
      },
    }));

    currentMessages = [
      ...currentMessages,
      { role: 'model' as const, parts: functionCalls },
      { role: 'user' as const, parts: functionResponses },
    ];
  }

  return { text: '', toolCalls, deferredActions };
}
