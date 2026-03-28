import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/primitives/MarkdownContent', () => ({
  MarkdownContent: ({ children }: { children: string }) => <span>{children}</span>,
}));
vi.mock('../SlideVisualAids', () => ({
  StatCardsView: () => <div data-testid="stat-cards" />,
  ProcessFlowView: () => <div data-testid="process-flow" />,
  PyramidView: () => <div data-testid="pyramid" />,
  ComparisonView: () => <div data-testid="comparison" />,
  FunnelView: () => <div data-testid="funnel" />,
  CycleView: () => <div data-testid="cycle" />,
  ChecklistView: () => <div data-testid="checklist" />,
  MatrixView: () => <div data-testid="matrix" />,
}));

import { ReadingSlideView } from '../ReadingSlideView';
import type { ReadingSlide } from '@/types/entries';

describe('ReadingSlideView', () => {
  test('renders slide heading', () => {
    const slide: ReadingSlide = { heading: 'Introduction', body: 'Content', layout: 'content' };
    render(<ReadingSlideView slide={slide} index={0} />);
    expect(screen.getByText('Introduction')).toBeInTheDocument();
  });

  test('renders body content for content layout', () => {
    const slide: ReadingSlide = { heading: 'Test', body: 'Body text here', layout: 'content' };
    render(<ReadingSlideView slide={slide} index={0} />);
    expect(screen.getByText('Body text here')).toBeInTheDocument();
  });

  test('renders article element', () => {
    const slide: ReadingSlide = { heading: 'Test', body: 'Body', layout: 'content' };
    const { container } = render(<ReadingSlideView slide={slide} index={0} />);
    expect(container.querySelector('article')).toBeInTheDocument();
  });

  test('has accessible label', () => {
    const slide: ReadingSlide = { heading: 'Slide Title', body: 'Body', layout: 'content' };
    render(<ReadingSlideView slide={slide} index={2} />);
    expect(screen.getByLabelText('Page 3: Slide Title')).toBeInTheDocument();
  });

  test('renders image when imageUrl provided', () => {
    const slide: ReadingSlide = {
      heading: 'Visual', body: 'Body', layout: 'content',
      imageUrl: 'data:image/png;base64,abc',
    };
    render(<ReadingSlideView slide={slide} index={0} />);
    expect(screen.getByAltText('Illustration for Visual')).toBeInTheDocument();
  });

  test('renders timeline layout', () => {
    const slide: ReadingSlide = {
      heading: 'History', body: '', layout: 'timeline',
      timeline: [{ period: '1600', event: 'Kepler' }],
    };
    render(<ReadingSlideView slide={slide} index={0} />);
    expect(screen.getByText('1600')).toBeInTheDocument();
  });
});
