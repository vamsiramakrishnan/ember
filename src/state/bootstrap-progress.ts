/**
 * Bootstrap progress — ephemeral reactive store for DAG execution status.
 *
 * Separate from SessionState because bootstrap progress is transient:
 * it exists only during notebook creation and disappears once complete.
 * Kept as a thin pub-sub store that the BootstrapProgress component
 * subscribes to via useSyncExternalStore.
 */

export type BootstrapNodeStatus = 'pending' | 'active' | 'complete' | 'error';

export interface BootstrapNodeState {
  id: string;
  label: string;
  status: BootstrapNodeStatus;
}

interface BootstrapState {
  /** Whether a bootstrap is currently in progress. */
  active: boolean;
  /** Ordered list of DAG nodes and their status. */
  nodes: BootstrapNodeState[];
}

type Listener = () => void;
const listeners = new Set<Listener>();
let state: BootstrapState = { active: false, nodes: [] };

function emit() { for (const l of listeners) l(); }

export function getBootstrapState(): BootstrapState { return state; }

export function subscribeBootstrapState(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Initialize bootstrap progress with the DAG's node list. */
export function startBootstrapProgress(
  nodes: Array<{ id: string; label: string }>,
): void {
  state = {
    active: true,
    nodes: nodes.map((n) => ({ id: n.id, label: n.label, status: 'pending' })),
  };
  emit();
}

/** Update a single node's status. */
export function updateBootstrapNode(
  nodeId: string,
  status: BootstrapNodeStatus,
): void {
  if (!state.active) return;
  state = {
    ...state,
    nodes: state.nodes.map((n) =>
      n.id === nodeId ? { ...n, status } : n,
    ),
  };
  emit();
}

/** Mark bootstrap as complete — triggers fade-out in the component. */
export function finishBootstrapProgress(): void {
  state = { ...state, active: false };
  emit();
}

/** Reset to idle (called when navigating away from notebook). */
export function resetBootstrapProgress(): void {
  state = { active: false, nodes: [] };
  emit();
}
