import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/tokens/colors', () => ({
  colors: {
    margin: '#B07D62',
    sage: '#6B8F71',
    indigo: '#5B6FA3',
    amber: '#C4956A',
  },
}));

import { Card } from '../Card';

describe('Card', () => {
  test('renders body text', () => {
    render(<Card body="Card body content" />);
    expect(screen.getByText('Card body content')).toBeInTheDocument();
  });

  test('renders title when provided', () => {
    render(<Card title="Card Title" body="Body" />);
    expect(screen.getByText('Card Title')).toBeInTheDocument();
  });

  test('does not render title when not provided', () => {
    const { container } = render(<Card body="Body only" />);
    const divs = container.querySelectorAll('div');
    // Should not have the title div
    expect(screen.queryByText('Card Title')).not.toBeInTheDocument();
    expect(divs.length).toBeGreaterThan(0);
  });

  test('renders source when provided', () => {
    render(<Card body="Body" source="Kepler, 1609" />);
    expect(screen.getByText('Kepler, 1609')).toBeInTheDocument();
  });

  test('applies accent border when accent is provided', () => {
    const { container } = render(<Card body="Body" accent="sage" />);
    const card = container.firstElementChild as HTMLElement;
    expect(card.style.borderTop).toContain('2px solid');
  });

  test('does not apply accent border when no accent', () => {
    const { container } = render(<Card body="Body" />);
    const card = container.firstElementChild as HTMLElement;
    expect(card.style.borderTop).toBe('');
  });
});
