/**
 * Orchestrator — wires the full tutor pipeline.
 *
 * Pipeline stages:
 * 1. Router: classify student input → routing decision
 * 2. Graph Context: traverse knowledge graph for relevant context
 * 3. Research: factual grounding (if router says so)
 * 4. Context Assembly: merge all layers into a context window
 * 5. Agentic Tutor: function-calling loop with graph + search tools
 * 6. Temporal Layers: echo, bridge, reflection (parallel with tutor)
 * 7. Enrichment: visualization, illustration (if router says so)
 * 8. Background: deferred actions, constellation sync, mastery update
 *
 * Foreground vs background:
 * - Foreground (blocking): router, graph context, tutor, temporal layers
 * - Background (non-blocking): deferred actions, enrichment, mastery
 *
 * The tutor has 8 graph tools + 7 search/lookup tools available
 * in every turn. It decides what to explore via function calling.
 */
import { TUTOR_AGENT, RESEARCHER_AGENT } from './agents';
import { runTextAgent, runTextAgentStreaming } from './run-agent';
import { runAgenticLoop, runAgenticLoopStreaming, type AgenticResult } from './agentic-loop';
import { classifyImmediate } from './router-agent';
import { assembleContext, type StudentProfile, type NotebookContext, type ResearchContext } from './context-assembler';
import { parseTutorResponse } from './tutor-response-parser';
import { generateVisualization, generateIllustration } from './enrichment';
import { buildGraph, getDelta, serializeSubgraph } from './knowledge-graph';
import { buildGraphContext } from './graph-context';
import { isGeminiAvailable, getGeminiClient } from './gemini';
import type { NotebookEntry, LiveEntry } from '@/types/entries';
import type { DeferredAction } from './tool-executor';
import type { GraphDeferredAction } from './graph-tools';
import { generateEcho, generateBridge, generateReflection, incrementReflectionCounter } from './temporal-layers';
import { setActivityDetail } from '@/state';
import type { ChangeContract } from './artifact-refiner';

export interface OrchestratorResult {
  entries: NotebookEntry[];
  /** Write-side actions the agent requested (annotations, lexicon, graph links). */
  deferredActions: Array<DeferredAction | GraphDeferredAction>;
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

  setActivityDetail({ step: 'routing', label: 'reading your thoughts…' });
  incrementReflectionCounter();
  const routing = await classifyImmediate(studentText, entries);
  const results: NotebookEntry[] = [];

  // Temporal layer: Echo (backward — runs in parallel with tutor)
  const echoPromise = generateEcho(studentText, entries);

  if (routing.research) {
    setActivityDetail({ step: 'researching', label: 'researching…' });
  } else {
    setActivityDetail({ step: 'searching-graph', label: 'exploring connections…' });
  }
  // Build knowledge graph context in parallel with research
  const [graphCtxLayer, legacyGraph, researchResult] = await Promise.all([
    buildGraphContext(notebookId, studentText).catch(() => null),
    buildGraph(notebookId).catch(() => null),
    routing.research ? fetchResearch(studentText) : Promise.resolve({ context: null, citations: [] } as ResearchResult),
  ]);
  const research = researchResult.context;
  const collectedCitations: Array<{ title: string; url: string }> = [...researchResult.citations];

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
  const ctx = assembleContext({
    studentText: studentText + graphContext + directiveHint,
    entries,
    profile: profile ?? null,
    notebook: notebookCtx ?? null,
    memory: null,
    research,
  });

