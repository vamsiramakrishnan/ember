/**
 * useEntityNavigation — unified protocol for navigating between
 * any entity reference and its source location.
 *
 * This is the mechanism that makes everything clickable.
 *
 * Principles:
 * 1. Every entity has a source — an entry where it first appeared.
 * 2. Every entry has a stable anchor — its LiveEntry.id.
 * 3. Navigation resolves: entity → entry ID → surface + scroll target.
 * 4. Cross-surface navigation switches surface then scrolls.
 * 5. Same-surface navigation scrolls directly.
 *
 * Fixes:
 * - Scroll waits for DOM element to appear (polling with timeout)
 *   instead of a fixed 100ms delay that races with render.
 * - AbortController cancels pending navigations on new navigate calls.
 */
import React, { createContext, useContext, useCallback, useRef } from 'react';
import type { Surface } from '@/layout/Navigation';

// ─── Navigation target types ─────────────────────────

export type NavigationTarget =
  | { type: 'entry'; entryId: string }
  | { type: 'session'; sessionId: string }
  | { type: 'entity'; entityId: string; entityKind: string }
  | { type: 'annotation'; entryId: string; annotationId?: string }
  | { type: 'lexicon-term'; term: string }
  | { type: 'thinker'; thinkerName: string }
  | { type: 'concept'; conceptName: string };

export interface NavigationRequest {
  target: NavigationTarget;
  surface?: Surface | null;
  highlight?: boolean;
}

// ─── Scroll registry — maps entry IDs to DOM elements ─

type ScrollRegistry = Map<string, HTMLElement>;

// ─── Context ──────────────────────────────────────────

interface EntityNavigationContextValue {
  navigateTo: (request: NavigationRequest) => void;
  registerAnchor: (id: string, element: HTMLElement) => void;
  unregisterAnchor: (id: string) => void;
  highlightId: string | null;
  clearHighlight: () => void;
}

const EntityNavigationContext = createContext<EntityNavigationContextValue>({
  navigateTo: () => {},
  registerAnchor: () => {},
  unregisterAnchor: () => {},
  highlightId: null,
  clearHighlight: () => {},
});

export function useEntityNavigation() {
  return useContext(EntityNavigationContext);
}

// ─── Provider ─────────────────────────────────────────

interface ProviderProps {
  children: React.ReactNode;
  onSurfaceChange: (surface: Surface) => void;
  resolveEntity?: (
    entityId: string, entityKind: string,
  ) => Promise<string | null>;
  resolveByName?: (
    name: string, kind: 'concept' | 'thinker' | 'term',
  ) => Promise<string | null>;
}

/** Wait for an element to appear in the registry, with timeout. */
function waitForElement(
  registry: React.RefObject<ScrollRegistry>,
  id: string,
  signal: AbortSignal,
  maxWait = 2000,
): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const el = registry.current?.get(id);
    if (el) { resolve(el); return; }

    const start = Date.now();
    const check = () => {
      if (signal.aborted) { resolve(null); return; }
      const found = registry.current?.get(id);
      if (found) { resolve(found); return; }
      if (Date.now() - start > maxWait) { resolve(null); return; }
      requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  });
}

export function EntityNavigationProvider({
  children,
  onSurfaceChange,
  resolveEntity,
  resolveByName,
}: ProviderProps) {
  const registryRef = useRef<ScrollRegistry>(new Map());
  const [highlightId, setHighlightId] = React.useState<string | null>(null);
  const navAbortRef = useRef<AbortController | null>(null);

  const registerAnchor = useCallback((id: string, el: HTMLElement) => {
    registryRef.current.set(id, el);
  }, []);

  const unregisterAnchor = useCallback((id: string) => {
    registryRef.current.delete(id);
  }, []);

  const clearHighlight = useCallback(() => {
    setHighlightId(null);
  }, []);

  const scrollToEntry = useCallback(async (
    entryId: string, highlight: boolean, signal: AbortSignal,
  ) => {
    const el = await waitForElement(registryRef, entryId, signal);
    if (!el || signal.aborted) return;

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (highlight) {
      setHighlightId(entryId);
      setTimeout(() => setHighlightId(null), 2000);
    }
  }, []);

  const navigateTo = useCallback(async (request: NavigationRequest) => {
    const { target, surface, highlight = true } = request;

    // Cancel any in-flight navigation
    navAbortRef.current?.abort();
    const controller = new AbortController();
    navAbortRef.current = controller;

    // Switch surface if needed
    if (surface) {
      onSurfaceChange(surface);
    }

    let entryId: string | null = null;

    switch (target.type) {
      case 'entry':
        entryId = target.entryId;
        break;
      case 'session':
        entryId = target.sessionId;
        break;
      case 'annotation':
        entryId = target.entryId;
        break;
      case 'entity':
        entryId = await resolveEntity?.(
          target.entityId, target.entityKind,
        ) ?? null;
        break;
      case 'concept':
        entryId = await resolveByName?.(
          target.conceptName, 'concept',
        ) ?? null;
        break;
      case 'thinker':
        entryId = await resolveByName?.(
          target.thinkerName, 'thinker',
        ) ?? null;
        break;
      case 'lexicon-term':
        entryId = await resolveByName?.(
          target.term, 'term',
        ) ?? null;
        break;
    }

    if (entryId && !controller.signal.aborted) {
      await scrollToEntry(entryId, highlight, controller.signal);
    }
  }, [onSurfaceChange, resolveEntity, resolveByName, scrollToEntry]);

  const value = React.useMemo(() => ({
    navigateTo,
    registerAnchor,
    unregisterAnchor,
    highlightId,
    clearHighlight,
  }), [navigateTo, registerAnchor, unregisterAnchor, highlightId, clearHighlight]);

  return (
    <EntityNavigationContext.Provider value={value}>
      {children}
    </EntityNavigationContext.Provider>
  );
}
