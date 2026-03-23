/**
 * Shared agent configuration types and design context.
 */
import type { ZodTypeAny } from 'zod';
import type { Tool } from '@google/genai';

export const TOOLS = {
  googleSearch: { googleSearch: {} } as Tool,
  urlContext: { urlContext: {} } as Tool,
  codeExecution: { codeExecution: {} } as Tool,
};

export type ThinkingLevel = 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH';

export interface AgentConfig {
  name: string;
  model: string;
  systemInstruction: string;
  thinkingLevel: ThinkingLevel;
  tools: Tool[];
  responseModalities: string[];
  /** Zod schema for structured output. When set, response is validated. */
  responseSchema?: ZodTypeAny;
  /** Max turns for agentic loops (default: unlimited). From Gemini CLI. */
  maxTurns?: number;
  /** Max execution time in ms (default: unlimited). Grace period on final turn. */
  maxTimeMs?: number;
  /** Explicit constraint label for documentation and logging. */
  constraint?: 'read-only' | 'search-only' | 'no-tools' | 'full';
}

/** Lightweight agent for background micro-tasks (assessment, extraction). */
export const MICRO_AGENT: AgentConfig = {
  name: 'MicroTask',
  model: 'gemini-3.1-flash-lite-preview',
  systemInstruction: '',
  thinkingLevel: 'MINIMAL',
  tools: [],
  responseModalities: ['TEXT'],
};

/** Create a micro-agent with a custom instruction. */
export function micro(instruction: string, schema?: ZodTypeAny): AgentConfig {
  return { ...MICRO_AGENT, systemInstruction: instruction, responseSchema: schema };
}

/** Ember design context injected into all agent prompts. Re-exported from token-context. */
export { EMBER_DESIGN_CONTEXT } from '../token-context';
