import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/hooks/useWaveform', () => ({
  useWaveform: () => ({
    canvasRef: { current: null },
    updateProgress: vi.fn(),
    getProgressFromClick: () => 0.5,
  }),
}));

import { PodcastPlayer } from '../PodcastPlayer';

describe('PodcastPlayer', () => {
  const defaultProps = {
    topic: 'Kepler\'s Laws',
    audioUrl: 'https://example.com/audio.mp3',
    transcript: 'Today we discuss planetary motion.',
  };

  test('renders topic heading', () => {
    render(<PodcastPlayer {...defaultProps} />);
    expect(screen.getByText("Kepler's Laws")).toBeInTheDocument();
  });

  test('renders podcast label', () => {
    render(<PodcastPlayer {...defaultProps} />);
    expect(screen.getByText('podcast')).toBeInTheDocument();
  });

  test('renders play button', () => {
    render(<PodcastPlayer {...defaultProps} />);
    expect(screen.getByLabelText('Play')).toBeInTheDocument();
  });

  test('renders transcript toggle', () => {
    render(<PodcastPlayer {...defaultProps} />);
    expect(screen.getByText('show transcript')).toBeInTheDocument();
  });

  test('toggles transcript visibility', () => {
    render(<PodcastPlayer {...defaultProps} />);
    fireEvent.click(screen.getByText('show transcript'));
    expect(screen.getByText('Today we discuss planetary motion.')).toBeInTheDocument();
    expect(screen.getByText('hide transcript')).toBeInTheDocument();
  });

  test('renders cover art when provided', () => {
    render(<PodcastPlayer {...defaultProps} coverUrl="data:image/png;base64,abc" />);
    expect(screen.getByAltText("Cover art for Kepler's Laws")).toBeInTheDocument();
  });

  test('shows transcript-only mode when no audio', () => {
    render(
      <PodcastPlayer topic="Topic" audioUrl="" transcript="Text only" />,
    );
    expect(screen.getByText('podcast transcript')).toBeInTheDocument();
    expect(screen.getByText('Text only')).toBeInTheDocument();
  });
});
