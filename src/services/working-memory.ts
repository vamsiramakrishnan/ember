/**
 * Working Memory — maintains a compressed session summary
 * that evolves with each turn. The tutor sees this summary
 * instead of raw entry history, dramatically improving
 * context coherence over long sessions.
 *
 * Inspired by Claude Code's automatic context compression.
 */
import { runTextAgent } from './run-agent';
import { isGeminiAvailable } from './gemini';
import type { AgentConfig } from './agents';
import type { LiveEntry } from '@/types/entries';

const MICRO_AGENT: AgentConfig = {
  name: 'WorkingMemory',
  model: 'gemini-3.1-flash-lite-preview',
  systemInstruction:
    'You compress notebook session context into a concise running summary. ' +
    'Capture: key insights, open questions, concepts being explored, ' +
    'thinkers mentioned, and the intellectual direction. ' +
    'Max 150 words. Write in present tense. No preamble.',
  thinkingLevel: 'MINIMAL',
  tools: [],
  responseModalities: ['TEXT'],
};

/** Per-notebook working memory. */
export interface WorkingMemory {
  summary: string;
  turnCount: number;
  lastUpdated: number;
}

const memoryCache = new Map<string, WorkingMemory>();
const STORAGE_KEY = 'ember:working-memory';

/** Get the current working memory for a notebook. */
export function getWorkingMemory(notebookId: string): WorkingMemory | null {
  if (memoryCache.has(notebookId)) return memoryCache.get(notebookId)!;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const all = JSON.parse(stored) as Record<string, WorkingMemory>;
      if (all[notebookId]) {
        memoryCache.set(notebookId, all[notebookId]);
        return all[notebookId];
      }
    }
  } catch { /* ignore parse errors */ }

  return null;
}

function saveMemory(): void {
  try {
    const obj: Record<string, WorkingMemory> = {};
    for (const [k, v] of memoryCache) obj[k] = v;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch { /* ignore quota errors */ }
}

/**
 * Update working memory after a tutor turn.
 * Fire-and-forget — called after response is shown to student.
 */
export async function updateWorkingMemory(
  notebookId: string,
  recentEntries: LiveEntry[],
): Promise<void> {
  if (!isGeminiAvailable()) return;

  const existing = getWorkingMemory(notebookId);
  const turnCount = (existing?.turnCount ?? 0) + 1;

  // Only compress every 3 turns to save API calls
  if (turnCount % 3 !== 0 && existing?.summary) {
    memoryCache.set(notebookId, { ...existing, turnCount, lastUpdated: Date.now() });
    saveMemory();
    return;
  }

  const recent = recentEntries.slice(-8).map((le) => {
    const e = le.entry;
    const content = 'content' in e ? e.content : '';
    return `[${e.type}]: ${content}`;
  }).join('\n');

  const prompt = existing?.summary
    ? `Previous summary:\n${existing.summary}\n\nNew entries since last summary:\n${recent}\n\nUpdate the summary to incorporate the new entries. Max 150 words.`
    : `Session entries so far:\n${recent}\n\nCreate a concise summary. Max 150 words.`;

  try {
    const result = await runTextAgent(MICRO_AGENT, [
      { role: 'user', parts: [{ text: prompt }] },
    ]);

    const memory: WorkingMemory = {
      summary: result.text.trim(),
      turnCount,
      lastUpdated: Date.now(),
    };
    memoryCache.set(notebookId, memory);
    saveMemory();
  } catch (err) {
    console.error('[Ember] Working memory update failed:', err);
  }
}

/** Reset working memory for a notebook (new session). */
export function resetWorkingMemory(notebookId: string): void {
  memoryCache.delete(notebookId);
  saveMemory();
}
