/**
 * Telemetry — high-level instrumentation helpers for Ember-specific operations.
 *
 * Wraps OpenTelemetry spans with domain-aware names and attributes.
 * Import these in services/hooks instead of raw OTel APIs.
 */
import { traced } from './otel';
import { log } from './logger';

/**
 * Trace an AI agent dispatch (tutor, critic, researcher, etc.).
 */
export async function traceAgentDispatch<T>(
  agentName: string,
  model: string,
  fn: () => Promise<T>,
): Promise<T> {
  const start = performance.now();
  try {
    return await traced(`ai.agent.${agentName}`, {
      'ai.agent.name': agentName,
      'ai.model': model,
    }, async (span) => {
      const result = await fn();
      span.setAttribute('ai.duration_ms', Math.round(performance.now() - start));
      return result;
    });
  } catch (err) {
    log.error(`Agent ${agentName} failed`, err instanceof Error ? err : undefined, {
      agent: agentName,
      model,
      durationMs: Math.round(performance.now() - start),
    });
    throw err;
  }
}

/**
 * Trace a persistence operation (IDB read/write).
 */
export async function traceDbOp<T>(
  operation: string,
  store: string,
  fn: () => Promise<T>,
): Promise<T> {
  return traced(`db.${operation}`, {
    'db.system': 'indexeddb',
    'db.operation': operation,
    'db.store': store,
  }, async (span) => {
    const start = performance.now();
    const result = await fn();
    span.setAttribute('db.duration_ms', Math.round(performance.now() - start));
    return result;
  });
}

/**
 * Trace a CRDT sync cycle.
 */
export async function traceCrdtSync<T>(
  notebookId: string,
  direction: 'push' | 'pull' | 'full',
  fn: () => Promise<T>,
): Promise<T> {
  return traced('crdt.sync', {
    'crdt.notebook_id': notebookId,
    'crdt.direction': direction,
  }, async (span) => {
    const start = performance.now();
    const result = await fn();
    span.setAttribute('crdt.duration_ms', Math.round(performance.now() - start));
    return result;
  });
}

/**
 * Trace a surface render (React component mount/update).
 */
export function traceSurfaceRender(
  surfaceName: string,
): () => void {
  const start = performance.now();
  log.breadcrumb('render', `${surfaceName} rendering`);
  return () => {
    const duration = Math.round(performance.now() - start);
    if (duration > 100) {
      log.warn('Slow surface render', { surface: surfaceName, durationMs: duration });
    }
  };
}

/**
 * Trace a user interaction (input, navigation, canvas drag).
 */
export async function traceInteraction<T>(
  interactionName: string,
  fn: () => Promise<T>,
): Promise<T> {
  return traced(`user.${interactionName}`, {
    'user.interaction': interactionName,
  }, async (span) => {
    const start = performance.now();
    const result = await fn();
    span.setAttribute('user.duration_ms', Math.round(performance.now() - start));
    return result;
  });
}
