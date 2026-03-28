import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/primitives/MarkdownContent', () => ({
  MarkdownContent: ({ children }: { children: string }) => <span>{children}</span>,
}));

import { HypothesisMarker } from '../HypothesisMarker';

describe('HypothesisMarker', () => {
  test('renders content text', () => {
    render(<HypothesisMarker>I think gravity causes orbits</HypothesisMarker>);
    expect(screen.getByText('I think gravity causes orbits')).toBeInTheDocument();
  });

  test('renders as a div container', () => {
    const { container } = render(<HypothesisMarker>Hypothesis</HypothesisMarker>);
    expect(container.firstElementChild?.tagName).toBe('DIV');
  });
});
