/**
 * BackgroundTaskQueue — centralized priority queue for all post-response
 * and enrichment work.
 *
 * Design:
 * - Priority-ordered: P0 (critical) runs before P3 (cosmetic)
 * - Concurrency-controlled: max N tasks run in parallel (default 2)
 * - Retry with backoff: configurable retries per task (0-3)
 * - Timeout: stale tasks are killed after maxMs
 * - Deduplication: tasks keyed by ID, no double-runs
 * - Observable: subscribers see state changes for UI
 *
 * Priority levels:
 *   P0 — correctness (mastery, graph relations, deferred actions)
 *   P1 — next-response quality (working memory, thinker/vocab extraction)
 *   P2 — constellation/enrichment (entity enrichment, meta-labels, metadata)
 *   P3 — cosmetic (portraits, icons, annotations)
 *   P4 — periodic (echo, bridge, reflection)
 */

// ─── Types ──────────────────────────────────────────────────────

export type TaskPriority = 0 | 1 | 2 | 3 | 4;

export type TaskStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'retrying'
  | 'timeout';

export interface TaskDescriptor {
  /** Unique key — used for deduplication. Same key = same task. */
  key: string;
  /** Human-readable label for UI display. */
  label: string;
  /** Priority: 0 = critical, 4 = can wait. */
  priority: TaskPriority;
  /** The work to perform. Receives an AbortSignal for cancellation. */
  run: (signal: AbortSignal) => Promise<void>;
  /** Max retries on failure (default 0). */
  retries?: number;
  /** Timeout in ms (default 30000). */
  timeoutMs?: number;
  /** Optional group tag for batch operations. */
  group?: string;
}

export interface TaskState {
  key: string;
  label: string;
  priority: TaskPriority;
  status: TaskStatus;
  group?: string;
  /** Retry attempt (0 = first run). */
  attempt: number;
  maxRetries: number;
  /** When the task was enqueued. */
  enqueuedAt: number;
  /** When execution started (null if queued). */
  startedAt: number | null;
  /** When execution finished (null if still running). */
  finishedAt: number | null;
  /** Error message if failed. */
  error?: string;
}

export type QueueListener = (tasks: TaskState[]) => void;

// ─── Queue Implementation ───────────────────────────────────────

interface InternalTask extends TaskState {
  descriptor: TaskDescriptor;
  abort: AbortController | null;
}

const DEFAULT_TIMEOUT = 30_000;
const DEFAULT_CONCURRENCY = 2;

class BackgroundTaskQueue {
  private tasks = new Map<string, InternalTask>();
  private listeners = new Set<QueueListener>();
  private concurrency: number;
  private running = 0;
  private draining = false;

  constructor(concurrency = DEFAULT_CONCURRENCY) {
    this.concurrency = concurrency;
  }

  // ─── Public API ─────────────────────────────────────────────

  /**
   * Enqueue a task. If a task with the same key exists and is
   * queued or running, the new one is silently dropped (dedup).
   * If the previous run completed or failed, it's replaced.
   */
  enqueue(descriptor: TaskDescriptor): void {
    const existing = this.tasks.get(descriptor.key);
    if (existing && (existing.status === 'queued' || existing.status === 'running' || existing.status === 'retrying')) {
      return; // Deduplicate — task is already pending or in-flight
    }

    const task: InternalTask = {
      key: descriptor.key,
      label: descriptor.label,
      priority: descriptor.priority,
      status: 'queued',
      group: descriptor.group,
      attempt: 0,
      maxRetries: descriptor.retries ?? 0,
      enqueuedAt: Date.now(),
      startedAt: null,
      finishedAt: null,
      descriptor,
      abort: null,
    };

    this.tasks.set(descriptor.key, task);
    this.notify();
    this.drain();
  }

  /** Enqueue multiple tasks at once. */
  enqueueAll(descriptors: TaskDescriptor[]): void {
    for (const d of descriptors) this.enqueue(d);
  }

  /** Cancel a running or queued task by key. */
  cancel(key: string): void {
    const task = this.tasks.get(key);
    if (!task) return;
    if (task.status === 'running' || task.status === 'retrying') {
      task.abort?.abort();
    }
    this.tasks.delete(key);
    this.notify();
  }

  /** Cancel all tasks in a group. */
  cancelGroup(group: string): void {
    for (const [key, task] of this.tasks) {
      if (task.group === group) this.cancel(key);
    }
  }

  /** Get all task states (sorted by priority, then enqueue time). */
  getState(): TaskState[] {
    return [...this.tasks.values()]
      .map(({ descriptor: _, abort: __, ...state }) => state)
      .sort((a, b) => a.priority - b.priority || a.enqueuedAt - b.enqueuedAt);
  }

