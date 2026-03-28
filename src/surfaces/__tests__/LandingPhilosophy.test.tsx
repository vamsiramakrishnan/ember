import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../LandingPhilosophy.module.css', () => ({ default: {} }));
vi.mock('@/hooks/useScrollReveal', () => ({
  useScrollReveal: () => [vi.fn(), true],
}));

import { LandingPhilosophy } from '../LandingPhilosophy';

describe('LandingPhilosophy', () => {
  test('renders section with Philosophy label', () => {
    render(<LandingPhilosophy />);
    expect(screen.getByRole('region', { name: 'Philosophy' })).toBeInTheDocument();
  });

  test('renders Bloom attribution', () => {
    render(<LandingPhilosophy />);
    expect(screen.getByText('Benjamin Bloom, 1984')).toBeInTheDocument();
  });

  test('renders the closing answer', () => {
    render(<LandingPhilosophy />);
    expect(
      screen.getByText('This is the question Ember exists to answer.'),
    ).toBeInTheDocument();
  });

  test('renders three stanzas', () => {
    render(<LandingPhilosophy />);
    const quotes = screen.getAllByRole('blockquote');
    expect(quotes.length).toBe(3);
  });
});
