import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../LandingHero.module.css', () => ({ default: {} }));

import { LandingHero } from '../LandingHero';

describe('LandingHero', () => {
  test('renders the title "ember"', () => {
    render(<LandingHero />);
    expect(screen.getByText('ember')).toBeInTheDocument();
  });

  test('renders the tagline', () => {
    render(<LandingHero />);
    expect(
      screen.getByText('a quiet room with a good mind in it'),
    ).toBeInTheDocument();
  });

  test('has an aria-label on the section', () => {
    render(<LandingHero />);
    expect(
      screen.getByRole('region', { name: /introduction/i }),
    ).toBeInTheDocument();
  });

  test('renders a cursor element', () => {
    const { container } = render(<LandingHero />);
    const cursor = container.querySelector('[aria-hidden="true"]');
    expect(cursor).toBeInTheDocument();
  });
});
