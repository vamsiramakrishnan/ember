import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../MentionChip.module.css', () => ({ default: {} }));
vi.mock('../ChipPreviewCard.module.css', () => ({ default: {} }));
vi.mock('../ChipContext', () => ({
  useChipContext: () => ({}),
}));
vi.mock('../ChipPreviewCard', () => ({
  ChipPreviewCard: () => null,
}));

import { MentionChip, parseMentions, createMentionSyntax } from '../MentionChip';

describe('MentionChip', () => {
  test('renders entity name', () => {
    render(<MentionChip name="Kepler" entityType="thinker" entityId="t1" />);
    expect(screen.getByText('Kepler')).toBeInTheDocument();
  });

  test('renders type prefix', () => {
    render(<MentionChip name="Kepler" entityType="thinker" entityId="t1" />);
    // thinker prefix is ◈
    expect(screen.getByText('◈')).toBeInTheDocument();
  });

  test('renders meta text when provided', () => {
    render(
      <MentionChip name="Kepler" entityType="thinker" entityId="t1" meta="1571-1630" />,
    );
    expect(screen.getByText('1571-1630')).toBeInTheDocument();
  });

  test('renders as button when onClick provided', () => {
    const onClick = vi.fn();
    render(
      <MentionChip name="Test" entityType="concept" entityId="c1" onClick={onClick} />,
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});

describe('parseMentions', () => {
  test('parses @mention syntax', () => {
    const text = 'Talking about @[Kepler](thinker:t1) and orbits';
    const result = parseMentions(text);
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('Kepler');
    expect(result[0]?.entityType).toBe('thinker');
    expect(result[0]?.entityId).toBe('t1');
  });

  test('parses multiple mentions', () => {
    const text = '@[A](concept:c1) and @[B](term:t2)';
    const result = parseMentions(text);
    expect(result).toHaveLength(2);
  });

  test('returns empty for text without mentions', () => {
    expect(parseMentions('plain text')).toHaveLength(0);
  });
});

describe('createMentionSyntax', () => {
  test('creates correct syntax', () => {
    expect(createMentionSyntax('Kepler', 'thinker', 't1')).toBe(
      '@[Kepler](thinker:t1)',
    );
  });
});
