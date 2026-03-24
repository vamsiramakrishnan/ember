/**
 * OpenTelemetry integration — distributed tracing for Ember.
 *
 * Instruments fetch requests, document load, and provides custom span
 * helpers for AI agent dispatch, IDB operations, and CRDT sync.
 *
 * Only initializes if VITE_OTEL_ENDPOINT is set. Exports no-op
 * implementations when OTel is not configured.
 */
import { trace, context, SpanStatusCode, type Span, type Tracer } from '@opentelemetry/api';
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { registerInstrumentations } from '@opentelemetry/instrumentation';

let initialized = false;
let emberTracer: Tracer | null = null;

/** Get the Ember tracer (or a no-op tracer if OTel is not initialized). */
export function getTracer(): Tracer {
  if (emberTracer) return emberTracer;
  return trace.getTracer('ember-noop');
}

/** Initialize OpenTelemetry. Call once at app startup. */
export function initOtel(): void {
  const endpoint = import.meta.env.VITE_OTEL_ENDPOINT as string | undefined;
  if (!endpoint || initialized) return;

  const version = (import.meta.env.VITE_APP_VERSION as string | undefined) ?? 'dev';

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'ember-frontend',
    [ATTR_SERVICE_VERSION]: version,
    'deployment.environment': import.meta.env.MODE ?? 'development',
  });

  const exporter = new OTLPTraceExporter({
    url: endpoint,
    headers: {},
  });

  const provider = new WebTracerProvider({
    resource,
    spanProcessors: [new BatchSpanProcessor(exporter)],
  });

  provider.register();

  registerInstrumentations({
    instrumentations: [
      new FetchInstrumentation({
        // Instrument all fetch calls — Gemini API, Supabase, CRDT sync
        propagateTraceHeaderCorsUrls: [/.*/],
        clearTimingResources: true,
      }),
      new DocumentLoadInstrumentation(),
    ],
  });

  emberTracer = trace.getTracer('ember', version);
  initialized = true;
}

/**
 * Create a traced span for an async operation.
 * Automatically sets error status and records exceptions.
 *
 * @example
 * const result = await traced('ai.tutor.respond', { model: 'gemini' }, async (span) => {
 *   span.setAttribute('prompt.tokens', 150);
 *   return await callTutor(prompt);
 * });
 */
export async function traced<T>(
  name: string,
  attributes: Record<string, string | number | boolean>,
  fn: (span: Span) => Promise<T>,
): Promise<T> {
  const tracer = getTracer();
  return tracer.startActiveSpan(name, { attributes }, async (span) => {
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (err) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: err instanceof Error ? err.message : String(err),
      });
      if (err instanceof Error) {
        span.recordException(err);
      }
      throw err;
    } finally {
      span.end();
    }
  });
}

/**
 * Create a traced span for a synchronous operation.
 */
export function tracedSync<T>(
  name: string,
  attributes: Record<string, string | number | boolean>,
  fn: (span: Span) => T,
): T {
  const tracer = getTracer();
  return tracer.startActiveSpan(name, { attributes }, (span) => {
    try {
      const result = fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (err) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: err instanceof Error ? err.message : String(err),
      });
      if (err instanceof Error) {
        span.recordException(err);
      }
      throw err;
    } finally {
      span.end();
    }
  });
}

/**
 * Get the current active span context (for propagating context across async boundaries).
 */
export function getActiveContext() {
  return context.active();
}

/** Whether OTel is initialized and exporting traces. */
export function isOtelEnabled(): boolean {
  return initialized;
}
