/**
 * runAgent — unified execution for any Gemini agent.
 * Uses the Interactions API for typed SSE streaming.
 * Supports structured output (Zod schema → responseJsonSchema)
 * and grounding metadata extraction (Google Search citations).
 */
import { getGeminiClient } from './gemini';
import { useProxy, proxyTextGeneration, proxyTextGenerationStream } from './proxy-client';
import {
  convertToolsToInteractions,
  toInteractionsThinkingLevel,
  extractDeltaText,
  isCompleteEvent,
} from './gemini-interactions';
import type { Interactions } from '@google/genai';
import { toJSONSchema } from 'zod';
import type { AgentConfig } from './agents';
export { runImageAgent } from './run-image-agent';

export interface AgentContentPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
  functionCall?: { name: string; args: Record<string, unknown> };
  functionResponse?: { name: string; response: { result: string } };
}

export interface AgentMessage {
  role: 'user' | 'model';
  parts: AgentContentPart[];
}

/** Citation from Google Search grounding. */
export interface GroundingCitation {
  title: string;
  url: string;
}

export interface AgentTextResult {
  text: string;
  /** Citations from Google Search grounding, if any. */
  citations: GroundingCitation[];
  /** Interaction ID for chaining subsequent interactions. */
  interactionId?: string;
}

export interface AgentImageResult {
  images: Array<{ data: string; mimeType: string }>;
  text: string;
}

/** Convert AgentMessage[] to Interactions Turn[] format. */
function toInteractionTurns(messages: AgentMessage[]): Interactions.Turn[] {
  return messages.map((msg) => {
    const parts: Interactions.Content[] = [];
    for (const p of msg.parts) {
      if (p.text) {
        parts.push({ type: 'text', text: p.text });
      }
    }
    return {
      role: msg.role === 'model' ? 'model' as const : 'user' as const,
      parts,
    };
  });
}

/** Extract citations from Interactions API annotations. */
function extractCitationsFromAnnotations(
  event: Interactions.InteractionSSEEvent,
  citations: GroundingCitation[],
): void {
  if (event.event_type !== 'content.delta') return;
  const delta = (event as Interactions.ContentDelta).delta;
  if (delta.type !== 'text' || !delta.annotations) return;

  for (const ann of delta.annotations) {
    if ('url' in ann && ann.url) {
      const exists = citations.some((c) => c.url === ann.url);
      if (!exists) {
        citations.push({
          title: ('title' in ann ? ann.title : '') as string ?? '',
          url: ann.url,
        });
      }
    }
  }
}

/**
 * Run a text-only agent via the Interactions API.
 * Supports structured output via Zod schema.
 * Extracts Google Search grounding citations when available.
 */
export async function runTextAgent(
  agent: AgentConfig,
  messages: AgentMessage[],
  signal?: AbortSignal,
): Promise<AgentTextResult> {
  if (useProxy()) {
    const body: Parameters<typeof proxyTextGeneration>[0] = {
      messages,
      model: agent.model,
      systemInstruction: agent.systemInstruction,
      thinkingLevel: agent.thinkingLevel,
      tools: agent.tools.length > 0 ? agent.tools : undefined,
    };
    if (agent.responseSchema) {
      body.responseMimeType = 'application/json';
      body.responseSchema = toJSONSchema(agent.responseSchema) as Record<string, unknown>;
    }
    const text = await proxyTextGeneration(body);
    return { text, citations: [] };
  }

  const client = getGeminiClient();
  if (!client) throw new Error('Gemini API key not configured');

  const tools = convertToolsToInteractions(agent.tools);
  const params: Interactions.CreateModelInteractionParamsStreaming = {
    model: agent.model,
    input: toInteractionTurns(messages),
    system_instruction: agent.systemInstruction,
    tools: tools.length > 0 ? tools : undefined,
    generation_config: {
      thinking_level: toInteractionsThinkingLevel(agent.thinkingLevel),
    },
    stream: true,
  };

  if (agent.responseSchema) {
    params.response_mime_type = 'application/json';
    params.response_format = toJSONSchema(agent.responseSchema);
  }

  const stream = await client.interactions.create(params);

  const chunks: string[] = [];
  const citations: GroundingCitation[] = [];
  let interactionId = '';

  for await (const event of stream) {
    if (signal?.aborted) break;
    const text = extractDeltaText(event);
    if (text) chunks.push(text);
    extractCitationsFromAnnotations(event, citations);
    if (isCompleteEvent(event)) {
      interactionId = event.interaction.id;
    }
  }

  return { text: chunks.join(''), citations, interactionId };
}

/**
 * Run a text agent with streaming via the Interactions API.
 * Yields chunks via onChunk callback.
 * Extracts grounding citations on completion.
 */
export async function runTextAgentStreaming(
  agent: AgentConfig,
  messages: AgentMessage[],
  onChunk: (chunk: string, accumulated: string) => void,
  signal?: AbortSignal,
): Promise<AgentTextResult> {
  if (useProxy()) {
    const body: Parameters<typeof proxyTextGenerationStream>[0] = {
      messages,
      model: agent.model,
      systemInstruction: agent.systemInstruction,
      thinkingLevel: agent.thinkingLevel,
      tools: agent.tools.length > 0 ? agent.tools : undefined,
    };
    if (agent.responseSchema) {
      body.responseMimeType = 'application/json';
      body.responseSchema = toJSONSchema(agent.responseSchema) as Record<string, unknown>;
    }
    const text = await proxyTextGenerationStream(body, onChunk);
    return { text, citations: [] };
  }

  const client = getGeminiClient();
  if (!client) throw new Error('Gemini API key not configured');

  const tools = convertToolsToInteractions(agent.tools);
  const params: Interactions.CreateModelInteractionParamsStreaming = {
    model: agent.model,
    input: toInteractionTurns(messages),
    system_instruction: agent.systemInstruction,
    tools: tools.length > 0 ? tools : undefined,
    generation_config: {
      thinking_level: toInteractionsThinkingLevel(agent.thinkingLevel),
    },
    stream: true,
  };

  if (agent.responseSchema) {
    params.response_mime_type = 'application/json';
    params.response_format = toJSONSchema(agent.responseSchema);
  }

  const stream = await client.interactions.create(params);

  let accumulated = '';
  const citations: GroundingCitation[] = [];
  let interactionId = '';

  for await (const event of stream) {
    if (signal?.aborted) break;
    const text = extractDeltaText(event);
    if (text) {
      accumulated += text;
      onChunk(text, accumulated);
    }
    extractCitationsFromAnnotations(event, citations);
    if (isCompleteEvent(event)) {
      interactionId = event.interaction.id;
    }
  }

  return { text: accumulated, citations, interactionId };
}

/** Convenience: run a text agent with a single user prompt. */
export async function askAgent(agent: AgentConfig, prompt: string): Promise<string> {
  const result = await runTextAgent(agent, [{ role: 'user', parts: [{ text: prompt }] }]);
  return result.text;
}
