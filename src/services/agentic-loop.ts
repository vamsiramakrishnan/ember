/** Agentic Loop — runs a Gemini agent with function calling (max 8 iterations).
 * Tool calls execute in parallel; streaming mode re-streams only the final turn. */
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
import type { Subgraph } from './knowledge-graph';

const MAX_ITERATIONS = 8;

export interface AgenticResult {
  text: string;
  toolCalls: string[];
  deferredActions: Array<DeferredAction | GraphDeferredAction>;
}

interface LoopContext {
  studentId: string;
  notebookId: string;
  graph: Subgraph | null;
}

type FunctionCallPart = {
  functionCall: { name: string; args: Record<string, unknown> };
};

/** Shared loop. When onFinalText is provided, the final turn is re-streamed. */
async function _runLoop(
  agent: AgentConfig,
  messages: AgentMessage[],
  context: LoopContext,
  onFinalText?: (chunk: string, accumulated: string) => void,
): Promise<AgenticResult> {
  const client = getGeminiClient();
  if (!client) throw new Error('Gemini API key not configured');

  const tools = [...agent.tools, ...AGENT_TOOL_DECLARATIONS, ...GRAPH_TOOL_DECLARATIONS];
  // GenerateContentConfig doesn't expose thinkingConfig in SDK types;
  // use a plain object that the SDK accepts at runtime.
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
      model: agent.model, config, contents: currentMessages,
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) break;

    const functionCalls = parts.filter(
      (p): p is FunctionCallPart =>
        'functionCall' in p && Boolean(p.functionCall),
    );

    if (functionCalls.length === 0) {
      // Final turn — stream or extract text
      if (onFinalText) {
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
              onFinalText(p.text, accumulated);
            }
          }
        }
        return { text: accumulated, toolCalls, deferredActions };
      }
      const text = parts
        .filter((p): p is { text: string } => 'text' in p && Boolean(p.text))
        .map((p) => p.text)
        .join('');
      return { text, toolCalls, deferredActions };
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

/** Run an agent with function calling tools (non-streaming). */
export async function runAgenticLoop(
  agent: AgentConfig,
  messages: AgentMessage[],
  context: LoopContext,
): Promise<AgenticResult> {
  if (!getGeminiClient() && useProxy()) {
    const result = await runTextAgent(agent, messages);
    return { text: result.text, toolCalls: [], deferredActions: [] };
  }
  return _runLoop(agent, messages, context);
}

/** Run an agent with function calling, streaming the final text. */
export async function runAgenticLoopStreaming(
  agent: AgentConfig,
  messages: AgentMessage[],
  context: LoopContext,
  onChunk: (chunk: string, accumulated: string) => void,
): Promise<AgenticResult> {
  if (!getGeminiClient() && useProxy()) {
    const result = await runTextAgentStreaming(agent, messages, onChunk);
    return { text: result.text, toolCalls: [], deferredActions: [] };
  }
  return _runLoop(agent, messages, context, onChunk);
}
