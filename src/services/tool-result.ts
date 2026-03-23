/**
 * ToolResult — structured envelope for tool execution results.
 *
 * Every tool returns JSON with a status field so the tutor agent can
 * distinguish between "data not found" and "system error" and adapt
 * its response accordingly.
 */

/** Tool result envelope — distinguishes success, not-found, and error. */
export interface ToolResult {
  status: 'ok' | 'not-found' | 'error';
  data: string;
}

/** Wrap a successful result. */
export function toolOk(data: string): string {
  return JSON.stringify({ status: 'ok', data } satisfies ToolResult);
}

/** Wrap a not-found result with a helpful message about the entity. */
export function toolNotFound(entity: string): string {
  return JSON.stringify({
    status: 'not-found',
    data: `No data found for "${entity}". The student may not have explored this yet.`,
  } satisfies ToolResult);
}

/** Wrap a system/transient error with context about the failed operation. */
export function toolError(operation: string, message: string): string {
  return JSON.stringify({
    status: 'error',
    data: `${operation} failed: ${message}. Try a different approach.`,
  } satisfies ToolResult);
}

/** Check whether an error looks transient (network, timeout, rate limit). */
export function isTransientError(err: unknown): boolean {
  const msg = String(err).toLowerCase();
  return (
    msg.includes('network') ||
    msg.includes('timeout') ||
    msg.includes('503') ||
    msg.includes('429')
  );
}
