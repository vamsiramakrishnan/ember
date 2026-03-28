/**
 * Tests for bootstrap-progress — ephemeral reactive store for DAG execution status.
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
  getBootstrapState, subscribeBootstrapState,
  startBootstrapProgress, updateBootstrapNode,
  finishBootstrapProgress, resetBootstrapProgress,
} from '../bootstrap-progress';

describe('bootstrap-progress', () => {
  beforeEach(() => {
    resetBootstrapProgress();
  });

  test('initial state is inactive with no nodes', () => {
    const state = getBootstrapState();
    expect(state.active).toBe(false);
    expect(state.nodes).toEqual([]);
  });

  test('startBootstrapProgress sets active and creates pending nodes', () => {
    startBootstrapProgress([
      { id: 'n1', label: 'Step 1' },
      { id: 'n2', label: 'Step 2' },
    ]);
    const state = getBootstrapState();
    expect(state.active).toBe(true);
    expect(state.nodes).toHaveLength(2);
    expect(state.nodes[0]).toEqual({ id: 'n1', label: 'Step 1', status: 'pending' });
    expect(state.nodes[1]).toEqual({ id: 'n2', label: 'Step 2', status: 'pending' });
  });

  test('updateBootstrapNode changes node status', () => {
    startBootstrapProgress([{ id: 'n1', label: 'Step 1' }]);
    updateBootstrapNode('n1', 'active');
    expect(getBootstrapState().nodes[0]!.status).toBe('active');

    updateBootstrapNode('n1', 'complete');
    expect(getBootstrapState().nodes[0]!.status).toBe('complete');
  });

  test('updateBootstrapNode does nothing when not active', () => {
    // Not started
    updateBootstrapNode('n1', 'active');
    expect(getBootstrapState().nodes).toEqual([]);
  });

  test('updateBootstrapNode leaves other nodes unchanged', () => {
    startBootstrapProgress([
      { id: 'n1', label: 'Step 1' },
      { id: 'n2', label: 'Step 2' },
    ]);
    updateBootstrapNode('n1', 'complete');
    expect(getBootstrapState().nodes[1]!.status).toBe('pending');
  });

  test('finishBootstrapProgress sets active to false', () => {
    startBootstrapProgress([{ id: 'n1', label: 'Step 1' }]);
    finishBootstrapProgress();
    expect(getBootstrapState().active).toBe(false);
    // Nodes remain for fade-out
    expect(getBootstrapState().nodes).toHaveLength(1);
  });

  test('resetBootstrapProgress clears everything', () => {
    startBootstrapProgress([{ id: 'n1', label: 'Step 1' }]);
    resetBootstrapProgress();
    expect(getBootstrapState().active).toBe(false);
    expect(getBootstrapState().nodes).toEqual([]);
  });

  test('subscribeBootstrapState notifies on changes', () => {
    const listener = vi.fn();
    const unsub = subscribeBootstrapState(listener);
    startBootstrapProgress([{ id: 'n1', label: 'Step 1' }]);
    expect(listener).toHaveBeenCalledTimes(1);
    unsub();
    updateBootstrapNode('n1', 'active');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test('error status can be set on a node', () => {
    startBootstrapProgress([{ id: 'n1', label: 'Step 1' }]);
    updateBootstrapNode('n1', 'error');
    expect(getBootstrapState().nodes[0]!.status).toBe('error');
  });
});
