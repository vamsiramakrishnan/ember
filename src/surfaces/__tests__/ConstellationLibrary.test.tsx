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
vi.mock('../ConstellationLibrary.module.css', () => ({ default: {} }));

import { ConstellationLibrary } from '../ConstellationLibrary';
import type { PrimaryText } from '@/types/lexicon';

const mockTexts: PrimaryText[] = [
  {
    title: 'Harmonies of the World', author: 'Kepler',
    isCurrent: true, annotationCount: 3,
    quote: 'The heavenly motions are nothing but a continuous song.',
  },
  {
    title: 'Principia', author: 'Newton',
    isCurrent: false, annotationCount: 0,
    quote: 'Every body perseveres in its state of rest.',
  },
];

describe('ConstellationLibrary', () => {
  test('renders section heading', () => {
    render(<ConstellationLibrary texts={mockTexts} />);
    expect(screen.getByText('Library')).toBeInTheDocument();
  });

  test('renders text titles', () => {
    render(<ConstellationLibrary texts={mockTexts} />);
    expect(screen.getByText('Harmonies of the World')).toBeInTheDocument();
    expect(screen.getByText('Principia')).toBeInTheDocument();
  });

  test('renders author names', () => {
    render(<ConstellationLibrary texts={mockTexts} />);
    expect(screen.getByText('Kepler')).toBeInTheDocument();
    expect(screen.getByText('Newton')).toBeInTheDocument();
  });

  test('marks current focus text', () => {
    render(<ConstellationLibrary texts={mockTexts} />);
    expect(screen.getByText('Current Focus')).toBeInTheDocument();
  });

  test('shows annotation counts', () => {
    render(<ConstellationLibrary texts={mockTexts} />);
    expect(screen.getByText('3 annotations')).toBeInTheDocument();
    expect(screen.getByText('0 annotations')).toBeInTheDocument();
  });

  test('disables annotation button when count is zero', () => {
    render(<ConstellationLibrary texts={mockTexts} />);
    const btn = screen.getByText('0 annotations');
    expect(btn).toBeDisabled();
  });

  test('has section aria-label', () => {
    render(<ConstellationLibrary texts={mockTexts} />);
    expect(screen.getByRole('region', { name: 'Library' })).toBeInTheDocument();
  });
});
