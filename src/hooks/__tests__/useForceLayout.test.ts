/**
 * Tests for useForceLayout — force-directed graph layout.
 * Uses reduced-motion to avoid RAF animation loops in jsdom.
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Provide matchMedia + rAF stubs (jsdom doesn't have them).
// Always return reduced-motion so the synchronous path runs.
window.matchMedia = vi.fn().mockReturnValue({
  matches: true, media: '', addEventListener: vi.fn(),
  removeEventListener: vi.fn(), addListener: vi.fn(),
  removeListener: vi.fn(), dispatchEvent: vi.fn(),
}) as unknown as typeof window.matchMedia;
window.requestAnimationFrame = vi.fn().mockReturnValue(0) as typeof window.requestAnimationFrame;
window.cancelAnimationFrame = vi.fn() as typeof window.cancelAnimationFrame;

import { useForceLayout } from '../useForceLayout';
import type { CanvasNode, GraphEdge } from '@/types/graph-canvas';

const nodes: CanvasNode[] = [
  { id: 'n1', kind: 'concept', label: 'Gravity' },
  { id: 'n2', kind: 'thinker', label: 'Newton' },
];

const edges: GraphEdge[] = [
  { from: 'n1', to: 'n2', relation: 'explores', weight: 1 },
];

describe('useForceLayout', () => {
  it('initializes layout nodes from input', () => {
    const { result } = renderHook(() =>
      useForceLayout(nodes, edges, { width: 600, height: 400, enabled: false }),
    );
    expect(result.current.layoutNodes).toHaveLength(2);
    expect(result.current.layoutNodes[0]!.id).toBe('n1');
  });

  it('assigns positions based on circular layout', () => {
    const { result } = renderHook(() =>
      useForceLayout(nodes, edges, { width: 600, height: 400, enabled: false }),
    );
    const n1 = result.current.layoutNodes[0]!;
    const n2 = result.current.layoutNodes[1]!;
    expect(n1.x).toBeDefined();
    expect(n1.y).toBeDefined();
    expect(n1.x).not.toBe(n2.x);
  });

  it('pins a node at specific position', () => {
    const { result } = renderHook(() =>
      useForceLayout(nodes, edges, { width: 600, height: 400, enabled: false }),
    );
    act(() => { result.current.pinNode('n1', 100, 200); });
    const pinned = result.current.layoutNodes.find(n => n.id === 'n1');
    expect(pinned!.x).toBe(100);
    expect(pinned!.y).toBe(200);
    expect(pinned!.pinned).toBe(true);
  });

  it('runs simulation to completion with reduced motion', () => {
    const { result } = renderHook(() =>
      useForceLayout(nodes, edges, { width: 600, height: 400, enabled: true }),
    );
    expect(result.current.layoutNodes).toHaveLength(2);
  });

  it('handles empty nodes', () => {
    const { result } = renderHook(() =>
      useForceLayout([], [], { width: 600, height: 400, enabled: true }),
    );
    expect(result.current.layoutNodes).toHaveLength(0);
  });
});
