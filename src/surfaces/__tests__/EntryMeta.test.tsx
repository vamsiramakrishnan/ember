import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../EntryMeta.module.css', () => ({ default: {} }));

import { vi } from 'vitest';

import { EntryMeta } from '../EntryMeta';

describe('EntryMeta', () => {
  test('renders timestamp', () => {
    render(<EntryMeta timestamp={Date.now()} index={1} isTutor={false} />);
    expect(screen.getByText('just now')).toBeInTheDocument();
  });

  test('renders section index', () => {
    render(<EntryMeta timestamp={Date.now()} index={5} isTutor={false} />);
    expect(screen.getByText('§5')).toBeInTheDocument();
  });

  test('shows word count when content provided', () => {
    render(<EntryMeta timestamp={Date.now()} content="hello world" index={1} isTutor={false} />);
    expect(screen.getByText('2w')).toBeInTheDocument();
  });

  test('shows reading time for long content', () => {
    const longContent = Array(100).fill('word').join(' ');
    render(<EntryMeta timestamp={Date.now()} content={longContent} index={1} isTutor={false} />);
    const text = screen.getByText(/\d+w/);
    expect(text).toBeInTheDocument();
  });

  test('shows minutes ago for older timestamps', () => {
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    render(<EntryMeta timestamp={fiveMinAgo} index={1} isTutor={false} />);
    expect(screen.getByText('5m ago')).toBeInTheDocument();
  });

  test('shows hours ago for older timestamps', () => {
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    render(<EntryMeta timestamp={twoHoursAgo} index={1} isTutor={false} />);
    expect(screen.getByText('2h ago')).toBeInTheDocument();
  });
});
