import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../LandingDemo.module.css', () => ({ default: {} }));
vi.mock('@/hooks/useScrollReveal', () => ({
  useScrollReveal: () => [vi.fn(), true],
}));
vi.mock('../LandingDemoNotebook', () => ({
  LandingDemoNotebook: () => <div data-testid="demo-notebook" />,
}));
vi.mock('../LandingDemoCanvas', () => ({
  LandingDemoCanvas: () => <div data-testid="demo-canvas" />,
}));
vi.mock('../LandingDemoConstellation', () => ({
  LandingDemoConstellation: () => <div data-testid="demo-constellation" />,
}));

import { LandingDemo } from '../LandingDemo';

describe('LandingDemo', () => {
  test('renders section label', () => {
    render(<LandingDemo />);
    expect(screen.getByText('see it work')).toBeInTheDocument();
  });

  test('renders scene tab buttons', () => {
    render(<LandingDemo />);
    expect(screen.getByRole('button', { name: 'notebook' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'canvas' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'constellation' })).toBeInTheDocument();
  });

  test('renders progress dots', () => {
    render(<LandingDemo />);
    expect(screen.getByLabelText('View notebook demo')).toBeInTheDocument();
    expect(screen.getByLabelText('View canvas demo')).toBeInTheDocument();
    expect(screen.getByLabelText('View constellation demo')).toBeInTheDocument();
  });

  test('renders demo sub-components', () => {
    render(<LandingDemo />);
    expect(screen.getByTestId('demo-notebook')).toBeInTheDocument();
    expect(screen.getByTestId('demo-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('demo-constellation')).toBeInTheDocument();
  });
});
