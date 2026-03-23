/**
 * TutorEvent — typed discriminated union for the tutor pipeline.
 *
 * Replaces string-label activity updates with compiler-checked events.
 * Each event type carries exactly the data its consumer needs.
 * The UI renders different treatments per event type (progress bars
 * for refinement, streaming text for writing, spinner for research).
 *
 * Inspired by Gemini CLI's typed async generator pattern.
 */
import { setActivityDetail } from '@/state';

// ─── Event types ─────────────────────────────────────────────

export type TutorEvent =
  | { type: 'routing' }
  | { type: 'researching'; query: string }
  | { type: 'searching-graph'; query: string }
  | { type: 'thinking' }
  | { type: 'streaming'; chunk: string; accumulated: string }
  | { type: 'visualizing'; concept: string }
  | { type: 'illustrating'; concept: string }
  | { type: 'refining'; pass: number; maxPasses: number; target: 'html' | 'image' }
  | { type: 'reflecting' }
  | { type: 'enriching'; task: string }
  | { type: 'complete'; entryCount: number }
  | { type: 'error'; message: string };

// ─── Event → activity detail mapping ─────────────────────────

const EVENT_LABELS: Record<TutorEvent['type'], string> = {
  routing: 'reading your thoughts…',
  researching: 'researching…',
  'searching-graph': 'exploring connections…',
  thinking: 'thinking…',
  streaming: 'writing…',
  visualizing: 'composing a visualization…',
  illustrating: 'sketching a concept…',
  refining: 'refining…',
  reflecting: 'reflecting…',
  enriching: 'enriching…',
  complete: '',
  error: '',
};

/**
 * Emit a typed event — updates the session state activity detail
 * and returns the event for optional further processing.
 */
export function emitTutorEvent(event: TutorEvent): TutorEvent {
  if (event.type === 'complete' || event.type === 'error') {
    setActivityDetail(null);
    return event;
  }

  const label = buildLabel(event);
  const step = event.type === 'searching-graph' ? 'searching-graph' : event.type;

  if (event.type === 'refining') {
    setActivityDetail({
      step: 'refining',
      label,
      iteration: event.pass,
      maxIterations: event.maxPasses,
    });
  } else {
    setActivityDetail({ step, label });
  }

  return event;
}

function buildLabel(event: TutorEvent): string {
  switch (event.type) {
    case 'researching': return `researching ${truncate(event.query)}…`;
    case 'searching-graph': return `exploring connections for ${truncate(event.query)}…`;
    case 'visualizing': return `composing visualization of ${truncate(event.concept)}…`;
    case 'illustrating': return `sketching ${truncate(event.concept)}…`;
    case 'refining': {
      const target = event.target === 'image' ? 'sketch' : 'artifact';
      return event.pass === 1
        ? `reviewing ${target}…`
        : `refining ${target} (pass ${event.pass})…`;
    }
    case 'enriching': return `${event.task}…`;
    default: return EVENT_LABELS[event.type] ?? 'thinking…';
  }
}

function truncate(s: string, max = 30): string {
  return s.length > max ? s.slice(0, max) + '…' : s;
}

// ─── Event collector (for testing and logging) ───────────────

export type EventListener = (event: TutorEvent) => void;

const eventListeners = new Set<EventListener>();

export function onTutorEvent(listener: EventListener): () => void {
  eventListeners.add(listener);
  return () => eventListeners.delete(listener);
}

/** Emit and broadcast to listeners. */
export function broadcastTutorEvent(event: TutorEvent): TutorEvent {
  emitTutorEvent(event);
  for (const listener of eventListeners) listener(event);
  return event;
}
