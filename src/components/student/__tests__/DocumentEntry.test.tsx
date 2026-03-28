import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/primitives/MarkdownContent', () => ({
  MarkdownContent: ({ children }: { children: string }) => <span>{children}</span>,
}));
vi.mock('@/persistence/repositories/blobs', () => ({
  getBlobAsDataUrl: () => Promise.resolve(null),
}));

import { DocumentEntry } from '../DocumentEntry';

const mockFile = {
  name: 'paper.pdf',
  mimeType: 'application/pdf',
  size: 2048000,
  blobHash: 'abc123',
};

describe('DocumentEntry', () => {
  test('renders file name', () => {
    render(<DocumentEntry file={mockFile} />);
    expect(screen.getByText('paper.pdf')).toBeInTheDocument();
  });

  test('formats file size correctly', () => {
    render(<DocumentEntry file={mockFile} />);
    expect(screen.getByText(/2\.0 MB/)).toBeInTheDocument();
  });

  test('renders page count when provided', () => {
    render(<DocumentEntry file={mockFile} pages={42} />);
    expect(screen.getByText(/42 pages/)).toBeInTheDocument();
  });

  test('renders extracted text when provided', () => {
    render(<DocumentEntry file={mockFile} extractedText="Some extracted content" />);
    expect(screen.getByText('Some extracted content')).toBeInTheDocument();
    expect(screen.getByText('extracted content')).toBeInTheDocument();
  });

  test('shows PDF icon for PDF files', () => {
    render(<DocumentEntry file={mockFile} />);
    expect(screen.getByText('▤')).toBeInTheDocument();
  });

  test('shows generic icon for non-PDF files', () => {
    const docFile = { ...mockFile, name: 'report.docx' };
    render(<DocumentEntry file={docFile} />);
    expect(screen.getByText('◻')).toBeInTheDocument();
  });
});
