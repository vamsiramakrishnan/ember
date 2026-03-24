/**
 * Temporal Layers — four directions of intellectual awareness.
 *
 * Echo (backward):  paraphrases what the student said in past sessions
 * Connection:       handled by the tutor agent directly
 * Bridge (forward): emerges from mastery thresholds + knowledge graph
 * Reflection:       synthesizes the session's intellectual movement
 *
 * Counters are per-notebook and persisted to localStorage via temporal-counters.
 */
import { ECHO_AGENT, REFLECTION_AGENT, RESEARCHER_AGENT } from './agents';
import { runTextAgent } from './run-agent';
import { isGeminiAvailable } from './gemini';
import { getMasteryByNotebook } from '@/persistence/repositories/mastery';
import { createRelation } from '@/persistence/repositories/graph';
import {
  incrementEcho, isBridgeGenerated, markBridgeGenerated,
  resetBridgeFlag as resetBridgeCounter,
  incrementReflection, getReflectionCount,
  resetReflection,
} from './temporal-counters';
import type { NotebookEntry, LiveEntry } from '@/types/entries';

// Re-export with notebookId parameter for callers
export { resetBridgeCounter as resetBridgeFlag };
export { resetReflection as resetReflectionCounter };

export function incrementReflectionCounter(notebookId: string): void {
  incrementReflection(notebookId);
}

// ─── Echo ────────────────────────────────────────────────────

export async function generateEcho(
  notebookId: string, studentText: string, pastEntries: LiveEntry[],
): Promise<NotebookEntry | null> {
  const count = incrementEcho(notebookId);
  if (count % 5 !== 1) return null;
  if (!isGeminiAvailable()) return null;

  const pastStudent = pastEntries
    .filter((e) => ['prose', 'hypothesis', 'question'].includes(e.entry.type))
    .filter((e) => 'content' in e.entry)
    .slice(-20)
    .map((e, i) => `[Session entry ${i + 1}]: ${'content' in e.entry ? e.entry.content : ''}`)
    .join('\n');

  if (!pastStudent) return null;

  try {
    const result = await runTextAgent(ECHO_AGENT, [{
      role: 'user',
      parts: [{ text: `Current student entry: "${studentText}"\n\nPast entries:\n${pastStudent}` }],
    }]);
    const parsed = JSON.parse(result.text) as Record<string, unknown>;
    if (parsed.skip) return null;
    if (typeof parsed.content === 'string') {
      const sourceEntry = pastEntries.find((e) =>
        'content' in e.entry && typeof e.entry.content === 'string' &&
        parsed.content && String(parsed.content).includes(String(e.entry.content).slice(0, 30)),
      );
      if (sourceEntry) {
        await createEchoRelation(sourceEntry.id, String(parsed.sourceEntryId ?? sourceEntry.id));
      }
      return { type: 'echo', content: parsed.content };
    }
    return null;
  } catch { return null; }
}

// ─── Bridge ──────────────────────────────────────────────────

export async function generateBridge(
  notebookId: string, studentText: string,
): Promise<NotebookEntry | null> {
  if (isBridgeGenerated(notebookId)) return null;
  if (!isGeminiAvailable()) return null;

  try {
    const mastery = await getMasteryByNotebook(notebookId);
    const developing = mastery.filter(
      (m) => m.percentage >= 40 && (m.level === 'developing' || m.level === 'strong'),
    );
    if (developing.length === 0) return null;
    const concepts = developing.map((m) => `${m.concept} (${m.percentage}%)`).join(', ');
    const result = await runTextAgent(RESEARCHER_AGENT, [{
      role: 'user',
      parts: [{
        text: `Student is developing mastery in: ${concepts}.\nThey just wrote: "${studentText}"\n\nSuggest ONE intellectual bridge — a connection to a domain they haven't explored yet. One sentence. No preamble.`,
      }],
    }]);
    if (result.text.trim()) {
      markBridgeGenerated(notebookId);
      for (const m of developing.slice(0, 2)) {
        await createRelation({
          notebookId, from: m.id, fromKind: 'concept',
          to: `bridge:${Date.now()}`, toKind: 'concept',
          type: 'bridges-to', weight: 0.7,
        }).catch(() => {});
      }
      return { type: 'bridge-suggestion', content: result.text.trim() };
    }
    return null;
  } catch { return null; }
}

// ─── Reflection ──────────────────────────────────────────────

const REFLECTION_INTERVAL = 10;

export async function generateReflection(
  notebookId: string, entries: LiveEntry[],
): Promise<NotebookEntry | null> {
  const count = getReflectionCount(notebookId);
  if (count % REFLECTION_INTERVAL !== 0) return null;
  if (count === 0) return null;
  if (!isGeminiAvailable()) return null;

  const recent = entries.slice(-12).map((e) => {
    const content = 'content' in e.entry ? e.entry.content : '';
    return `[${e.entry.type}]: ${content}`;
  }).join('\n');

  try {
    const result = await runTextAgent(REFLECTION_AGENT, [{
      role: 'user',
      parts: [{ text: `Last ${entries.slice(-12).length} entries:\n${recent}` }],
    }]);
    const parsed = JSON.parse(result.text) as Record<string, unknown>;
    if (typeof parsed.content === 'string') {
      return { type: 'tutor-reflection', content: parsed.content };
    }
    return null;
  } catch { return null; }
}

// ─── Graph helpers ───────────────────────────────────────────

async function createEchoRelation(echoSourceId: string, targetId: string): Promise<void> {
  await createRelation({
    notebookId: '', from: echoSourceId, fromKind: 'entry',
    to: targetId, toKind: 'entry', type: 'echoes', weight: 0.3,
  }).catch(() => {});
}
