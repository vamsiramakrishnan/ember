/**
 * Shared critique response parser — extracts score, issues, and the raw
 * parsed object from an LLM critique response.  Used by artifact-refiner,
 * content-refiner, and image-refiner to avoid duplicating the same
 * JSON-extraction + validation logic.
 */
import { extractJsonObject } from './json-parser';

export interface BaseCritique {
  score: number;
  issues: string[];
  /** The full parsed object, for callers that need domain-specific fields. */
  raw: Record<string, unknown>;
}

const DEFAULT_SCORE = 10;

/**
 * Parse an LLM text response containing a JSON critique.
 * Validates `score` (number, defaults to 10) and `issues` (string[], defaults to []).
 * Returns the raw parsed object so callers can extract additional fields
 * (patches, corrections, editInstructions, etc.) without re-parsing.
 *
 * On any failure returns safe defaults (score 10, empty issues, empty raw).
 */
export function parseCritiqueResponse(text: string): BaseCritique {
  try {
    const parsed = extractJsonObject(text);
    if (!parsed) return { score: DEFAULT_SCORE, issues: [], raw: {} };
    return {
      score: typeof parsed.score === 'number' ? parsed.score : DEFAULT_SCORE,
      issues: Array.isArray(parsed.issues) ? parsed.issues as string[] : [],
      raw: parsed,
    };
  } catch {
    return { score: DEFAULT_SCORE, issues: [], raw: {} };
  }
}
