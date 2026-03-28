import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/primitives/MentionChip', () => ({
  MentionChip: ({ name }: { name: string }) => <span data-testid="mention">{name}</span>,
  parseMentions: (text: string) => {
    const m = text.match(/@\[([^\]]+)\]\((\w+):(\w+)\)/);
    if (m) return [{ name: m[1], entityType: m[2], entityId: m[3] }];
    return [];
  },
}));
vi.mock('@/primitives/SlashChip', () => ({
  SlashChip: ({ command }: { command: string }) => <span data-testid="slash">/{command}</span>,
}));
vi.mock('../slash-commands', () => ({
  SLASH_COMMAND_PATTERN: 'explain|draw',
}));

import { ChipPreviewBar } from '../ChipPreviewBar';

describe('ChipPreviewBar', () => {
  test('returns null when no mentions or commands', () => {
    const { container } = render(<ChipPreviewBar value="just text" />);
    expect(container.firstChild).toBeNull();
  });

  test('renders mention chips', () => {
    render(<ChipPreviewBar value="Hello @[Kepler](thinker:k1)" />);
    expect(screen.getByTestId('mention')).toBeInTheDocument();
    expect(screen.getByText('Kepler')).toBeInTheDocument();
  });

  test('renders slash command chips', () => {
    render(<ChipPreviewBar value="Let me /explain this" />);
    expect(screen.getByTestId('slash')).toBeInTheDocument();
  });

  test('has accessible label', () => {
    render(<ChipPreviewBar value="@[Test](concept:c1)" />);
    expect(screen.getByLabelText('References in your message')).toBeInTheDocument();
  });
});
