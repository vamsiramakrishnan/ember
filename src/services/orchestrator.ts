/**
 * Orchestrator — thin coordinator that wires the pipeline:
 * Router → Context → Agentic Tutor (with tools) → Enrichment
 *
 * The tutor now has function-calling tools to traverse the
 * knowledge graph, search File Search, and create new data.
 * It decides what context it needs, not us.
 */
import { TUTOR_AGENT, RESEARCHER_AGENT } from './agents';
import { runTextAgent, runTextAgentStreaming } from './run-agent';
import { runAgenticLoop, runAgenticLoopStreaming, type AgenticResult } from './agentic-loop';
import { classifyImmediate } from './router-agent';
import { assembleContext, type StudentProfile, type NotebookContext, type ResearchContext } from './context-assembler';
import { parseTutorResponse } from './tutor-response-parser';
import { generateVisualization, generateIllustration } from './enrichment';
import { buildGraph, getDelta, serializeSubgraph } from './knowledge-graph';
import { isGeminiAvailable, getGeminiClient } from './gemini';
import type { NotebookEntry, LiveEntry } from '@/types/entries';
import type { DeferredAction } from './tool-executor';
import { generateEcho, generateBridge, generateReflection, incrementReflectionCounter } from './temporal-layers';

export interface OrchestratorResult {
  entries: NotebookEntry[];
  /** Write-side actions the agent requested (annotations, lexicon). */
  deferredActions: DeferredAction[];
}

/** Execute the full pipeline. */
export async function orchestrate(
  studentText: string,
  entries: LiveEntry[],
  studentId: string,
  notebookId: string,
  profile?: StudentProfile | null,
  notebookCtx?: NotebookContext | null,
  lastSyncTimestamp?: number,
): Promise<OrchestratorResult> {
  if (!isGeminiAvailable()) return { entries: [], deferredActions: [] };

  incrementReflectionCounter();
  const routing = await classifyImmediate(studentText, entries);
  const results: NotebookEntry[] = [];

  // Temporal layer: Echo (backward — runs in parallel with tutor)
  const echoPromise = generateEcho(studentText, entries);

  // Build knowledge graph + delta for context
  let graphContext = '';
  let graph = null;
  try {
    graph = await buildGraph(notebookId);
    if (lastSyncTimestamp) {
      const delta = getDelta(graph, lastSyncTimestamp);
      if (delta.nodes.length > 0) {
        graphContext = `\n\n[Recent changes in knowledge graph]:\n${serializeSubgraph(delta)}`;
      }
    }
  } catch {
    // Graph build failed — continue without
  }

  // Research (if router says so)
  const research = routing.research ? await fetchResearch(studentText) : null;

  // If router says directive, hint the tutor
  const directiveHint = routing.directive
    ? '\n\n[SYSTEM: The student is ready for an exploration directive. Respond with a tutor-directive type — send them to search, read, try, observe, or compare something specific outside the notebook.]'
    : '';

  // Assemble minimal context (the agent will fetch more via tools)
  const ctx = assembleContext({
    studentText: studentText + graphContext + directiveHint,
    entries,
    profile: profile ?? null,
    notebook: notebookCtx ?? null,
    memory: null,
    research,
  });

  // Run tutor with agentic loop (function calling)
  let agenticResult: AgenticResult | null = null;
  try {
    if (getGeminiClient()) {
      agenticResult = await runAgenticLoop(
        TUTOR_AGENT, ctx.messages,
        { studentId, notebookId, graph },
      );
    } else {
      // Proxy mode — fall back to simple text generation
      const result = await runTextAgent(TUTOR_AGENT, ctx.messages);
      agenticResult = { text: result.text, toolCalls: [], deferredActions: [] };
      // Surface Google Search citations
      if (result.citations.length > 0) {
        results.push({ type: 'citation', sources: result.citations });
      }
    }

    const entry = parseTutorResponse(agenticResult.text);
    if (entry) results.push(entry);
  } catch (err) {
    console.error('[Ember] Tutor error:', err);
  }

  // Enrichment (if router says so)
  if (routing.visualize) {
    const viz = await generateVisualization(studentText, entries);
    if (viz) results.push(viz);
  }
  if (routing.illustrate) {
    const ill = await generateIllustration(studentText);
    if (ill) results.push(ill);
  }

  // Temporal layer: Echo (resolve the parallel promise)
  const echo = await echoPromise;
  if (echo) results.unshift(echo); // Echo appears BEFORE tutor response

  // Temporal layer: Bridge (forward — based on mastery thresholds)
  const bridge = await generateBridge(notebookId, studentText);
  if (bridge) results.push(bridge);

  // Temporal layer: Reflection (inward — every ~10 entries)
  const reflection = await generateReflection(entries);
  if (reflection) results.push(reflection);

  // Collect any pending research citations
  if (pendingCitations.length > 0) {
    const unique = pendingCitations.filter(
      (c, i, arr) => arr.findIndex((x) => x.url === c.url) === i,
    );
    results.push({ type: 'citation', sources: unique });
    pendingCitations.length = 0; // Reset for next call
  }

  return {
    entries: results,
    deferredActions: agenticResult?.deferredActions ?? [],
  };
}

