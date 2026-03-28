import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/primitives/MentionChip', () => ({
  MentionChip: ({ name }: { name: string }) => <span data-testid="mention">{name}</span>,
  MENTION_PATTERN: /@\[([^\]]+)\]\((\w+):([^)]+)\)/g,
}));
vi.mock('@/primitives/SlashChip', () => ({
  SlashChip: ({ command }: { command: string }) => <span data-testid="slash">/{command}</span>,
}));
vi.mock('../slash-commands', () => ({
  SLASH_COMMAND_PATTERN: 'explain|draw',
}));

import { InputPreview } from '../InputPreview';

describe('InputPreview', () => {
  test('returns null when not visible', () => {
    const { container } = render(<InputPreview value="@[Test](concept:c1)" visible={false} />);
    expect(container.firstChild).toBeNull();
  });

  test('returns null when no mentions or slashes', () => {
    const { container } = render(<InputPreview value="plain text" visible={true} />);
    expect(container.firstChild).toBeNull();
  });

  test('is hidden from screen readers', () => {
    render(<InputPreview value="@[Kepler](thinker:k1) text" visible={true} />);
    const overlay = screen.getByText('Kepler').closest('div');
    expect(overlay?.getAttribute('aria-hidden')).toBe('true');
  });
});
