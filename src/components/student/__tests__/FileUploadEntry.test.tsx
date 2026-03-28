import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/primitives/MarkdownContent', () => ({
  MarkdownContent: ({ children }: { children: string }) => <span>{children}</span>,
}));

import { FileUploadEntry } from '../FileUploadEntry';

const mockFile = {
  name: 'data.csv',
  mimeType: 'text/csv',
  size: 5120,
  blobHash: 'hash1',
};

describe('FileUploadEntry', () => {
  test('renders file name', () => {
    render(<FileUploadEntry file={mockFile} />);
    expect(screen.getByText('data.csv')).toBeInTheDocument();
  });

  test('renders file size', () => {
    render(<FileUploadEntry file={mockFile} />);
    expect(screen.getByText('5.0 KB')).toBeInTheDocument();
  });

  test('renders summary when provided', () => {
    render(<FileUploadEntry file={mockFile} summary="Contains 100 rows" />);
    expect(screen.getByText('Contains 100 rows')).toBeInTheDocument();
  });

  test('does not render summary when not provided', () => {
    const { container } = render(<FileUploadEntry file={mockFile} />);
    const summaryDivs = container.querySelectorAll('[class]');
    expect(summaryDivs.length).toBeGreaterThan(0);
  });

  test('shows text file icon for text MIME types', () => {
    render(<FileUploadEntry file={{ ...mockFile, mimeType: 'text/plain' }} />);
    expect(screen.getByText('≡')).toBeInTheDocument();
  });

  test('shows PDF icon for PDF MIME types', () => {
    render(<FileUploadEntry file={{ ...mockFile, mimeType: 'application/pdf' }} />);
    expect(screen.getByText('▤')).toBeInTheDocument();
  });

  test('formats bytes correctly', () => {
    render(<FileUploadEntry file={{ ...mockFile, size: 500 }} />);
    expect(screen.getByText('500 B')).toBeInTheDocument();
  });

  test('formats megabytes correctly', () => {
    render(<FileUploadEntry file={{ ...mockFile, size: 1048576 * 3.5 }} />);
    expect(screen.getByText('3.5 MB')).toBeInTheDocument();
  });
});
