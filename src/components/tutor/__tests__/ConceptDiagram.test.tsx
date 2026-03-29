import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../DiagramCard', () => ({
  DiagramCard: ({ node }: { node: { label: string } }) => (
    <div data-testid="diagram-card">{node.label}</div>
  ),
}));

import { ConceptDiagram } from '../ConceptDiagram';
import type { DiagramNode } from '@/types/entries';

describe('ConceptDiagram', () => {
  const items: DiagramNode[] = [
    { label: 'Gravity' },
    { label: 'Harmony' },
    { label: 'Orbits' },
  ];

  test('renders all nodes', () => {
    render(<ConceptDiagram items={items} />);
    expect(screen.getByText('Gravity')).toBeInTheDocument();
    expect(screen.getByText('Harmony')).toBeInTheDocument();
    expect(screen.getByText('Orbits')).toBeInTheDocument();
  });

  test('renders title when provided', () => {
    render(<ConceptDiagram items={items} title="Force Relations" />);
    expect(screen.getByText('Force Relations')).toBeInTheDocument();
  });

  test('returns null for empty items', () => {
    const { container } = render(<ConceptDiagram items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  test('has figure role with label', () => {
    render(<ConceptDiagram items={items} title="My Diagram" />);
    expect(screen.getByRole('figure')).toHaveAttribute('aria-label', 'My Diagram');
  });

  test('uses default aria-label when no title', () => {
    render(<ConceptDiagram items={items} />);
    expect(screen.getByRole('figure')).toHaveAttribute('aria-label', 'Concept diagram');
  });

  test('passes layout via data attribute', () => {
    render(<ConceptDiagram items={items} layout="pyramid" />);
    const figure = screen.getByRole('figure');
    expect(figure).toHaveAttribute('data-layout', 'pyramid');
  });

  test('renders tree layout when nodes have children', () => {
    const treeItems: DiagramNode[] = [
      { label: 'Root', children: [{ label: 'Child' }] },
    ];
    render(<ConceptDiagram items={treeItems} />);
    expect(screen.getByText('Root')).toBeInTheDocument();
  });

  test('infers flow layout for ≤5 nodes without edges', () => {
    render(<ConceptDiagram items={items} />);
    expect(screen.getByRole('figure')).toHaveAttribute('data-layout', 'flow');
  });

  test('infers graph layout when edges provided', () => {
    const edges = [{ from: 0, to: 1, type: 'causes' as const }];
    render(<ConceptDiagram items={items} edges={edges} />);
    expect(screen.getByRole('figure')).toHaveAttribute('data-layout', 'graph');
  });
});
