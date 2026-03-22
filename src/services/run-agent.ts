/**
 * runAgent — unified execution for any Gemini agent.
 * Supports structured output (Zod schema → responseJsonSchema)
 * and grounding metadata extraction (Google Search citations).
 */
import { getGeminiClient } from './gemini';
import { useProxy, proxyTextGeneration, proxyTextGenerationStream } from './proxy-client';
import { toJSONSchema } from 'zod';
import type { AgentConfig } from './agents';

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
}

export interface AgentImageResult {
  images: Array<{ data: string; mimeType: string }>;
  text: string;
}

/**
 * Run a text-only agent. Supports structured output via Zod schema.
 * Extracts Google Search grounding citations when available.
 */
export async function runTextAgent(
  agent: AgentConfig,
  messages: AgentMessage[],
): Promise<AgentTextResult> {
  if (useProxy()) {
    const text = await proxyTextGeneration({
      messages,
      model: agent.model,
      systemInstruction: agent.systemInstruction,
      thinkingLevel: agent.thinkingLevel,
      tools: agent.tools.length > 0 ? agent.tools : undefined,
    });
    return { text, citations: [] };
  }

  const client = getGeminiClient();
  if (!client) throw new Error('Gemini API key not configured');

  const config: Record<string, unknown> = {
    thinkingConfig: { thinkingLevel: agent.thinkingLevel },
    systemInstruction: agent.systemInstruction,
  };

  if (agent.tools.length > 0) {
    config.tools = agent.tools;
  }

  // Structured output: Zod schema → JSON schema (Zod v4 built-in)
  if (agent.responseSchema) {
    config.responseMimeType = 'application/json';
    config.responseSchema = toJSONSchema(agent.responseSchema);
  }

  const response = await client.models.generateContentStream({
    model: agent.model,
    config,
    contents: messages,
  });

  const chunks: string[] = [];
  const citations: GroundingCitation[] = [];

  for await (const chunk of response) {
    const candidate = chunk.candidates?.[0];
    const parts = candidate?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if ('text' in part && part.text) chunks.push(part.text);
      }
    }

    // Extract grounding metadata (Google Search citations)
    const grounding = candidate?.groundingMetadata as Record<string, unknown> | undefined;
    if (grounding?.groundingChunks) {
      const gChunks = grounding.groundingChunks as Array<Record<string, unknown>>;
      for (const gc of gChunks) {
        const web = gc.web as { uri?: string; title?: string } | undefined;
        if (web?.uri) {
          const exists = citations.some((c) => c.url === web.uri);
          if (!exists) {
            citations.push({ title: web.title ?? '', url: web.uri ?? '' });
          }
        }
      }
    }
  }

  return { text: chunks.join(''), citations };
}

/** Run an image-capable agent. */
export async function runImageAgent(
  agent: AgentConfig,
  messages: AgentMessage[],
): Promise<AgentImageResult> {
  const client = getGeminiClient();
  if (!client) throw new Error('Gemini API key not configured');

  const config: Record<string, unknown> = {
    thinkingConfig: { thinkingLevel: agent.thinkingLevel },
    systemInstruction: agent.systemInstruction,
    responseModalities: agent.responseModalities,
  };
  if (agent.tools.length > 0) config.tools = agent.tools;

  const response = await client.models.generateContentStream({
    model: agent.model, config, contents: messages,
  });

  const images: Array<{ data: string; mimeType: string }> = [];
  const textChunks: string[] = [];

  for await (const chunk of response) {
    const parts = chunk.candidates?.[0]?.content?.parts;
    if (!parts) continue;
    for (const part of parts) {
      if ('inlineData' in part && part.inlineData) {
        images.push({ data: part.inlineData.data ?? '', mimeType: part.inlineData.mimeType ?? 'image/png' });
      } else if ('text' in part && part.text) {
        textChunks.push(part.text);
      }
    }
  }

  return { images, text: textChunks.join('') };
}

/**
 * Run a text agent with streaming. Yields chunks via onChunk callback.
 * Extracts grounding citations on completion.
 */
export async function runTextAgentStreaming(
  agent: AgentConfig,
  messages: AgentMessage[],
  onChunk: (chunk: string, accumulated: string) => void,
): Promise<AgentTextResult> {
  if (useProxy()) {
    const text = await proxyTextGenerationStream({
      messages,
      model: agent.model,
      systemInstruction: agent.systemInstruction,
      thinkingLevel: agent.thinkingLevel,
      tools: agent.tools.length > 0 ? agent.tools : undefined,
    }, onChunk);
    return { text, citations: [] };
  }

  const client = getGeminiClient();
  if (!client) throw new Error('Gemini API key not configured');

  const config: Record<string, unknown> = {
    thinkingConfig: { thinkingLevel: agent.thinkingLevel },
    systemInstruction: agent.systemInstruction,
  };
  if (agent.tools.length > 0) config.tools = agent.tools;

  const response = await client.models.generateContentStream({
    model: agent.model, config, contents: messages,
  });

  let accumulated = '';
  const citations: GroundingCitation[] = [];

  for await (const chunk of response) {
    const candidate = chunk.candidates?.[0];
    const parts = candidate?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if ('text' in part && part.text) {
          accumulated += part.text;
          onChunk(part.text, accumulated);
        }
      }
    }
    const grounding = candidate?.groundingMetadata as Record<string, unknown> | undefined;
    if (grounding?.groundingChunks) {
      const gChunks = grounding.groundingChunks as Array<Record<string, unknown>>;
      for (const gc of gChunks) {
        const web = gc.web as { uri?: string; title?: string } | undefined;
        if (web?.uri && !citations.some((c) => c.url === web.uri)) {
          citations.push({ title: web.title ?? '', url: web.uri ?? '' });
        }
      }
    }
  }

  return { text: accumulated, citations };
}

/** Convenience: run a text agent with a single user prompt. */
export async function askAgent(agent: AgentConfig, prompt: string): Promise<string> {
  const result = await runTextAgent(agent, [{ role: 'user', parts: [{ text: prompt }] }]);
  return result.text;
}
