/**
 * runImageAgent — execution for Gemini image generation agents.
 *
 * Handles two key constraints of image models:
 * 1. No systemInstruction support — injected into user prompt instead
 * 2. Style adherence — visual palette reference injected as inlineData
 *
 * Nano Banana 2 produces dramatically better results when given a
 * visual color palette reference alongside text descriptions.
 */
import { getGeminiClient } from './gemini';
import { useProxy, proxyImageGeneration } from './proxy-client';
import type { AgentConfig } from './agents';
import type { AgentMessage, AgentImageResult } from './run-agent';
import {
  getStyleReferenceData, STYLE_REFERENCE_MIME, STYLE_REFERENCE_NOTE,
} from './style-reference';

/** Run an image-capable agent (non-streaming — image models return complete). */
export async function runImageAgent(
  agent: AgentConfig,
  messages: AgentMessage[],
): Promise<AgentImageResult> {
  // Proxy path: use /api/gemini-image when no client-side API key
  if (useProxy()) {
    return runImageViaProxy(agent, messages);
  }

  const client = getGeminiClient();
  if (!client) throw new Error('Gemini API key not configured');

  // Image models don't support systemInstruction — inject it into
  // the first user message instead. thinkingConfig and tools are kept.
  const config: Record<string, unknown> = {
    responseModalities: agent.responseModalities,
  };
  if (agent.tools.length > 0) config.tools = agent.tools;

  // Inject style reference palette + system context into user messages.
  // NB2 adheres to style much better with a visual reference than hex codes.
  const withStyle = await injectStyleReference(messages);
  const contents = agent.systemInstruction
    ? injectSystemContext(withStyle, agent.systemInstruction)
    : withStyle;

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

// ─── Proxy path ─────────────────────────────────────────────

async function runImageViaProxy(
  agent: AgentConfig,
  messages: AgentMessage[],
): Promise<AgentImageResult> {
  const userText = messages
    .filter((m) => m.role === 'user')
    .flatMap((m) => m.parts)
    .map((p) => ('text' in p && p.text) ? p.text : '')
    .filter(Boolean)
    .join('\n');

  // Image models don't support systemInstruction — prepend to prompt.
  // Include style reference note so proxy path also gets color guidance.
  const sysPrefix = agent.systemInstruction
    ? `${agent.systemInstruction}\n\n---\n\n`
    : '';
  const prompt = `${sysPrefix}${STYLE_REFERENCE_NOTE}\n\n${userText}`;

  const result = await proxyImageGeneration({
    prompt,
    useSearch: agent.tools.length > 0,
    referenceImages: [{
      mimeType: STYLE_REFERENCE_MIME,
      data: await getStyleReferenceData(),
    }],
  });
  return { images: result.images, text: result.text };
}

// ─── Message injection helpers ──────────────────────────────

/**
 * Inject the Ember style reference palette as the first part of the first
 * user message. NB2 achieves much better style adherence when given a
 * visual example alongside text descriptions.
 */
async function injectStyleReference(messages: AgentMessage[]): Promise<AgentMessage[]> {
  const paletteData = await getStyleReferenceData();
  return messages.map((msg, i) => {
    if (i !== 0 || msg.role !== 'user') return msg;
    return {
      ...msg,
      parts: [
        { inlineData: { mimeType: STYLE_REFERENCE_MIME, data: paletteData } },
        { text: STYLE_REFERENCE_NOTE },
        ...msg.parts,
      ],
    };
  });
}

/**
 * Inject systemInstruction as a context prefix in the first user message.
 * Image models don't support the systemInstruction config param.
 */
function injectSystemContext(
  messages: AgentMessage[],
  context: string,
): AgentMessage[] {
  if (!context) return messages;
  return messages.map((msg, i) => {
    if (i !== 0 || msg.role !== 'user') return msg;
    const parts = msg.parts.map((part, j) => {
      if (j === 0 && part.text) {
        return { ...part, text: `${context}\n\n---\n\n${part.text}` };
      }
      return part;
    });
    const hasText = parts.some((p) => p.text?.startsWith(context));
    if (!hasText) {
      parts.push({ text: `${context}` });
    }
    return { ...msg, parts };
  });
}
