import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

function ProblemChild(): JSX.Element {
  throw new Error('Test explosion');
}

function GoodChild(): JSX.Element {
  return <p>All is well</p>;
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <GoodChild />
      </ErrorBoundary>,
    );
    expect(screen.getByText('All is well')).toBeInTheDocument();
  });

  test('shows error message when child throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Something went quiet.')).toBeInTheDocument();
    expect(
      screen.getByText(/A rendering error occurred/),
    ).toBeInTheDocument();
    spy.mockRestore();
  });

  test('shows "Try again" button that resets the boundary', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { rerender } = render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Try again')).toBeInTheDocument();
    // After clicking, re-render with a good child to verify reset
    rerender(
      <ErrorBoundary>
        <GoodChild />
      </ErrorBoundary>,
    );
    fireEvent.click(screen.getByText('Try again'));
    expect(screen.getByText('All is well')).toBeInTheDocument();
    spy.mockRestore();
  });

  test('calls console.error on error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>,
    );
    expect(spy).toHaveBeenCalled();
    const args = spy.mock.calls.find((c) =>
      String(c[0]).includes('[Ember] Render error'),
    );
    expect(args).toBeDefined();
    spy.mockRestore();
  });
});
