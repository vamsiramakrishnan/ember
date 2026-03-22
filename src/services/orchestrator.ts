/**
 * Orchestrator — thin coordinator that wires the pipeline:
 * Router → Context → Agentic Tutor (with tools) → Enrichment
 *
 * The tutor now has function-calling tools to traverse the
 * knowledge graph, search File Search, and create new data.
 * It decides what context it needs, not us.
 */
import { TUTOR_AGENT, RESEARCHER_AGENT } from './agents';
import { runTextAgent } from './run-agent';
import { runAgenticLoop, type AgenticResult } from './agentic-loop';
import { classifyImmediate } from './router-agent';
import { assembleContext, type StudentProfile, type NotebookContext, type ResearchContext } from './context-assembler';
import { parseTutorResponse } from './tutor-response-parser';
import { generateVisualization, generateIllustration } from './enrichment';
import { buildGraph, getDelta, serializeSubgraph } from './knowledge-graph';
import { isGeminiAvailable, getGeminiClient } from './gemini';
import type { NotebookEntry, LiveEntry } from '@/types/entries';
import type { DeferredAction } from './tool-executor';

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

  const routing = await classifyImmediate(studentText, entries);
  const results: NotebookEntry[] = [];

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

  // Assemble minimal context (the agent will fetch more via tools)
  const ctx = assembleContext({
    studentText: studentText + graphContext,
    entries,
    profile: profile ?? null,
    notebook: notebookCtx ?? null,
    memory: null, // Agent fetches its own via search_history tool
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

  return {
    entries: results,
    deferredActions: agenticResult?.deferredActions ?? [],
  };
}

async function fetchResearch(text: string): Promise<ResearchContext | null> {
  try {
    const result = await runTextAgent(RESEARCHER_AGENT, [{
      role: 'user',
      parts: [{
        text: `Student asked: "${text}"\n\nFactual grounding, historical context, thinker connections. Max 200 words.`,
      }],
    }]);
    return result.text.trim() ? { facts: result.text } : null;
  } catch {
    return null;
  }
}

// Re-export for backward compatibility
export { indexCurrentSession } from './file-search/session-indexer';
