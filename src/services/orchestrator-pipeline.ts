/** Orchestrator Pipeline — shared stages for orchestrate() and streamOrchestrate(). */
import { RESEARCHER_AGENT } from './agents';
import { runTextAgent } from './run-agent';
import { buildGraphContext } from './graph-context';
import { buildGraph, getDelta, serializeSubgraph } from './knowledge-graph';
import { assembleContext, type StudentProfile, type NotebookContext, type ResearchContext } from './context-assembler';
import { generateVisualization, generateIllustration } from './enrichment';
import { generateEcho, generateBridge, generateReflection, incrementReflectionCounter } from './temporal-layers';
import { classifyImmediate, type RoutingDecision } from './router-agent';
import { setActivityDetail } from '@/state';
import { buildSemanticMemory } from './semantic-memory';
import { appendDiversityHints } from './diversity-hints';
import type { NotebookEntry, LiveEntry } from '@/types/entries';
import type { ChangeContract } from './artifact-refiner';
import type { Subgraph } from './knowledge-graph';
import type { AgentMessage } from './run-agent';

export interface ResearchResult {
  context: ResearchContext | null;
  citations: Array<{ title: string; url: string }>;
}

/** Streaming callback shape. */
export type StreamChunkCallback = (chunk: string, accumulated: string) => void;

export interface PipelineSetupResult {
  routing: RoutingDecision;
  legacyGraph: Subgraph | null;
  collectedCitations: Array<{ title: string; url: string }>;
  echoPromise: Promise<NotebookEntry | null>;
  contextMessages: AgentMessage[];
}

export async function fetchResearch(text: string): Promise<ResearchResult> {
  try {
    const prompt = `Student asked: "${text}"\n\nFactual grounding, historical context, thinker connections. Max 200 words.`;
    const result = await runTextAgent(RESEARCHER_AGENT, [
      { role: 'user', parts: [{ text: prompt }] },
    ]);
    const context = result.text.trim() ? { facts: result.text } : null;
    return { context, citations: result.citations };
  } catch {
    return { context: null, citations: [] };
  }
}

/** Stage 1: Route, build graph context, fetch research + memory — all in parallel. */
export async function runPipelineSetup(
  studentText: string,
  entries: LiveEntry[],
  studentId: string,
  notebookId: string,
  lastSyncTimestamp: number | undefined,
  profile: StudentProfile | null,
  notebookCtx: NotebookContext | null,
): Promise<PipelineSetupResult> {
  setActivityDetail({ step: 'routing', label: 'reading your thoughts...' });
  incrementReflectionCounter();
  const routing = await classifyImmediate(studentText, entries);

  const echoPromise = generateEcho(studentText, entries);
  const stepLabel = routing.research ? 'researching...' : 'exploring connections...';
  const stepKey = routing.research ? 'researching' : 'searching-graph';
  setActivityDetail({ step: stepKey, label: stepLabel });
  const [graphCtxLayer, legacyGraph, researchResult, memory] = await Promise.all([
    buildGraphContext(notebookId, studentText).catch(() => null),
    buildGraph(notebookId).catch(() => null),
    routing.research
      ? fetchResearch(studentText)
      : Promise.resolve({ context: null, citations: [] } as ResearchResult),
    buildSemanticMemory(studentId, studentText, notebookId),
  ]);

  const research = researchResult.context;
  const collectedCitations = [...researchResult.citations];

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

  const ctx = assembleContext({
    studentText: studentText + graphContext + directiveHint,
    entries,
    profile,
    notebook: notebookCtx,
    memory,
    research,
  });

  appendDiversityHints(ctx.messages);

  return {
    routing, legacyGraph, collectedCitations,
    echoPromise, contextMessages: ctx.messages,
  };
}

/** Stage 2: Enrichment — visualization and illustration if router says so. */
export async function runPipelineEnrichment(
  routing: RoutingDecision,
  studentText: string,
  entries: LiveEntry[],
  collectedCitations: Array<{ title: string; url: string }>,
): Promise<NotebookEntry[]> {
  const results: NotebookEntry[] = [];
  if (routing.visualize) {
    setActivityDetail({ step: 'visualizing', label: 'composing a visualization...' });
    const vizContract: ChangeContract = {
      researchGrounded: routing.research,
      sourceUrls: collectedCitations.map((c) => c.url),
    };
    const viz = await generateVisualization(studentText, entries, vizContract);
    if (viz) results.push(viz);
  }
  if (routing.illustrate) {
    setActivityDetail({ step: 'illustrating', label: 'sketching a concept...' });
    const ill = await generateIllustration(studentText);
    if (ill) results.push(ill);
  }
  return results;
}

/** Stage 3: Temporal layers — echo, bridge, reflection. */
export async function runPipelineTemporalLayers(
  studentText: string, entries: LiveEntry[],
  notebookId: string, echoPromise: Promise<NotebookEntry | null>,
): Promise<{ before: NotebookEntry[]; after: NotebookEntry[] }> {
  setActivityDetail({ step: 'reflecting', label: 'reflecting...' });
  const before: NotebookEntry[] = [];
  const after: NotebookEntry[] = [];
  const echo = await echoPromise;
  if (echo) before.push(echo);
  const bridge = await generateBridge(notebookId, studentText);
  if (bridge) after.push(bridge);
  const reflection = await generateReflection(entries);
  if (reflection) after.push(reflection);
  return { before, after };
}
