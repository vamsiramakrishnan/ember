import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../LandingDemoConstellation.module.css', () => ({ default: {} }));

import { LandingDemoConstellation } from '../LandingDemoConstellation';

describe('LandingDemoConstellation', () => {
  test('renders sub-navigation tabs', () => {
    render(<LandingDemoConstellation active={true} />);
    expect(screen.getByText('overview')).toBeInTheDocument();
    expect(screen.getByText('lexicon')).toBeInTheDocument();
    expect(screen.getByText('encounters')).toBeInTheDocument();
    expect(screen.getByText('library')).toBeInTheDocument();
  });

  test('renders lexicon terms', () => {
    render(<LandingDemoConstellation active={true} />);
    expect(screen.getByText('ellipse')).toBeInTheDocument();
    expect(screen.getByText('harmonic')).toBeInTheDocument();
    expect(screen.getByText('empiricism')).toBeInTheDocument();
  });

  test('renders thinker names', () => {
    render(<LandingDemoConstellation active={true} />);
    expect(screen.getByText('Johannes Kepler')).toBeInTheDocument();
    expect(screen.getByText('Tycho Brahe')).toBeInTheDocument();
    expect(screen.getByText('Isaac Newton')).toBeInTheDocument();
  });

  test('renders column labels', () => {
    render(<LandingDemoConstellation active={true} />);
    expect(screen.getByText('your lexicon')).toBeInTheDocument();
    expect(screen.getByText('thinkers encountered')).toBeInTheDocument();
  });
});
