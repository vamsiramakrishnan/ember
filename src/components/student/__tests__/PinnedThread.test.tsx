import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { PinnedThread } from '../PinnedThread';

describe('PinnedThread', () => {
  test('renders content text', () => {
    render(<PinnedThread>Why does harmony matter?</PinnedThread>);
    expect(screen.getByText('Why does harmony matter?')).toBeInTheDocument();
  });

  test('renders the pin glyph', () => {
    render(<PinnedThread>Thread</PinnedThread>);
    expect(screen.getByText('⌃')).toBeInTheDocument();
  });

  test('renders as a div container', () => {
    const { container } = render(<PinnedThread>Test</PinnedThread>);
    expect(container.firstElementChild?.tagName).toBe('DIV');
  });
});
