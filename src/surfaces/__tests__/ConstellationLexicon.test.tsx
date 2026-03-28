import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/primitives/Text', () => ({
  Text: ({ children }: Record<string, unknown>) => <span>{children as React.ReactNode}</span>,
}));
vi.mock('@/primitives/Rule', () => ({
  Rule: () => <hr />,
}));
vi.mock('@/tokens/spacing', () => ({
  spacing: { labelToContent: 12 },
}));
vi.mock('../LexiconEntryRow', () => ({
  LexiconEntryRow: ({ entry }: { entry: { term: string } }) => (
    <div data-testid="lexicon-row">{entry.term}</div>
  ),
}));
vi.mock('../ConstellationLexicon.module.css', () => ({ default: {} }));

import { ConstellationLexicon } from '../ConstellationLexicon';
import type { LexiconEntry } from '@/types/lexicon';

const mockEntries: LexiconEntry[] = [
  {
    number: 1, term: 'ellipse', pronunciation: '/ɪˈlɪps/', definition: 'A curve',
    level: 'developing', percentage: 45, etymology: 'Greek', crossReferences: [],
  },
  {
    number: 2, term: 'harmonic', pronunciation: '/hɑːˈmɒnɪk/', definition: 'Musical ratio',
    level: 'exploring', percentage: 20, etymology: 'Greek', crossReferences: ['ellipse'],
  },
];

describe('ConstellationLexicon', () => {
  test('renders section heading', () => {
    render(<ConstellationLexicon entries={mockEntries} />);
    expect(screen.getByText('Lexicon')).toBeInTheDocument();
  });

  test('shows entry count', () => {
    render(<ConstellationLexicon entries={mockEntries} />);
    expect(screen.getByText('2 terms catalogued')).toBeInTheDocument();
  });

  test('renders a LexiconEntryRow per entry', () => {
    render(<ConstellationLexicon entries={mockEntries} />);
    const rows = screen.getAllByTestId('lexicon-row');
    expect(rows).toHaveLength(2);
  });

  test('has section aria-label', () => {
    render(<ConstellationLexicon entries={mockEntries} />);
    expect(screen.getByRole('region', { name: 'Lexicon' })).toBeInTheDocument();
  });
});
