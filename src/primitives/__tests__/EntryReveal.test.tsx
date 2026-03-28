import { describe, test, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';

vi.mock('../EntryReveal.module.css', () => ({
  default: { reveal: 'reveal', visible: 'visible' },
}));

import { EntryReveal } from '../EntryReveal';

describe('EntryReveal', () => {
  test('renders children', () => {
    render(<EntryReveal>Hello</EntryReveal>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  test('starts hidden and reveals after timeout', async () => {
    vi.useFakeTimers();
    const { container } = render(<EntryReveal delay={100}>Content</EntryReveal>);
    expect(container.firstChild).toHaveClass('reveal');
    expect(container.firstChild).not.toHaveClass('visible');

    await act(async () => { vi.advanceTimersByTime(150); });
    expect(container.firstChild).toHaveClass('visible');
    vi.useRealTimers();
  });

  test('reveals immediately with no delay', async () => {
    vi.useFakeTimers();
    const { container } = render(<EntryReveal>Content</EntryReveal>);
    await act(async () => { vi.advanceTimersByTime(10); });
    expect(container.firstChild).toHaveClass('visible');
    vi.useRealTimers();
  });

  test('applies transition delay style', () => {
    const { container } = render(<EntryReveal delay={200}>Content</EntryReveal>);
    expect(container.firstChild).toHaveStyle({ transitionDelay: '200ms' });
  });
});
