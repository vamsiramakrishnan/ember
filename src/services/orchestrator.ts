/**
 * Orchestrator — wires the full tutor pipeline.
 * See orchestrator-pipeline.ts for shared stage implementations.
 */
import { TUTOR_AGENT } from './agents';
import { resilientTextAgent, resilientStreamingAgent } from './resilient-agent';
import { runAgenticLoop, runAgenticLoopStreaming, type AgenticResult } from './agentic-loop';
import { getGeminiClient, isGeminiAvailable } from './gemini';
import { parseTutorResponse } from './tutor-response-parser';
import { setActivityDetail } from '@/state';
import { narrateStep, cancelNarration } from './status-narrator';
import { log, traceAgentDispatch } from '@/observability';
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
  signal?: AbortSignal,
): Promise<OrchestratorResult> {
  if (!isGeminiAvailable()) return { entries: [], deferredActions: [] };

  const setup = await runPipelineSetup(
    studentText, entries, studentId, notebookId, lastSyncTimestamp,
    profile ?? null, notebookCtx ?? null,
  );
  if (signal?.aborted) return { entries: [], deferredActions: [] };
  const results: NotebookEntry[] = [];

  setActivityDetail({ step: 'thinking', label: 'thinking...' });
  narrateStep('thinking', studentText);
  log.breadcrumb('orchestrator', 'tutor dispatch starting', { notebookId });
  let agenticResult: AgenticResult | null = null;
  try {
    agenticResult = await traceAgentDispatch('tutor', TUTOR_AGENT.model, async () => {
      if (getGeminiClient()) {
        return runAgenticLoop(
          TUTOR_AGENT, setup.contextMessages,
          { studentId, notebookId },
          signal,
        );
      }
      const result = await resilientTextAgent(TUTOR_AGENT, setup.contextMessages);
      if (result.citations.length > 0) {
        results.push({ type: 'citation', sources: result.citations });
      }
      return { text: result.text, toolCalls: [], deferredActions: [] };
    });
    if (signal?.aborted) return { entries: results, deferredActions: [] };
    const entry = parseTutorResponse(agenticResult.text);
    if (entry) results.push(entry);
  } catch (err) {
    log.error('Tutor dispatch failed', err instanceof Error ? err : undefined, { notebookId });
  }

  cancelNarration();
  if (signal?.aborted) return { entries: results, deferredActions: agenticResult?.deferredActions ?? [] };
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
  signal?: AbortSignal,
): Promise<OrchestratorResult> {
  if (!isGeminiAvailable()) return { entries: [], deferredActions: [] };

  const setup = await runPipelineSetup(
    studentText, entries, studentId, notebookId, lastSyncTimestamp,
    profile ?? null, notebookCtx ?? null,
  );
  if (signal?.aborted) return { entries: [], deferredActions: [] };
  const results: NotebookEntry[] = [];

  setActivityDetail({ step: 'streaming', label: 'writing...' });
  cancelNarration(); // Stop narration once streaming begins
  log.breadcrumb('orchestrator', 'streaming tutor dispatch', { notebookId });
  let agenticResult: AgenticResult | null = null;
  try {
    agenticResult = await traceAgentDispatch('tutor-stream', TUTOR_AGENT.model, async () => {
      if (getGeminiClient()) {
        return runAgenticLoopStreaming(
          TUTOR_AGENT, setup.contextMessages,
          { studentId, notebookId },
          onChunk,
          signal,
        );
      }
      const result = await resilientStreamingAgent(
        TUTOR_AGENT, setup.contextMessages, onChunk,
      );
      if (result.citations.length > 0) {
        results.push({ type: 'citation', sources: result.citations });
      }
      return { text: result.text, toolCalls: [], deferredActions: [] };
    });
    if (signal?.aborted) return { entries: results, deferredActions: [] };
    const entry = parseTutorResponse(agenticResult.text);
    if (entry) results.push(entry);
  } catch (err) {
    log.error('Streaming tutor dispatch failed', err instanceof Error ? err : undefined, { notebookId });
  }

  cancelNarration();
  if (signal?.aborted) return { entries: results, deferredActions: agenticResult?.deferredActions ?? [] };
  const post = await collectPostTutor(setup, studentText, entries, notebookId);
  results.unshift(...post.before);
  results.push(...post.after);
  return { entries: results, deferredActions: agenticResult?.deferredActions ?? [] };
}

// Re-export for backward compatibility
export { indexCurrentSession } from './file-search/session-indexer';
