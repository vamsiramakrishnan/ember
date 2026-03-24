/**
 * runAgent — unified execution for any Gemini agent.
 * Supports structured output (Zod schema → responseJsonSchema)
 * and grounding metadata extraction (Google Search citations).
 */
import { getGeminiClient } from './gemini';
import { useProxy, proxyTextGeneration, proxyTextGenerationStream, proxyImageGeneration } from './proxy-client';
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

  // GenerateContentConfig doesn't expose thinkingConfig in SDK types;
  // use a plain object that the SDK accepts at runtime.
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

/**
 * Inject systemInstruction as a context prefix in the first user message.
 * Image models don't support the systemInstruction config param, so we
 * prepend it to the user's prompt text instead.
 */
function injectSystemContext(
  messages: AgentMessage[],
  context: string,
): AgentMessage[] {
  if (!context) return messages;
  return messages.map((msg, i) => {
    if (i !== 0 || msg.role !== 'user') return msg;
    // Prepend context to the first text part
    const parts = msg.parts.map((part, j) => {
      if (j === 0 && part.text) {
        return { ...part, text: `${context}\n\n---\n\n${part.text}` };
      }
      // If first part is an image (inlineData), add context as a new text part after it
      return part;
    });
    // If no text part was found, append one
    const hasText = parts.some((p) => p.text?.startsWith(context));
    if (!hasText) {
      parts.push({ text: `${context}` });
    }
    return { ...msg, parts };
  });
}

/** Run an image-capable agent (non-streaming — image models return complete). */
export async function runImageAgent(
  agent: AgentConfig,
  messages: AgentMessage[],
): Promise<AgentImageResult> {
  // Proxy path: use /api/gemini-image when no client-side API key
  if (useProxy()) {
    const userText = messages
      .filter((m) => m.role === 'user')
      .flatMap((m) => m.parts)
      .map((p) => ('text' in p && p.text) ? p.text : '')
      .filter(Boolean)
      .join('\n');
    // Image models don't support systemInstruction — prepend to prompt
    const prompt = agent.systemInstruction
      ? `${agent.systemInstruction}\n\n---\n\n${userText}`
      : userText;
    const result = await proxyImageGeneration({
      prompt,
      useSearch: agent.tools.length > 0,
    });
    return { images: result.images, text: result.text };
  }

  const client = getGeminiClient();
  if (!client) throw new Error('Gemini API key not configured');

  // Image models don't support systemInstruction — inject it into
  // the first user message instead. thinkingConfig and tools are kept.
  const config: Record<string, unknown> = {
    responseModalities: agent.responseModalities,
  };
  if (agent.tools.length > 0) config.tools = agent.tools;

  // Prepend systemInstruction as context in the first user turn
  const contents = agent.systemInstruction
    ? injectSystemContext(messages, agent.systemInstruction)
    : messages;

  // Use generateContent (not stream) — image responses are atomic blobs.
  const response = await client.models.generateContent({
    model: agent.model, config, contents,
  });

  const images: Array<{ data: string; mimeType: string }> = [];
  const textChunks: string[] = [];

  const parts = response.candidates?.[0]?.content?.parts;
  if (parts) {
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

  // GenerateContentConfig doesn't expose thinkingConfig in SDK types;
  // use a plain object that the SDK accepts at runtime.
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
