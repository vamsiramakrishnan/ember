/**
 * useNotebookCrossNav — shared focus state for cross-mode navigation.
 *
 * When a user clicks an entity in the graph or canvas, this hook:
 * 1. Stores the source mode (so we can offer "← back to graph")
 * 2. Switches to the target mode
 * 3. Scrolls to / highlights the entity in the target view
 *
 * The "return breadcrumb" fades after 6 seconds of inactivity.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import type { NotebookMode } from '@/surfaces/NotebookModeToggle';

export interface CrossNavState {
  /** Entity to highlight/focus in the target mode. */
  entityId: string | null;
  entityLabel: string | null;
  /** The mode the user came from (for "back to" breadcrumb). */
  sourceMode: NotebookMode | null;
  /** When the navigation happened (for auto-dismiss). */
  timestamp: number;
}

const EMPTY: CrossNavState = {
  entityId: null, entityLabel: null, sourceMode: null, timestamp: 0,
};

/** Breadcrumb auto-dismisses after this many ms. */
const BREADCRUMB_TTL = 6000;

export function useNotebookCrossNav(
  mode: NotebookMode,
  setMode: (m: NotebookMode) => void,
) {
  const [navState, setNavState] = useState<CrossNavState>(EMPTY);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // Auto-dismiss the breadcrumb after TTL
  useEffect(() => {
    if (!navState.sourceMode) return;
    timerRef.current = setTimeout(() => setNavState(EMPTY), BREADCRUMB_TTL);
    return () => clearTimeout(timerRef.current);
  }, [navState.sourceMode, navState.timestamp]);

  /** Navigate from current mode to a target mode, focusing an entity. */
  const navigateToMode = useCallback((
    targetMode: NotebookMode,
    entityId: string,
    entityLabel: string,
  ) => {
    setNavState({
      entityId,
      entityLabel,
      sourceMode: mode,
      timestamp: Date.now(),
    });
    setMode(targetMode);
  }, [mode, setMode]);

  /** Navigate from graph/canvas to linear mode, scrolling to an entry. */
  const goToEntry = useCallback((entryId: string, label: string) => {
    navigateToMode('linear', entryId, label);
    // Scroll to entry after React renders the linear view
    requestAnimationFrame(() => {
      setTimeout(() => {
        const el = document.querySelector(`[data-entry-id="${entryId}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('cross-nav-highlight');
          setTimeout(() => el.classList.remove('cross-nav-highlight'), 2500);
        }
      }, 100);
    });
  }, [navigateToMode]);

  /** Navigate from linear to graph mode, focusing a node. */
  const goToGraphNode = useCallback((nodeId: string, label: string) => {
    navigateToMode('graph', nodeId, label);
  }, [navigateToMode]);

  /** Go back to the source mode (breadcrumb action). */
  const goBack = useCallback(() => {
    if (navState.sourceMode) {
      setMode(navState.sourceMode);
      setNavState(EMPTY);
    }
  }, [navState.sourceMode, setMode]);

  /** Dismiss the breadcrumb. */
  const dismissBreadcrumb = useCallback(() => {
    setNavState(EMPTY);
  }, []);

  const hasBreadcrumb = navState.sourceMode !== null && navState.sourceMode !== mode;

  return {
    navState,
    hasBreadcrumb,
    goToEntry,
    goToGraphNode,
    goBack,
    dismissBreadcrumb,
  };
}
