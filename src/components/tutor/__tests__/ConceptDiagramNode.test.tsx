import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { ConceptDiagramNode } from '../ConceptDiagramNode';
import type { DiagramNode } from '@/types/entries';

describe('ConceptDiagramNode', () => {
  const baseNode: DiagramNode = {
    label: 'Gravity',
    subLabel: 'Newtonian',
  };

  test('renders node label', () => {
    render(<ConceptDiagramNode node={baseNode} />);
    expect(screen.getByText('Gravity')).toBeInTheDocument();
  });

  test('renders sub-label when provided', () => {
    render(<ConceptDiagramNode node={baseNode} />);
    expect(screen.getByText('Newtonian')).toBeInTheDocument();
  });

  test('renders entity kind badge', () => {
    const node: DiagramNode = { ...baseNode, entityKind: 'concept' };
    render(<ConceptDiagramNode node={node} />);
    expect(screen.getByText('concept')).toBeInTheDocument();
  });

  test('renders mastery bar when provided', () => {
    const node: DiagramNode = {
      ...baseNode,
      mastery: { level: 'developing', percentage: 60 },
    };
    const { container } = render(<ConceptDiagramNode node={node} />);
    const fill = container.querySelector('[style*="width"]');
    expect(fill).toBeTruthy();
  });

  test('shows detail when expanded', () => {
    const node: DiagramNode = { ...baseNode, detail: 'F = ma' };
    render(<ConceptDiagramNode node={node} />);
    // depth=0 starts expanded
    expect(screen.getByText('F = ma')).toBeInTheDocument();
  });

  test('toggles expansion on click', () => {
    const node: DiagramNode = { ...baseNode, detail: 'Toggle detail' };
    render(<ConceptDiagramNode node={node} />);
    const button = screen.getByRole('button');
    // Initially expanded (depth=0)
    expect(screen.getByText('Toggle detail')).toBeInTheDocument();
    fireEvent.click(button);
    expect(screen.queryByText('Toggle detail')).not.toBeInTheDocument();
  });

  test('calls onNodeClick when clicked with entityId', () => {
    const onNodeClick = vi.fn();
    const node: DiagramNode = {
      ...baseNode,
      entityId: 'g1',
      entityKind: 'concept',
    };
    render(<ConceptDiagramNode node={node} onNodeClick={onNodeClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onNodeClick).toHaveBeenCalledWith('g1', 'concept');
  });

  test('renders children when present and expanded', () => {
    const node: DiagramNode = {
      ...baseNode,
      children: [{ label: 'Child Node' }],
    };
    render(<ConceptDiagramNode node={node} />);
    expect(screen.getByText('Child Node')).toBeInTheDocument();
  });

  test('shows chevron for expandable nodes', () => {
    const node: DiagramNode = { ...baseNode, detail: 'Has detail' };
    render(<ConceptDiagramNode node={node} />);
    expect(screen.getByText('▾')).toBeInTheDocument();
  });
});
