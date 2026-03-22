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
import { getGeminiClient } from './gemini';
import { AGENT_TOOL_DECLARATIONS } from './agent-tools';
import { executeTool, extractDeferredActions, type DeferredAction } from './tool-executor';
import type { AgentConfig } from './agents';
import type { AgentMessage } from './run-agent';
import type { Subgraph } from './knowledge-graph';

const MAX_ITERATIONS = 5;

export interface AgenticResult {
  text: string;
  toolCalls: string[];
  deferredActions: DeferredAction[];
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
  ];

  const config: Record<string, unknown> = {
    thinkingConfig: { thinkingLevel: agent.thinkingLevel },
    systemInstruction: agent.systemInstruction,
    tools,
  };

  const toolCalls: string[] = [];
  const deferredActions: DeferredAction[] = [];
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

    // Execute each function call
    const functionResponses: Array<{
      functionResponse: { name: string; response: { result: string } };
    }> = [];

    for (const part of functionCalls) {
      const { name, args } = part.functionCall;
      toolCalls.push(`${name}(${JSON.stringify(args)})`);

      // Check for deferred write actions
      const deferred = extractDeferredActions(name, args);
      if (deferred) deferredActions.push(deferred);

      // Execute the tool
      const result = await executeTool(name, args, context);

      functionResponses.push({
        functionResponse: {
          name,
          response: { result },
        },
      });
    }

    // Feed results back and continue
    currentMessages = [
      ...currentMessages,
      {
        role: 'model' as const,
        parts: functionCalls,
      },
      {
        role: 'user' as const,
        parts: functionResponses,
      },
    ];
  }

  // Max iterations reached — return whatever we have
  return { text: '', toolCalls, deferredActions };
}
