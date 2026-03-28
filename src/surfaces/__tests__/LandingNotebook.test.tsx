import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../LandingNotebook.module.css', () => ({ default: {} }));
vi.mock('@/hooks/useScrollReveal', () => ({
  useScrollReveal: () => [vi.fn(), true],
}));

import { LandingNotebook } from '../LandingNotebook';

describe('LandingNotebook', () => {
  test('renders section label', () => {
    render(<LandingNotebook />);
    expect(screen.getByText('the notebook')).toBeInTheDocument();
  });

  test('renders student text from exchanges', () => {
    render(<LandingNotebook />);
    expect(screen.getByText(/Kepler spent years/)).toBeInTheDocument();
  });

  test('renders tutor responses', () => {
    render(<LandingNotebook />);
    expect(screen.getByText(/Notice what you just said/)).toBeInTheDocument();
  });

  test('renders the caption', () => {
    render(<LandingNotebook />);
    expect(
      screen.getByText(/Your thinking is the primary text/),
    ).toBeInTheDocument();
  });

  test('has How Ember works aria-label', () => {
    render(<LandingNotebook />);
    expect(screen.getByRole('region', { name: 'How Ember works' })).toBeInTheDocument();
  });
});
