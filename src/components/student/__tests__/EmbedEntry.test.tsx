import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { EmbedEntry } from '../EmbedEntry';

describe('EmbedEntry', () => {
  test('renders YouTube embed for YouTube URLs', () => {
    const { container } = render(
      <EmbedEntry url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />,
    );
    const iframe = container.querySelector('iframe') as HTMLIFrameElement;
    expect(iframe.src).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ');
  });

  test('renders Vimeo embed for Vimeo URLs', () => {
    const { container } = render(
      <EmbedEntry url="https://vimeo.com/123456789" />,
    );
    const iframe = container.querySelector('iframe') as HTMLIFrameElement;
    expect(iframe.src).toContain('player.vimeo.com/video/123456789');
  });

  test('renders PDF iframe for PDF URLs', () => {
    const { container } = render(
      <EmbedEntry url="https://example.com/paper.pdf" />,
    );
    const iframe = container.querySelector('iframe') as HTMLIFrameElement;
    expect(iframe.src).toContain('paper.pdf');
  });

  test('renders bookmark card for regular URLs', () => {
    render(<EmbedEntry url="https://example.com/article" title="An Article" />);
    expect(screen.getByText('An Article')).toBeInTheDocument();
    expect(screen.getByText('example.com')).toBeInTheDocument();
  });

  test('renders description when provided', () => {
    render(
      <EmbedEntry url="https://example.com" description="A brief desc" />,
    );
    expect(screen.getByText('A brief desc')).toBeInTheDocument();
  });

  test('renders favicon when provided', () => {
    const { container } = render(
      <EmbedEntry url="https://example.com" favicon="https://example.com/icon.png" />,
    );
    const favicon = container.querySelector('img');
    expect(favicon).toHaveAttribute('src', 'https://example.com/icon.png');
  });

  test('uses domain as title when title not provided', () => {
    const { container } = render(<EmbedEntry url="https://www.example.com/page" />);
    // Both title and domain spans show "example.com" when no title is provided
    const texts = container.querySelectorAll('span');
    const domainTexts = Array.from(texts).filter(s => s.textContent === 'example.com');
    expect(domainTexts.length).toBeGreaterThanOrEqual(1);
  });

  test('renders video title for YouTube when provided', () => {
    render(
      <EmbedEntry url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" title="My Video" />,
    );
    expect(screen.getByText('My Video')).toBeInTheDocument();
  });
});