/** Collected citations from research + tutor calls. */
const pendingCitations: Array<{ title: string; url: string }> = [];

async function fetchResearch(text: string): Promise<ResearchContext | null> {
  try {
    const result = await runTextAgent(RESEARCHER_AGENT, [{
      role: 'user',
      parts: [{
        text: `Student asked: "${text}"\n\nFactual grounding, historical context, thinker connections. Max 200 words.`,
      }],
    }]);
    // Collect research citations
    if (result.citations.length > 0) {
      pendingCitations.push(...result.citations);
    }
    return result.text.trim() ? { facts: result.text } : null;
  } catch {
    return null;
  }
}

/** Streaming callback shape. */
export type StreamChunkCallback = (chunk: string, accumulated: string) => void;

/**
 * Streaming orchestrate — same pipeline as orchestrate(), but the tutor's
 * text response streams token-by-token via the onChunk callback.
 * Non-tutor entries (echo, bridge, reflection, enrichment) are returned
 * in the final result after the stream completes.
 */
export async function streamOrchestrate(
  studentText: string,
  entries: LiveEntry[],
  studentId: string,
  notebookId: string,
  onChunk: StreamChunkCallback,
  profile?: StudentProfile | null,
  notebookCtx?: NotebookContext | null,
  lastSyncTimestamp?: number,
): Promise<OrchestratorResult> {
  if (!isGeminiAvailable()) return { entries: [], deferredActions: [] };

  incrementReflectionCounter();
  const routing = await classifyImmediate(studentText, entries);
  const results: NotebookEntry[] = [];

  const echoPromise = generateEcho(studentText, entries);

  let graphContext = '';
  let graph = null;
  try {
    graph = await buildGraph(notebookId);
    if (lastSyncTimestamp) {
      const delta = getDelta(graph, lastSyncTimestamp);
      if (delta.nodes.length > 0) {
        graphContext = `\n\n[Recent changes in knowledge graph]:\n${serializeSubgraph(delta)}`;
      }
    }
  } catch { /* continue without graph */ }

  const research = routing.research ? await fetchResearch(studentText) : null;

  const directiveHint = routing.directive
    ? '\n\n[SYSTEM: The student is ready for an exploration directive. Respond with a tutor-directive type — send them to search, read, try, observe, or compare something specific outside the notebook.]'
    : '';

  const ctx = assembleContext({
    studentText: studentText + graphContext + directiveHint,
    entries,
    profile: profile ?? null,
    notebook: notebookCtx ?? null,
    memory: null,
    research,
  });

  let agenticResult: AgenticResult | null = null;
  try {
    if (getGeminiClient()) {
      agenticResult = await runAgenticLoopStreaming(
        TUTOR_AGENT, ctx.messages,
        { studentId, notebookId, graph },
        onChunk,
      );
    } else {
      const result = await runTextAgentStreaming(
        TUTOR_AGENT, ctx.messages, onChunk,
      );
      agenticResult = { text: result.text, toolCalls: [], deferredActions: [] };
      if (result.citations.length > 0) {
        results.push({ type: 'citation', sources: result.citations });
      }
    }

    const entry = parseTutorResponse(agenticResult.text);
    if (entry) results.push(entry);
  } catch (err) {
    console.error('[Ember] Streaming tutor error:', err);
  }

  if (routing.visualize) {
    const viz = await generateVisualization(studentText, entries);
    if (viz) results.push(viz);
  }
  if (routing.illustrate) {
    const ill = await generateIllustration(studentText);
    if (ill) results.push(ill);
  }

  const echo = await echoPromise;
  if (echo) results.unshift(echo);

  const bridge = await generateBridge(notebookId, studentText);
  if (bridge) results.push(bridge);

  const reflection = await generateReflection(entries);
  if (reflection) results.push(reflection);

  if (pendingCitations.length > 0) {
    const unique = pendingCitations.filter(
      (c, i, arr) => arr.findIndex((x) => x.url === c.url) === i,
    );
    results.push({ type: 'citation', sources: unique });
    pendingCitations.length = 0;
  }

  return {
    entries: results,
    deferredActions: agenticResult?.deferredActions ?? [],
  };
}

// Re-export for backward compatibility
export { indexCurrentSession } from './file-search/session-indexer';
