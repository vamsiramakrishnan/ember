/**
 * Shared JSON extraction — centralises the pattern of extracting
 * structured JSON from LLM text responses that may contain
 * markdown fences, prose wrappers, or raw JSON.
 *
 * Replaces 5+ duplicated implementations across services.
 */

/** Extract a JSON object from an LLM text response. */
export function extractJsonObject(text: string): Record<string, unknown> | null {
  try {
    const cleaned = stripFences(text);
    // Try object match first, then raw parse
    const match = cleaned.match(/(\{[\s\S]*\})/);
    return JSON.parse(match?.[1] ?? cleaned) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Extract a JSON array from an LLM text response. */
export function extractJsonArray<T = unknown>(text: string): T[] | null {
  try {
    const cleaned = stripFences(text);
    const match = cleaned.match(/(\[[\s\S]*\])/);
    return JSON.parse(match?.[1] ?? cleaned) as T[];
  } catch {
    return null;
  }
}

/** Parse structured JSON response, typed. */
export function parseStructured<T>(text: string): T | null {
  try {
    const cleaned = stripFences(text);
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

/** Strip markdown code fences. */
export function stripFences(text: string): string {
  return text.trim()
    .replace(/^```(?:json|html|typescript|javascript)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}