  /** Get counts by status. */
  getCounts(): Record<TaskStatus, number> {
    const counts: Record<TaskStatus, number> = {
      queued: 0, running: 0, completed: 0, failed: 0, retrying: 0, timeout: 0,
    };
    for (const task of this.tasks.values()) counts[task.status]++;
    return counts;
  }

  /** Is anything still pending or running? */
  get busy(): boolean {
    for (const task of this.tasks.values()) {
      if (task.status === 'queued' || task.status === 'running' || task.status === 'retrying') {
        return true;
      }
    }
    return false;
  }

  /** Subscribe to state changes. Returns unsubscribe function. */
  subscribe(listener: QueueListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Clear completed and failed tasks from the state. */
  prune(): void {
    for (const [key, task] of this.tasks) {
      if (task.status === 'completed' || task.status === 'failed' || task.status === 'timeout') {
        this.tasks.delete(key);
      }
    }
    this.notify();
  }

  // ─── Internal ───────────────────────────────────────────────

  private notify(): void {
    const state = this.getState();
    for (const listener of this.listeners) listener(state);
  }

  /** Drain the queue: run tasks up to concurrency limit, priority-ordered. */
  private drain(): void {
    if (this.draining) return;
    this.draining = true;

    try {
      while (this.running < this.concurrency) {
        const next = this.pickNext();
        if (!next) break;
        this.execute(next);
      }
    } finally {
      this.draining = false;
    }
  }

  /** Pick the highest-priority queued task. */
  private pickNext(): InternalTask | null {
    let best: InternalTask | null = null;
    for (const task of this.tasks.values()) {
      if (task.status !== 'queued') continue;
      if (!best || task.priority < best.priority || (task.priority === best.priority && task.enqueuedAt < best.enqueuedAt)) {
        best = task;
      }
    }
    return best;
  }

  /** Execute a single task with timeout, retry, and error handling. */
  private execute(task: InternalTask): void {
    task.status = 'running';
    task.startedAt = Date.now();
    task.abort = new AbortController();
    this.running++;
    this.notify();

    const timeoutMs = task.descriptor.timeoutMs ?? DEFAULT_TIMEOUT;
    const timer = setTimeout(() => {
      task.abort?.abort();
      task.status = 'timeout';
      task.finishedAt = Date.now();
      task.error = `Timed out after ${timeoutMs}ms`;
      this.running--;
      this.notify();
      this.drain();
    }, timeoutMs);

    task.descriptor.run(task.abort.signal)
      .then(() => {
        clearTimeout(timer);
        if (task.status === 'timeout') return; // Already timed out
        task.status = 'completed';
        task.finishedAt = Date.now();
        this.running--;
        this.notify();
        this.drain();
      })
      .catch((err) => {
        clearTimeout(timer);
        if (task.status === 'timeout') return; // Already timed out

        const canRetry = task.attempt < task.maxRetries;
        if (canRetry) {
          task.attempt++;
          task.status = 'queued'; // Re-queue for retry
          task.error = err instanceof Error ? err.message : String(err);
          this.running--;
          this.notify();
          // Backoff: 1s, 2s, 4s
          const delay = Math.pow(2, task.attempt - 1) * 1000;
          setTimeout(() => this.drain(), delay);
        } else {
          task.status = 'failed';
          task.finishedAt = Date.now();
          task.error = err instanceof Error ? err.message : String(err);
          this.running--;
          this.notify();
          this.drain();
        }
      });
  }
}

// ─── Singleton ──────────────────────────────────────────────────

let instance: BackgroundTaskQueue | null = null;

export function getTaskQueue(): BackgroundTaskQueue {
  if (!instance) instance = new BackgroundTaskQueue(DEFAULT_CONCURRENCY);
  return instance;
}

/** Convenience: enqueue a single task. */
export function enqueueTask(descriptor: TaskDescriptor): void {
  getTaskQueue().enqueue(descriptor);
}

/** Convenience: enqueue multiple tasks. */
export function enqueueTasks(descriptors: TaskDescriptor[]): void {
  getTaskQueue().enqueueAll(descriptors);
}

// ─── Priority constants ─────────────────────────────────────────

export const PRIORITY = {
  /** Correctness — mastery, graph relations, deferred actions. */
  CRITICAL: 0 as TaskPriority,
  /** Next-response quality — working memory, extractions. */
  HIGH: 1 as TaskPriority,
  /** Constellation/enrichment — entity enrichment, metadata. */
  MEDIUM: 2 as TaskPriority,
  /** Cosmetic — portraits, icons, annotations. */
  LOW: 3 as TaskPriority,
  /** Periodic — echo, bridge, reflection. */
  DEFERRED: 4 as TaskPriority,
} as const;
