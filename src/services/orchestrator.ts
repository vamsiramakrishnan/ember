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

  setActivityDetail({ step: 'thinking', label: 'thinking...' });
  let agenticResult: AgenticResult | null = null;
  try {
    if (getGeminiClient()) {
      agenticResult = await runAgenticLoop(
        TUTOR_AGENT, setup.contextMessages,
        { studentId, notebookId },
      );
    } else {
      const result = await resilientTextAgent(TUTOR_AGENT, setup.contextMessages);
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

  setActivityDetail({ step: 'streaming', label: 'writing...' });
  let agenticResult: AgenticResult | null = null;
  try {
    if (getGeminiClient()) {
      agenticResult = await runAgenticLoopStreaming(
        TUTOR_AGENT, setup.contextMessages,
        { studentId, notebookId },
        onChunk,
      );
    } else {
      const result = await resilientStreamingAgent(
        TUTOR_AGENT, setup.contextMessages, onChunk,
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
