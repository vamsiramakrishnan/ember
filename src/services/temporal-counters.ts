/**
 * Per-notebook temporal counters — persisted to localStorage.
 *
 * Replaces global counters that were shared across notebooks and
 * lost on page refresh. Each notebook tracks its own echo, reflection,
 * and bridge state independently.
 */

interface TemporalCounters {
  echo: number;
  reflection: number;
  bridgeGenerated: boolean;
}

const counterCache = new Map<string, TemporalCounters>();
const STORAGE_KEY = 'ember:temporal-counters';

function getCounters(notebookId: string): TemporalCounters {
  if (counterCache.has(notebookId)) return counterCache.get(notebookId)!;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const all = JSON.parse(stored) as Record<string, TemporalCounters>;
      if (all[notebookId]) {
        counterCache.set(notebookId, all[notebookId]);
        return all[notebookId];
      }
    }
  } catch { /* ignore parse errors */ }

  const fresh: TemporalCounters = { echo: 0, reflection: 0, bridgeGenerated: false };
  counterCache.set(notebookId, fresh);
  return fresh;
}

function saveCounters(): void {
  try {
    const obj: Record<string, TemporalCounters> = {};
    for (const [k, v] of counterCache) obj[k] = v;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch { /* ignore quota errors */ }
}

/** Increment and return the echo counter for a notebook. */
export function incrementEcho(notebookId: string): number {
  const c = getCounters(notebookId);
  c.echo++;
  saveCounters();
  return c.echo;
}

/** Get the echo counter value without incrementing. */
export function getEchoCount(notebookId: string): number {
  return getCounters(notebookId).echo;
}

/** Check if a bridge has already been generated for this notebook session. */
export function isBridgeGenerated(notebookId: string): boolean {
  return getCounters(notebookId).bridgeGenerated;
}

/** Mark that a bridge was generated for this notebook. */
export function markBridgeGenerated(notebookId: string): void {
  const c = getCounters(notebookId);
  c.bridgeGenerated = true;
  saveCounters();
}

/** Reset bridge flag for a notebook (e.g. new session). */
export function resetBridgeFlag(notebookId: string): void {
  const c = getCounters(notebookId);
  c.bridgeGenerated = false;
  saveCounters();
}

/** Increment and return the reflection counter for a notebook. */
export function incrementReflection(notebookId: string): number {
  const c = getCounters(notebookId);
  c.reflection++;
  saveCounters();
  return c.reflection;
}

/** Get the reflection counter without incrementing. */
export function getReflectionCount(notebookId: string): number {
  return getCounters(notebookId).reflection;
}

/** Reset reflection counter for a notebook. */
export function resetReflection(notebookId: string): void {
  const c = getCounters(notebookId);
  c.reflection = 0;
  saveCounters();
}
