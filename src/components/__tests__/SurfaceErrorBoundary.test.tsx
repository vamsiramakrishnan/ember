import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SurfaceErrorBoundary } from '../SurfaceErrorBoundary';

function ProblemChild(): JSX.Element {
  throw new Error('Surface kaboom');
}

function GoodChild(): JSX.Element {
  return <p>Surface content</p>;
}

describe('SurfaceErrorBoundary', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('renders children when no error occurs', () => {
    render(
      <SurfaceErrorBoundary surface="notebook" onRecover={vi.fn()}>
        <GoodChild />
      </SurfaceErrorBoundary>,
    );
    expect(screen.getByText('Surface content')).toBeInTheDocument();
  });

  test('shows surface-specific error message', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <SurfaceErrorBoundary surface="constellation" onRecover={vi.fn()}>
        <ProblemChild />
      </SurfaceErrorBoundary>,
    );
    expect(
      screen.getByText('The constellation needs a moment.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Something unexpected happened/),
    ).toBeInTheDocument();
  });

  test('shows "Return to notebook" button', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <SurfaceErrorBoundary surface="notebook" onRecover={vi.fn()}>
        <ProblemChild />
      </SurfaceErrorBoundary>,
    );
    expect(screen.getByText('Return to notebook')).toBeInTheDocument();
  });

  test('calls onRecover when button is clicked', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const onRecover = vi.fn();
    render(
      <SurfaceErrorBoundary surface="notebook" onRecover={onRecover}>
        <ProblemChild />
      </SurfaceErrorBoundary>,
    );
    fireEvent.click(screen.getByText('Return to notebook'));
    expect(onRecover).toHaveBeenCalledOnce();
  });
});
