/**
 * JSON Cast — robust JSON extraction from freeform LLM text.
 *
 * Gemma 3 1B IT does not support JSON mode, but can generate JSON
 * capably when prompted. This module extracts and validates JSON
 * from mixed text output, handling:
 *   - JSON embedded in markdown code fences
 *   - JSON preceded/followed by prose
 *   - Minor trailing comma issues
 *   - Partial/truncated JSON (returns null)
 */

/**
 * Extract the first valid JSON object or array from freeform text.
 * Returns the parsed value, or null if no valid JSON is found.
 */
export function castJson<T = unknown>(raw: string): T | null {
  if (!raw || !raw.trim()) return null;

  // Strategy 1: Try the raw string directly
  const direct = tryParse<T>(raw.trim());
  if (direct !== null) return direct;

  // Strategy 2: Extract from markdown code fences
  const fenced = extractFromFence(raw);
  if (fenced) {
    const parsed = tryParse<T>(fenced);
    if (parsed !== null) return parsed;
  }

  // Strategy 3: Find the outermost { } or [ ] bracket pair
  const bracketed = extractBracketBlock(raw);
  if (bracketed) {
    const parsed = tryParse<T>(bracketed);
    if (parsed !== null) return parsed;

    // Strategy 4: Fix trailing commas and retry
    const fixed = fixTrailingCommas(bracketed);
    const reparsed = tryParse<T>(fixed);
    if (reparsed !== null) return reparsed;
  }

  return null;
}

/**
 * Cast with a validator function. Returns null if JSON is
 * extracted but fails validation.
 */
export function castJsonValid<T>(
  raw: string,
  validate: (value: unknown) => value is T,
): T | null {
  const parsed = castJson(raw);
  if (parsed === null) return null;
  return validate(parsed) ? parsed : null;
}

/** Try JSON.parse, returning null on failure. */
function tryParse<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/** Extract content from ```json ... ``` or ``` ... ``` fences. */
function extractFromFence(text: string): string | null {
  const match = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  return match?.[1]?.trim() ?? null;
}

/** Find the outermost balanced { } or [ ] block. */
function extractBracketBlock(text: string): string | null {
  const objStart = text.indexOf('{');
  const arrStart = text.indexOf('[');

  // Pick whichever comes first
  let start: number;
  let open: string;
  let close: string;

  if (objStart === -1 && arrStart === -1) return null;
  if (objStart === -1) { start = arrStart; open = '['; close = ']'; }
  else if (arrStart === -1) { start = objStart; open = '{'; close = '}'; }
  else if (objStart < arrStart) { start = objStart; open = '{'; close = '}'; }
  else { start = arrStart; open = '['; close = ']'; }

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === open) depth++;
    if (ch === close) depth--;
    if (depth === 0) return text.slice(start, i + 1);
  }

  return null; // Unbalanced — truncated output
}

/** Remove trailing commas before } or ]. */
function fixTrailingCommas(text: string): string {
  return text.replace(/,\s*([}\]])/g, '$1');
}
