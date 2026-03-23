/**
 * Background Results Cache — stores the output of the last background
 * task run so the next tutor turn can incorporate it.
 *
 * This closes the feedback loop: background tasks extract entities ->
 * next turn's context assembler reads them -> tutor is aware of updates.
 */

export interface MasteryChange {
  concept: string;
  from: number;
  to: number;
}

export interface BackgroundResults {
  /** New thinkers discovered in the last turn. */
  newThinkers: string[];
  /** New vocabulary terms extracted in the last turn. */
  newTerms: string[];
  /** Mastery changes from the last turn. */
  masteryChanges: MasteryChange[];
  /** Timestamp of the last update. */
  updatedAt: number;
}

function emptyResults(): BackgroundResults {
  return { newThinkers: [], newTerms: [], masteryChanges: [], updatedAt: 0 };
}

let lastResults: BackgroundResults = emptyResults();

/** Update the cache after a background task run. */
export function setBackgroundResults(
  results: Partial<BackgroundResults>,
): void {
  lastResults = {
    ...lastResults,
    ...results,
    updatedAt: Date.now(),
  };
}

/** Read and clear the cache (consumed once per tutor turn). */
export function consumeBackgroundResults(): BackgroundResults | null {
  if (lastResults.updatedAt === 0) return null;
  const snapshot = { ...lastResults };
  lastResults = emptyResults();
  return snapshot;
}
