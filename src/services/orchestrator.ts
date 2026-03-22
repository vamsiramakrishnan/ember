/**
 * Orchestrator — thin coordinator that wires the pipeline:
 * Router → File Search → Researcher → Context → Tutor → Enrichment
 *
 * Each step is a separate module. This file just sequences them.
 */
import { TUTOR_AGENT, RESEARCHER_AGENT } from './agents';
import { runTextAgent } from './run-agent';
import { getOrCreateStore, searchNotebook, searchByType } from './file-search';
import { classifyImmediate } from './router-agent';
import { assembleContext, type StudentProfile, type NotebookContext, type SemanticMemory, type ResearchContext } from './context-assembler';
import { parseTutorResponse } from './tutor-response-parser';
import { generateVisualization, generateIllustration } from './enrichment';
import { isGeminiAvailable, getGeminiClient } from './gemini';
import type { NotebookEntry, LiveEntry } from '@/types/entries';

export interface OrchestratorResult {
  entries: NotebookEntry[];
}

/** Execute the full pipeline. */
export async function orchestrate(
  studentText: string,
  entries: LiveEntry[],
  studentId: string,
  notebookId: string,
  profile?: StudentProfile | null,
  notebookCtx?: NotebookContext | null,
): Promise<OrchestratorResult> {
  if (!isGeminiAvailable()) return { entries: [] };

  const routing = await classifyImmediate(studentText, entries);
  const results: NotebookEntry[] = [];

  // File Search (always-on)
  const memory = await fetchMemory(studentId, notebookId, studentText, routing);

  // Research (if router says so)
  const research = routing.research ? await fetchResearch(studentText) : null;

  // Tutor (always)
  const ctx = assembleContext({
    studentText, entries,
    profile: profile ?? null,
    notebook: notebookCtx ?? null,
    memory, research,
  });

  try {
    const result = await runTextAgent(TUTOR_AGENT, ctx.messages);
    const entry = parseTutorResponse(result.text);
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

  return { entries: results };
}

/** Fetch memory context from File Search. */
async function fetchMemory(
  studentId: string,
  notebookId: string,
  studentText: string,
  routing: { research: boolean; deepMemory: boolean },
): Promise<SemanticMemory | null> {
  if (!getGeminiClient()) return null;

  try {
    const store = await getOrCreateStore(studentId);
    const query = buildSearchQuery(studentText, routing);
    const main = await searchNotebook(store, query, notebookId,
      'Return relevant past discussions, vocabulary, and thinker connections. Be concise.');

    const memory: SemanticMemory = {
      relevantHistory: main.text.trim() || null,
      relevantVocabulary: null,
      relevantThinkers: null,
      citations: main.citations,
    };

    if (routing.deepMemory) {
      const [m, l, e] = await Promise.allSettled([
        searchByType(store, studentText, 'mastery', notebookId),
        searchByType(store, studentText, 'lexicon', notebookId),
        searchByType(store, studentText, 'encounter', notebookId),
      ]);
      if (m.status === 'fulfilled' && m.value.text) {
        memory.relevantHistory = (memory.relevantHistory ?? '') + `\n\n[Mastery]: ${m.value.text}`;
      }
      if (l.status === 'fulfilled' && l.value.text) memory.relevantVocabulary = l.value.text;
      if (e.status === 'fulfilled' && e.value.text) memory.relevantThinkers = e.value.text;
    }

    return memory;
  } catch {
    return null;
  }
}

/** Fetch research context from Researcher agent. */
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

function buildSearchQuery(
  text: string,
  routing: { research: boolean; deepMemory: boolean },
): string {
  const parts = [`Student wrote: "${text}"`];
  if (routing.research) parts.push('Find past discussions, vocabulary, thinker connections.');
  if (routing.deepMemory) parts.push('Include mastery, vocabulary progress, curiosity threads.');
  parts.push('Only directly relevant context.');
  return parts.join(' ');
}

// indexCurrentSession moved to file-search/indexing.ts
export { indexCurrentSession } from './file-search/session-indexer';
