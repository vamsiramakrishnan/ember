import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../MathPreview.module.css', () => ({ default: {} }));
vi.mock('./MarkdownContent', () => ({
  MarkdownContent: ({ children }: { children: string }) => <span>{children}</span>,
}));
vi.mock('../MarkdownContent', () => ({
  MarkdownContent: ({ children }: { children: string }) => <span>{children}</span>,
}));

import { MathPreview } from '../MathPreview';

describe('MathPreview', () => {
  test('returns null when no math expressions', () => {
    const { container } = render(<MathPreview value="plain text" />);
    expect(container.firstChild).toBeNull();
  });

  test('renders preview when inline math found', () => {
    render(<MathPreview value="The formula $E=mc^2$ is famous" />);
    expect(screen.getByText('preview')).toBeInTheDocument();
  });

  test('renders preview when display math found', () => {
    render(<MathPreview value="$$\\int_0^1 x dx$$" />);
    expect(screen.getByText('preview')).toBeInTheDocument();
  });

  test('has correct role and label', () => {
    render(<MathPreview value="The formula $x^2$" />);
    expect(screen.getByRole('status', { name: 'Math preview' })).toBeInTheDocument();
  });
});
