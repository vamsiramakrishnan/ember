/**
 * Temporal Layers — four directions of intellectual awareness.
 *
 * Echo (backward):  paraphrases what the student said in past sessions
 * Connection:       handled by the tutor agent directly
 * Bridge (forward): emerges from mastery thresholds + knowledge graph
 * Reflection:       synthesizes the session's intellectual movement
 *
 * Each layer runs independently and returns entries to prepend/append.
 * Graph relations are created to link temporal entries to their context.
 */
import { ECHO_AGENT, REFLECTION_AGENT, RESEARCHER_AGENT } from './agents';
import { runTextAgent } from './run-agent';
import { isGeminiAvailable } from './gemini';
import { extractJsonObject } from './json-parser';
import { getMasteryByNotebook } from '@/persistence/repositories/mastery';
import { createRelation } from '@/persistence/repositories/graph';
import type { NotebookEntry, LiveEntry } from '@/types/entries';

// ─── Echo ────────────────────────────────────────────────────

/** Track echo frequency — max 1 per 5 entries. */
let echoCounter = 0;

export async function generateEcho(
  studentText: string,
  pastEntries: LiveEntry[],
): Promise<NotebookEntry | null> {
  echoCounter++;
  if (echoCounter % 5 !== 1) return null;
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
      parts: [{
        text: `Current student entry: "${studentText}"\n\nPast entries:\n${pastStudent}`,
      }],
    }]);

    const parsed = extractJsonObject(result.text);
    if (parsed?.skip) return null;
    if (typeof parsed?.content === 'string') {
      // Create graph relation linking echo to its source entry
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
  } catch {
    return null;
  }
}

// ─── Bridge ──────────────────────────────────────────────────

/** Track bridge frequency — max 1 per session. */
let bridgeGenerated = false;

export function resetBridgeFlag(): void {
  bridgeGenerated = false;
}

export async function generateBridge(
  notebookId: string,
  studentText: string,
): Promise<NotebookEntry | null> {
  if (bridgeGenerated) return null;
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
      bridgeGenerated = true;
      // Create graph relation: bridge connects the source concepts
      for (const m of developing.slice(0, 2)) {
        await createRelation({
          notebookId,
          from: m.id,
          fromKind: 'concept',
          to: `bridge:${Date.now()}`,
          toKind: 'concept',
          type: 'bridges-to',
          weight: 0.7,
        }).catch(() => {});
      }
      return { type: 'bridge-suggestion', content: result.text.trim() };
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Reflection ──────────────────────────────────────────────

/** Count entries in current session for reflection timing. */
let reflectionCounter = 0;
const REFLECTION_INTERVAL = 10;

export function incrementReflectionCounter(): void {
  reflectionCounter++;
}

export function resetReflectionCounter(): void {
  reflectionCounter = 0;
}

export async function generateReflection(
  entries: LiveEntry[],
): Promise<NotebookEntry | null> {
  if (reflectionCounter % REFLECTION_INTERVAL !== 0) return null;
  if (reflectionCounter === 0) return null;
  if (!isGeminiAvailable()) return null;

  const recent = entries.slice(-12).map((e) => {
    const type = e.entry.type;
    const content = 'content' in e.entry ? e.entry.content : '';
    return `[${type}]: ${content}`;
  }).join('\n');

  try {
    const result = await runTextAgent(REFLECTION_AGENT, [{
      role: 'user',
      parts: [{ text: `Last ${entries.slice(-12).length} entries:\n${recent}` }],
    }]);

    const parsed = extractJsonObject(result.text);
    if (typeof parsed?.content === 'string') {
      return { type: 'tutor-reflection', content: parsed.content };
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Graph helpers ───────────────────────────────────────────

async function createEchoRelation(echoSourceId: string, targetId: string): Promise<void> {
  await createRelation({
    notebookId: '',
    from: echoSourceId,
    fromKind: 'entry',
    to: targetId,
    toKind: 'entry',
    type: 'echoes',
    weight: 0.3,
  }).catch(() => {});
}
