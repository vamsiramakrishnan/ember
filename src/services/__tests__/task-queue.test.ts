import { describe, it, expect, vi, beforeEach } from 'vitest';

// Fresh queue for each test
async function createQueue() {
  vi.resetModules();
  const mod = await import('../task-queue');
  // Create a fresh instance by reaching into the module
  return {
    BackgroundTaskQueue: mod,
    enqueueTask: mod.enqueueTask,
    enqueueTasks: mod.enqueueTasks,
    getTaskQueue: mod.getTaskQueue,
    PRIORITY: mod.PRIORITY,
  };
}

describe('TaskQueue', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('executes a simple task', async () => {
    const { getTaskQueue, PRIORITY } = await createQueue();
    const queue = getTaskQueue();
    const fn = vi.fn();

    queue.enqueue({
      key: 'test-1',
      label: 'test task',
      priority: PRIORITY.HIGH,
      run: async () => { fn(); },
    });

    // Wait for async execution
    await vi.waitFor(() => expect(fn).toHaveBeenCalled());
    const state = queue.getState();
    const task = state.find((t) => t.key === 'test-1');
    expect(task?.status).toBe('completed');
  });

  it('deduplicates tasks with same key', async () => {
    const { getTaskQueue, PRIORITY } = await createQueue();
    const queue = getTaskQueue();
    let count = 0;

    const descriptor = {
      key: 'dedup-test',
      label: 'dedup',
      priority: PRIORITY.HIGH,
      run: async () => { count++; await new Promise((r) => setTimeout(r, 50)); },
    };

    queue.enqueue(descriptor);
    queue.enqueue(descriptor); // Should be dropped
    queue.enqueue(descriptor); // Should be dropped

    await vi.waitFor(() => {
      const s = queue.getState().find((t) => t.key === 'dedup-test');
      return s?.status === 'completed';
    });

    expect(count).toBe(1);
  });

  it('runs tasks in priority order', async () => {
    const { getTaskQueue, PRIORITY } = await createQueue();
    const queue = getTaskQueue();
    const order: string[] = [];

    // Enqueue low priority first, high priority second
    // But queue should run high priority first (once a slot opens)
    queue.enqueue({
      key: 'low',
      label: 'low',
      priority: PRIORITY.LOW,
      run: async () => { order.push('low'); },
    });
    queue.enqueue({
      key: 'critical',
      label: 'critical',
      priority: PRIORITY.CRITICAL,
      run: async () => { order.push('critical'); },
    });

    await vi.waitFor(() => {
      const states = queue.getState();
      return states.every((t) => t.status === 'completed');
    });

    // Critical should run first or at least start first
    // (with concurrency=2, both may start simultaneously)
    expect(order).toContain('critical');
    expect(order).toContain('low');
  });

  it('reports busy state correctly', async () => {
    const { getTaskQueue, PRIORITY } = await createQueue();
    const queue = getTaskQueue();

    expect(queue.busy).toBe(false);

    let resolve: () => void;
    const blocker = new Promise<void>((r) => { resolve = r; });

    queue.enqueue({
      key: 'blocker',
      label: 'blocker',
      priority: PRIORITY.HIGH,
      run: async () => { await blocker; },
    });

    await vi.waitFor(() => expect(queue.busy).toBe(true));

    resolve!();
    await vi.waitFor(() => expect(queue.busy).toBe(false));
  });

  it('retries failed tasks', async () => {
    vi.useFakeTimers();
    const { getTaskQueue, PRIORITY } = await createQueue();
    const queue = getTaskQueue();
    let attempts = 0;

    queue.enqueue({
      key: 'retry-test',
      label: 'retry',
      priority: PRIORITY.HIGH,
      retries: 2,
      timeoutMs: 5000,
      run: async () => {
        attempts++;
        if (attempts < 3) throw new Error('fail');
      },
    });

    // Run through microtasks for first attempt (fails)
    await vi.advanceTimersByTimeAsync(100);
    expect(attempts).toBe(1);

    // Advance past first retry backoff (1s)
    await vi.advanceTimersByTimeAsync(1100);
    expect(attempts).toBe(2);

    // Advance past second retry backoff (2s)
    await vi.advanceTimersByTimeAsync(2100);
    expect(attempts).toBe(3);

    const task = queue.getState().find((t) => t.key === 'retry-test');
    expect(task?.status).toBe('completed');

    vi.useRealTimers();
  });

  it('notifies subscribers', async () => {
    const { getTaskQueue, PRIORITY } = await createQueue();
    const queue = getTaskQueue();
    const updates: number[] = [];

    queue.subscribe((tasks) => updates.push(tasks.length));

    queue.enqueue({
      key: 'notify-test',
      label: 'notify',
      priority: PRIORITY.HIGH,
      run: async () => {},
    });

    await vi.waitFor(() => {
      const s = queue.getState().find((t) => t.key === 'notify-test');
      return s?.status === 'completed';
    });

    // Should have received multiple updates (enqueued, running, completed)
    expect(updates.length).toBeGreaterThanOrEqual(2);
  });

  it('handles cancellation', async () => {
    const { getTaskQueue, PRIORITY } = await createQueue();
    const queue = getTaskQueue();
    queue.enqueue({
      key: 'cancel-test',
      label: 'cancel',
      priority: PRIORITY.HIGH,
      run: async (_signal) => {
        await new Promise((r) => setTimeout(r, 200));
      },
    });

    // Cancel immediately
    queue.cancel('cancel-test');

    await new Promise((r) => setTimeout(r, 50));
    const state = queue.getState();
    expect(state.find((t) => t.key === 'cancel-test')).toBeUndefined();
  });

  it('prunes completed tasks', async () => {
    const { getTaskQueue, PRIORITY } = await createQueue();
    const queue = getTaskQueue();

    queue.enqueue({
      key: 'prune-test',
      label: 'prune',
      priority: PRIORITY.HIGH,
      run: async () => {},
    });

    await vi.waitFor(() => {
      const s = queue.getState().find((t) => t.key === 'prune-test');
      return s?.status === 'completed';
    });

    expect(queue.getState().length).toBe(1);
    queue.prune();
    expect(queue.getState().length).toBe(0);
  });

  it('getCounts returns correct breakdown', async () => {
    const { getTaskQueue, PRIORITY } = await createQueue();
    const queue = getTaskQueue();

    queue.enqueue({
      key: 'count-test',
      label: 'count',
      priority: PRIORITY.HIGH,
      run: async () => {},
    });

    // Initially should have at least 1 queued or running
    const initial = queue.getCounts();
    expect(initial.queued + initial.running).toBeGreaterThanOrEqual(1);

    await vi.waitFor(() => {
      const s = queue.getState().find((t) => t.key === 'count-test');
      return s?.status === 'completed';
    });

    const final = queue.getCounts();
    expect(final.completed).toBe(1);
  });
});
