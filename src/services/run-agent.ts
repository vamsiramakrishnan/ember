/**
 * runAgent — unified execution for any Gemini agent.
 * Uses the server-side proxy when no client-side API key is set,
 * or calls the Gemini SDK directly in development.
 */
import { getGeminiClient } from './gemini';
import { useProxy, proxyTextGeneration } from './proxy-client';
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

export interface AgentTextResult {
  text: string;
}

export interface AgentImageResult {
  images: Array<{ data: string; mimeType: string }>;
  text: string;
}

/**
 * Run a text-only agent. Routes through the proxy in production
 * or directly via SDK in development.
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
    return { text };
  }

  // Direct SDK path (development with VITE_GEMINI_API_KEY)
  const client = getGeminiClient();
  if (!client) {
    throw new Error('Gemini API key not configured');
  }

  const config: Record<string, unknown> = {
    thinkingConfig: { thinkingLevel: agent.thinkingLevel },
    systemInstruction: agent.systemInstruction,
  };

  if (agent.tools.length > 0) {
    config.tools = agent.tools;
  }

  const response = await client.models.generateContentStream({
    model: agent.model,
    config,
    contents: messages,
  });

  const chunks: string[] = [];
  for await (const chunk of response) {
    const parts = chunk.candidates?.[0]?.content?.parts;
    if (!parts) continue;
    for (const part of parts) {
      if ('text' in part && part.text) {
        chunks.push(part.text);
      }
    }
  }

  return { text: chunks.join('') };
}

/**
 * Run an image-capable agent. Returns images and text.
 */
export async function runImageAgent(
  agent: AgentConfig,
  messages: AgentMessage[],
): Promise<AgentImageResult> {
  const client = getGeminiClient();
  if (!client) {
    throw new Error('Gemini API key not configured');
  }

  const config: Record<string, unknown> = {
    thinkingConfig: { thinkingLevel: agent.thinkingLevel },
    systemInstruction: agent.systemInstruction,
    responseModalities: agent.responseModalities,
  };

  if (agent.tools.length > 0) {
    config.tools = agent.tools;
  }

  const response = await client.models.generateContentStream({
    model: agent.model,
    config,
    contents: messages,
  });

  const images: Array<{ data: string; mimeType: string }> = [];
  const textChunks: string[] = [];

  for await (const chunk of response) {
    const parts = chunk.candidates?.[0]?.content?.parts;
    if (!parts) continue;

    for (const part of parts) {
      if ('inlineData' in part && part.inlineData) {
        images.push({
          data: part.inlineData.data ?? '',
          mimeType: part.inlineData.mimeType ?? 'image/png',
        });
      } else if ('text' in part && part.text) {
        textChunks.push(part.text);
      }
    }
  }

  return { images, text: textChunks.join('') };
}

/**
 * Convenience: run a text agent with a single user prompt.
 */
export async function askAgent(
  agent: AgentConfig,
  prompt: string,
): Promise<string> {
  const result = await runTextAgent(agent, [
    { role: 'user', parts: [{ text: prompt }] },
  ]);
  return result.text;
}
