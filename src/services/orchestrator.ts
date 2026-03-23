/**
 * Orchestrator — wires the full tutor pipeline.
 * See orchestrator-pipeline.ts for shared stage implementations.
 */
import { TUTOR_AGENT, RESEARCHER_AGENT } from './agents';
import { runTextAgent } from './run-agent';
import { resilientTextAgent, resilientStreamingAgent } from './resilient-agent';
import { runAgenticLoop, runAgenticLoopStreaming, type AgenticResult } from './agentic-loop';
import { getGeminiClient, isGeminiAvailable } from './gemini';
import { parseTutorResponse } from './tutor-response-parser';
import { generateVisualization, generateIllustration } from './enrichment';
import { buildGraph, getDelta, serializeSubgraph } from './knowledge-graph';
import { buildGraphContext } from './graph-context';
import { isGeminiAvailable, getGeminiClient } from './gemini';
import { getWorkingMemory } from './working-memory';
import type { NotebookEntry, LiveEntry } from '@/types/entries';
import type { DeferredAction } from './tool-executor';
import type { GraphDeferredAction } from './graph-tools';
import type { StudentProfile, NotebookContext } from './context-assembler';
import {
  runPipelineSetup,
  runPipelineEnrichment,
  runPipelineTemporalLayers,
  type StreamChunkCallback,
  type PipelineSetupResult,
} from './orchestrator-pipeline';

export type { StreamChunkCallback };

export interface OrchestratorResult {
  entries: NotebookEntry[];
  deferredActions: Array<DeferredAction | GraphDeferredAction>;
}

/** Collect enrichment, temporal layers, and deduplicated citations. */
async function collectPostTutor(
  setup: PipelineSetupResult,
  studentText: string,
  entries: LiveEntry[],
  notebookId: string,
): Promise<{ before: NotebookEntry[]; after: NotebookEntry[] }> {
  const after: NotebookEntry[] = [];
  const enrichment = await runPipelineEnrichment(
    setup.routing, studentText, entries, setup.collectedCitations,
  );
  after.push(...enrichment);
  const temporal = await runPipelineTemporalLayers(
    studentText, entries, notebookId, setup.echoPromise,
  );
  after.push(...temporal.after);
  if (setup.collectedCitations.length > 0) {
    const unique = setup.collectedCitations.filter(
      (c, i, arr) => arr.findIndex((x) => x.url === c.url) === i,
    );
    after.push({ type: 'citation', sources: unique });
  }
  return { before: temporal.before, after };
}

/** Execute the full pipeline (non-streaming). */
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

  const setup = await runPipelineSetup(
    studentText, entries, studentId, notebookId, lastSyncTimestamp,
    profile ?? null, notebookCtx ?? null,
  );
  const results: NotebookEntry[] = [];

  // Temporal layer: Echo (backward — runs in parallel with tutor)
  const echoPromise = generateEcho(studentText, entries);

  // Build knowledge graph context in parallel with research
  const [graphCtxLayer, legacyGraph, research] = await Promise.all([
    buildGraphContext(notebookId, studentText).catch(() => null),
    buildGraph(notebookId).catch(() => null),
    routing.research ? fetchResearch(studentText) : Promise.resolve(null),
  ]);

  // Compose context additions
  let graphContext = '';
  if (graphCtxLayer?.serialized) {
    graphContext = `\n\n${graphCtxLayer.serialized}`;
  } else if (legacyGraph && lastSyncTimestamp) {
    const delta = getDelta(legacyGraph, lastSyncTimestamp);
    if (delta.nodes.length > 0) {
      graphContext = `\n\n[Recent changes in knowledge graph]:\n${serializeSubgraph(delta)}`;
    }
  }

  const directiveHint = routing.directive
    ? '\n\n[SYSTEM: The student is ready for an exploration directive. Respond with a tutor-directive type — send them to search, read, try, observe, or compare something specific outside the notebook.]'
    : '';

  // Assemble context (the agent will fetch more via tools)
  const wm = getWorkingMemory(notebookId);
  const ctx = assembleContext({
    studentText: studentText + graphContext + directiveHint,
    entries,
    profile: profile ?? null,
    notebook: notebookCtx ?? null,
    memory: null,
    research,
    workingMemory: wm?.summary ?? undefined,
  });

  // Run tutor with agentic loop (function calling + graph tools)
  let agenticResult: AgenticResult | null = null;
  try {
    if (getGeminiClient()) {
      agenticResult = await runAgenticLoop(
        TUTOR_AGENT, setup.contextMessages,
        { studentId, notebookId, graph: setup.legacyGraph },
      );
    } else {
      // Proxy mode — resilient fallback with retry + cheaper model
      const result = await resilientTextAgent(TUTOR_AGENT, ctx.messages);
      agenticResult = { text: result.text, toolCalls: [], deferredActions: [] };
      if (result.citations.length > 0) {
        results.push({ type: 'citation', sources: result.citations });
      }
    }
    const entry = parseTutorResponse(agenticResult.text);
    if (entry) results.push(entry);
  } catch (err) {
    console.error('[Ember] Tutor error:', err);
  }

  const post = await collectPostTutor(setup, studentText, entries, notebookId);
  results.unshift(...post.before);
  results.push(...post.after);
  return { entries: results, deferredActions: agenticResult?.deferredActions ?? [] };
}

/** Streaming orchestrate — tutor text streams via onChunk. */
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

  const setup = await runPipelineSetup(
    studentText, entries, studentId, notebookId, lastSyncTimestamp,
    profile ?? null, notebookCtx ?? null,
  );
  const results: NotebookEntry[] = [];

  const echoPromise = generateEcho(studentText, entries);

  // Build graph context + research in parallel
  const [graphCtxLayerS, legacyGraphS, researchS] = await Promise.all([
    buildGraphContext(notebookId, studentText).catch(() => null),
    buildGraph(notebookId).catch(() => null),
    routing.research ? fetchResearch(studentText) : Promise.resolve(null),
  ]);

  let graphContextS = '';
  if (graphCtxLayerS?.serialized) {
    graphContextS = `\n\n${graphCtxLayerS.serialized}`;
  } else if (legacyGraphS && lastSyncTimestamp) {
    const delta = getDelta(legacyGraphS, lastSyncTimestamp);
    if (delta.nodes.length > 0) {
      graphContextS = `\n\n[Recent changes in knowledge graph]:\n${serializeSubgraph(delta)}`;
    }
  }

  const directiveHintS = routing.directive
    ? '\n\n[SYSTEM: The student is ready for an exploration directive. Respond with a tutor-directive type — send them to search, read, try, observe, or compare something specific outside the notebook.]'
    : '';

  const wmS = getWorkingMemory(notebookId);
  const ctx = assembleContext({
    studentText: studentText + graphContextS + directiveHintS,
    entries,
    profile: profile ?? null,
    notebook: notebookCtx ?? null,
    memory: null,
    research: researchS,
    workingMemory: wmS?.summary ?? undefined,
  });

  let agenticResult: AgenticResult | null = null;
  try {
    if (getGeminiClient()) {
      agenticResult = await runAgenticLoopStreaming(
        TUTOR_AGENT, setup.contextMessages,
        { studentId, notebookId, graph: setup.legacyGraph },
        onChunk,
      );
    } else {
      const result = await resilientStreamingAgent(
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

  const post = await collectPostTutor(setup, studentText, entries, notebookId);
  results.unshift(...post.before);
  results.push(...post.after);
  return { entries: results, deferredActions: agenticResult?.deferredActions ?? [] };
}

// Re-export for backward compatibility
export { indexCurrentSession } from './file-search/session-indexer';
