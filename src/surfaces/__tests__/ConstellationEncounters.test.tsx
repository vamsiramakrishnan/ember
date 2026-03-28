import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/primitives/Text', () => ({
  Text: ({ children }: Record<string, unknown>) => <span>{children as React.ReactNode}</span>,
}));
vi.mock('@/tokens/spacing', () => ({
  spacing: { labelToContent: 12 },
}));
vi.mock('@/hooks/useEntityNavigation', () => ({
  useEntityNavigation: () => ({ navigateTo: vi.fn() }),
}));
vi.mock('../ConstellationEncounters.module.css', () => ({ default: {} }));

import { ConstellationEncounters } from '../ConstellationEncounters';
import type { Encounter } from '@/types/lexicon';

const mockEncounters: Encounter[] = [
  {
    ref: 'E001', thinker: 'Kepler', tradition: 'Astronomy',
    coreIdea: 'Harmony of spheres', sessionTopic: 'Orbits',
    date: '12 March', status: 'active',
  },
  {
    ref: 'E002', thinker: 'Newton', tradition: 'Physics',
    coreIdea: 'Gravity', sessionTopic: 'Forces',
    date: '13 March', status: 'bridged', bridgedTo: 'Kepler',
  },
];

describe('ConstellationEncounters', () => {
  test('renders section heading', () => {
    render(<ConstellationEncounters encounters={mockEncounters} />);
    expect(screen.getByText('Encounters')).toBeInTheDocument();
  });

  test('renders thinker names', () => {
    render(<ConstellationEncounters encounters={mockEncounters} />);
    expect(screen.getByText('Kepler')).toBeInTheDocument();
    expect(screen.getByText('Newton')).toBeInTheDocument();
  });

  test('renders core ideas', () => {
    render(<ConstellationEncounters encounters={mockEncounters} />);
    expect(screen.getByText('Harmony of spheres')).toBeInTheDocument();
    expect(screen.getByText('Gravity')).toBeInTheDocument();
  });

  test('renders header columns', () => {
    render(<ConstellationEncounters encounters={mockEncounters} />);
    expect(screen.getByText('Ref')).toBeInTheDocument();
    expect(screen.getByText('Thinker')).toBeInTheDocument();
    expect(screen.getByText('Core Idea')).toBeInTheDocument();
  });

  test('has section aria-label', () => {
    render(<ConstellationEncounters encounters={mockEncounters} />);
    expect(screen.getByRole('region', { name: 'Encounters' })).toBeInTheDocument();
  });
});
