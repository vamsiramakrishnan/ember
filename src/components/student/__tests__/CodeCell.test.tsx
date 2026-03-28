import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { CodeCell } from '../CodeCell';

describe('CodeCell', () => {
  test('renders language label', () => {
    render(<CodeCell language="python" source="print('hi')" />);
    expect(screen.getByText('python')).toBeInTheDocument();
  });

  test('renders source code', () => {
    render(<CodeCell language="javascript" source="console.log(1)" />);
    expect(screen.getByText('console.log(1)')).toBeInTheDocument();
  });

  test('shows run button when onExecute provided', () => {
    render(<CodeCell language="python" source="x=1" onExecute={vi.fn()} />);
    expect(screen.getByLabelText('Execute code')).toBeInTheDocument();
  });

  test('does not show run button when onExecute not provided', () => {
    render(<CodeCell language="python" source="x=1" />);
    expect(screen.queryByLabelText('Execute code')).not.toBeInTheDocument();
  });

  test('calls onExecute when run clicked', () => {
    const onExecute = vi.fn();
    render(<CodeCell language="python" source="x=1" onExecute={onExecute} />);
    fireEvent.click(screen.getByLabelText('Execute code'));
    expect(onExecute).toHaveBeenCalledWith('x=1', 'python');
  });

  test('renders stdout result', () => {
    const result = { stdout: 'Hello', stderr: '', exitCode: 0 };
    render(<CodeCell language="python" source="print('Hello')" result={result} />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  test('renders stderr result', () => {
    const result = { stdout: '', stderr: 'Error!', exitCode: 1 };
    render(<CodeCell language="python" source="bad code" result={result} />);
    expect(screen.getByText('Error!')).toBeInTheDocument();
  });

  test('enters edit mode when code is clicked', () => {
    render(<CodeCell language="python" source="x=1" />);
    fireEvent.click(screen.getByLabelText('Click to edit code'));
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea).toBeInTheDocument();
  });
});
