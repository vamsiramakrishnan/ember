/**
 * BootstrapProgress (5.x) — vertical pipeline showing DAG execution stages.
 *
 * Renders during notebook creation as a quiet, warm list of steps:
 * pending (dimmed), active (pulsing dot), complete (checkmark fades in).
 * The whole component fades out gracefully once the bootstrap finishes.
 *
 * Feels like watching a table of contents being written by hand —
 * each line appears, is worked on, then settles into place.
 */
import { useSyncExternalStore, useState, useEffect } from 'react';
import {
  getBootstrapState, subscribeBootstrapState,
} from '@/state/bootstrap-progress';
import type { BootstrapNodeState } from '@/state/bootstrap-progress';
import styles from './BootstrapProgress.module.css';

function selectState() { return getBootstrapState(); }

function NodeRow({ node }: { node: BootstrapNodeState }) {
  const isActive = node.status === 'active';
  const isDone = node.status === 'complete';
  const isError = node.status === 'error';

  const statusClass = isActive ? styles.active
    : isDone ? styles.complete
    : isError ? styles.error
    : styles.pending;

  return (
    <li className={`${styles.node} ${statusClass}`} aria-label={`${node.label}: ${node.status}`}>
      <span className={styles.indicator} aria-hidden="true">
        {isDone ? '·' : isActive ? '◈' : isError ? '×' : '·'}
      </span>
      <span className={styles.label}>{node.label}</span>
    </li>
  );
}

export function BootstrapProgress() {
  const state = useSyncExternalStore(subscribeBootstrapState, selectState);
  const [fadingOut, setFadingOut] = useState(false);
  const [hidden, setHidden] = useState(false);

  // Fade out when bootstrap finishes
  useEffect(() => {
    if (!state.active && state.nodes.length > 0 && !fadingOut) {
      setFadingOut(true);
      const timer = setTimeout(() => setHidden(true), 1800);
      return () => clearTimeout(timer);
    }
  }, [state.active, state.nodes.length, fadingOut]);

  if (hidden || state.nodes.length === 0) return null;

  const containerClass = fadingOut
    ? `${styles.container} ${styles.fadeOut}`
    : styles.container;

  return (
    <div className={containerClass} role="status" aria-label="Preparing your notebook">
      <ul className={styles.list}>
        {state.nodes.map((node) => (
          <NodeRow key={node.id} node={node} />
        ))}
      </ul>
    </div>
  );
}
