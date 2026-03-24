/**
 * Shared retry helper for tool executors.
 *
 * Retries a single time when the error is transient (network/timeout).
 * No delay between attempts — immediate retry.
 */
import { isTransientError, toolError } from './tool-result';

/**
 * Execute `fn` with a single retry for transient errors.
 * On non-transient errors (or a failed retry), returns a toolError envelope.
 */
export async function withRetry(
  name: string,
  fn: () => Promise<string>,
): Promise<string> {
  try {
    return await fn();
  } catch (err) {
    if (isTransientError(err)) {
      try {
        return await fn();
      } catch (retryErr) {
        return toolError(name, String(retryErr));
      }
    }
    return toolError(name, String(err));
  }
}
