/**
 * useBackgroundTasks — React hook for the background task queue.
 *
 * Exposes queue state for UI: what's running, what's pending,
 * what failed. Components can show a quiet progress indicator
 * or surface errors without polling.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { getTaskQueue, type TaskState, type TaskStatus } from '@/services/task-queue';

export interface BackgroundTasksState {
  /** All tasks, sorted by priority then enqueue time. */
  tasks: TaskState[];
  /** Is anything still pending or running? */
  busy: boolean;
  /** Counts by status. */
  counts: Record<TaskStatus, number>;
  /** Active tasks (running + retrying). */
  active: TaskState[];
  /** Failed tasks. */
  failed: TaskState[];
  /** Clear completed/failed tasks from view. */
  prune: () => void;
}

export function useBackgroundTasks(): BackgroundTasksState {
  const queue = getTaskQueue();
  const [tasks, setTasks] = useState<TaskState[]>(queue.getState);

  useEffect(() => {
    return queue.subscribe(setTasks);
  }, [queue]);

  const prune = useCallback(() => queue.prune(), [queue]);

  const counts = useMemo(() => {
    const c: Record<TaskStatus, number> = {
      queued: 0, running: 0, completed: 0, failed: 0, retrying: 0, timeout: 0,
    };
    for (const t of tasks) c[t.status]++;
    return c;
  }, [tasks]);

  const active = useMemo(
    () => tasks.filter((t) => t.status === 'running' || t.status === 'retrying'),
    [tasks],
  );

  const failed = useMemo(
    () => tasks.filter((t) => t.status === 'failed' || t.status === 'timeout'),
    [tasks],
  );

  const busy = counts.queued > 0 || counts.running > 0 || counts.retrying > 0;

  return { tasks, busy, counts, active, failed, prune };
}
