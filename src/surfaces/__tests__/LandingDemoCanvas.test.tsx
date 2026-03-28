import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../LandingDemoCanvas.module.css', () => ({ default: {} }));

import { LandingDemoCanvas } from '../LandingDemoCanvas';

describe('LandingDemoCanvas', () => {
  test('renders concept card labels', () => {
    render(<LandingDemoCanvas active={true} />);
    expect(screen.getByText('Kepler')).toBeInTheDocument();
    expect(screen.getByText('Elliptical Orbits')).toBeInTheDocument();
  });

  test('renders mode bar', () => {
    render(<LandingDemoCanvas active={true} />);
    expect(screen.getByText('linear')).toBeInTheDocument();
    expect(screen.getByText('canvas')).toBeInTheDocument();
    expect(screen.getByText('graph')).toBeInTheDocument();
  });

  test('renders card subtitles', () => {
    render(<LandingDemoCanvas active={true} />);
    expect(screen.getByText('harmonic ratios')).toBeInTheDocument();
    expect(screen.getByText('precision observation')).toBeInTheDocument();
  });

  test('renders SVG connectors area', () => {
    const { container } = render(<LandingDemoCanvas active={true} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
