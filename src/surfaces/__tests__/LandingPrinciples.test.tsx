import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../LandingPrinciples.module.css', () => ({ default: {} }));
vi.mock('@/hooks/useScrollReveal', () => ({
  useScrollReveal: () => [vi.fn(), true],
}));

import { LandingPrinciples } from '../LandingPrinciples';

describe('LandingPrinciples', () => {
  test('renders Principles section', () => {
    render(<LandingPrinciples />);
    expect(screen.getByRole('region', { name: 'Principles' })).toBeInTheDocument();
  });

  test('renders three principles', () => {
    render(<LandingPrinciples />);
    expect(screen.getByText('silence is a feature')).toBeInTheDocument();
    expect(screen.getByText('mastery is invisible')).toBeInTheDocument();
    expect(screen.getByText('every idea has a person')).toBeInTheDocument();
  });

  test('renders principle body text', () => {
    render(<LandingPrinciples />);
    expect(screen.getByText(/After asking a question/)).toBeInTheDocument();
  });
});
