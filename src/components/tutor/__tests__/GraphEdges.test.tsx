import { describe, test, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { createRef } from 'react';

import { GraphEdges } from '../GraphEdges';
import type { DiagramEdge } from '@/types/entries';

// Mock ResizeObserver
vi.stubGlobal('ResizeObserver', class {
  observe() {}
  unobserve() {}
  disconnect() {}
});

describe('GraphEdges', () => {
  const edges: DiagramEdge[] = [
    { from: 0, to: 1, type: 'causes', label: 'drives' },
  ];

  test('renders without crashing', () => {
    const containerRef = createRef<HTMLDivElement>();
    const nodeRefs = new Map<number, HTMLDivElement>();
    const { container } = render(
      <div ref={containerRef}>
        <GraphEdges edges={edges} nodeRefs={nodeRefs} containerRef={containerRef} />
      </div>,
    );
    // With no resolved node rects, paths will be empty
    expect(container).toBeTruthy();
  });

  test('renders null when no paths computed', () => {
    const containerRef = createRef<HTMLDivElement>();
    const nodeRefs = new Map<number, HTMLDivElement>();
    const { container } = render(
      <div ref={containerRef}>
        <GraphEdges edges={[]} nodeRefs={nodeRefs} containerRef={containerRef} />
      </div>,
    );
    expect(container.querySelector('svg')).toBeNull();
  });

  test('renders with empty edges array', () => {
    const containerRef = createRef<HTMLDivElement>();
    const nodeRefs = new Map<number, HTMLDivElement>();
    expect(() =>
      render(
        <div ref={containerRef}>
          <GraphEdges edges={[]} nodeRefs={nodeRefs} containerRef={containerRef} />
        </div>,
      ),
    ).not.toThrow();
  });
});
