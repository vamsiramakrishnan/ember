import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useRef } from 'react';

import { SelectionToolbar } from '../SelectionToolbar';

function Wrapper({ onAction }: { onAction: (a: unknown) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref}>
      <span>Some text to select</span>
      <SelectionToolbar containerRef={ref} onAction={onAction} entryId="e1" />
    </div>
  );
}

describe('SelectionToolbar', () => {
  test('does not render when no selection exists', () => {
    render(<Wrapper onAction={vi.fn()} />);
    // Toolbar should not be visible initially (no selection)
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
  });

  test('renders without crashing', () => {
    expect(() => render(<Wrapper onAction={vi.fn()} />)).not.toThrow();
  });
});