  setActivityDetail({ step: 'thinking', label: 'thinking…' });
  let agenticResult: AgenticResult | null = null;
  try {
    if (getGeminiClient()) {
      agenticResult = await runAgenticLoop(
        TUTOR_AGENT, ctx.messages,
        { studentId, notebookId, graph: legacyGraph },
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
    setActivityDetail({ step: 'visualizing', label: 'composing a visualization…' });
    const vizContract: ChangeContract = {
      researchGrounded: routing.research,
      sourceUrls: collectedCitations.map((c) => c.url),
    };
    const viz = await generateVisualization(studentText, entries, vizContract);
    if (viz) results.push(viz);
  }
  if (routing.illustrate) {
    setActivityDetail({ step: 'illustrating', label: 'sketching a concept…' });
    const ill = await generateIllustration(studentText);
    if (ill) results.push(ill);
  }

  setActivityDetail({ step: 'reflecting', label: 'reflecting…' });
  const echo = await echoPromise;
  if (echo) results.unshift(echo); // Echo appears BEFORE tutor response

  // Temporal layer: Bridge (forward — based on mastery thresholds)
  const bridge = await generateBridge(notebookId, studentText);
  if (bridge) results.push(bridge);

  // Temporal layer: Reflection (inward — every ~10 entries)
  const reflection = await generateReflection(entries);
  if (reflection) results.push(reflection);

  // Append collected research citations (function-scoped, not global)
  if (collectedCitations.length > 0) {
    const unique = collectedCitations.filter(
      (c, i, arr) => arr.findIndex((x) => x.url === c.url) === i,
    );
    results.push({ type: 'citation', sources: unique });
  }

  return {
    entries: results,
    deferredActions: agenticResult?.deferredActions ?? [],
  };
}

interface ResearchResult {
  context: ResearchContext | null;
  citations: Array<{ title: string; url: string }>;
}

async function fetchResearch(text: string): Promise<ResearchResult> {
  try {
    const result = await runTextAgent(RESEARCHER_AGENT, [{
      role: 'user',
      parts: [{
        text: `Student asked: "${text}"\n\nFactual grounding, historical context, thinker connections. Max 200 words.`,
      }],
    }]);
    return {
      context: result.text.trim() ? { facts: result.text } : null,
      citations: result.citations,
    };
  } catch {
    return { context: null, citations: [] };
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

  setActivityDetail({ step: 'routing', label: 'reading your thoughts…' });
  incrementReflectionCounter();
  const routing = await classifyImmediate(studentText, entries);
  const results: NotebookEntry[] = [];

  const echoPromise = generateEcho(studentText, entries);

  // Build graph context + research in parallel
  if (routing.research) {
    setActivityDetail({ step: 'researching', label: 'researching…' });
  } else {
    setActivityDetail({ step: 'searching-graph', label: 'exploring connections…' });
  }
  const [graphCtxLayerS, legacyGraphS, researchResultS] = await Promise.all([
    buildGraphContext(notebookId, studentText).catch(() => null),
    buildGraph(notebookId).catch(() => null),
    routing.research ? fetchResearch(studentText) : Promise.resolve({ context: null, citations: [] } as ResearchResult),
  ]);
  const researchS = researchResultS.context;
  const collectedCitationsS: Array<{ title: string; url: string }> = [...researchResultS.citations];

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

  const ctx = assembleContext({
    studentText: studentText + graphContextS + directiveHintS,
    entries,
    profile: profile ?? null,
    notebook: notebookCtx ?? null,
    memory: null,
    research: researchS,
  });

  setActivityDetail({ step: 'streaming', label: 'writing…' });
  let agenticResult: AgenticResult | null = null;
  try {
    if (getGeminiClient()) {
      agenticResult = await runAgenticLoopStreaming(
        TUTOR_AGENT, ctx.messages,
        { studentId, notebookId, graph: legacyGraphS },
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
    setActivityDetail({ step: 'visualizing', label: 'composing a visualization…' });
    const vizContract: ChangeContract = {
      researchGrounded: routing.research,
      sourceUrls: collectedCitationsS.map((c) => c.url),
    };
    const viz = await generateVisualization(studentText, entries, vizContract);
    if (viz) results.push(viz);
  }
  if (routing.illustrate) {
    setActivityDetail({ step: 'illustrating', label: 'sketching a concept…' });
    const ill = await generateIllustration(studentText);
    if (ill) results.push(ill);
  }

  setActivityDetail({ step: 'reflecting', label: 'reflecting…' });
  const echo = await echoPromise;
  if (echo) results.unshift(echo);

  const bridge = await generateBridge(notebookId, studentText);
  if (bridge) results.push(bridge);

  const reflection = await generateReflection(entries);
  if (reflection) results.push(reflection);

  if (collectedCitationsS.length > 0) {
    const unique = collectedCitationsS.filter(
      (c, i, arr) => arr.findIndex((x) => x.url === c.url) === i,
    );
    results.push({ type: 'citation', sources: unique });
  }

  return {
    entries: results,
    deferredActions: agenticResult?.deferredActions ?? [],
  };
}

// Re-export for backward compatibility
export { indexCurrentSession } from './file-search/session-indexer';
