import { describe, test, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { FlashcardDeck } from '../FlashcardDeck';
import type { Flashcard } from '@/types/entries';

const cards: Flashcard[] = [
  { front: 'What is F=ma?', back: "Newton's second law", concept: 'mechanics' },
  { front: 'What is E=mc²?', back: 'Mass-energy equivalence', concept: 'relativity' },
  { front: 'What is entropy?', back: 'Measure of disorder', concept: 'thermo' },
];

describe('FlashcardDeck', () => {
  test('renders collapsed header with title', () => {
    render(<FlashcardDeck title="Physics" cards={cards} />);
    expect(screen.getByText('Physics')).toBeInTheDocument();
  });

  test('shows card count badge', () => {
    render(<FlashcardDeck title="Physics" cards={cards} />);
    expect(screen.getByText('3 cards')).toBeInTheDocument();
  });

  test('shows click to study hint', () => {
    render(<FlashcardDeck title="Physics" cards={cards} />);
    expect(screen.getByText('click to study')).toBeInTheDocument();
  });

  test('expands when header clicked', () => {
    render(<FlashcardDeck title="Physics" cards={cards} />);
    fireEvent.click(screen.getByLabelText(/Expand flashcards/));
    expect(screen.getByText('question')).toBeInTheDocument();
    expect(screen.getByText('What is F=ma?')).toBeInTheDocument();
  });

  test('flips card on click', () => {
    render(<FlashcardDeck title="Physics" cards={cards} />);
    fireEvent.click(screen.getByLabelText(/Expand flashcards/));
    fireEvent.click(screen.getByLabelText('Show back'));
    expect(screen.getByLabelText('Show front')).toBeInTheDocument();
  });

  test('navigates to next card', () => {
    render(<FlashcardDeck title="Physics" cards={cards} />);
    fireEvent.click(screen.getByLabelText(/Expand flashcards/));
    fireEvent.click(screen.getByLabelText('Next'));
    expect(screen.getByText('What is E=mc²?')).toBeInTheDocument();
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  test('navigates to previous card', () => {
    render(<FlashcardDeck title="Physics" cards={cards} />);
    fireEvent.click(screen.getByLabelText(/Expand flashcards/));
    fireEvent.click(screen.getByLabelText('Next'));
    fireEvent.click(screen.getByLabelText('Previous'));
    expect(screen.getByText('What is F=ma?')).toBeInTheDocument();
  });

  test('disables previous on first card', () => {
    render(<FlashcardDeck title="Physics" cards={cards} />);
    fireEvent.click(screen.getByLabelText(/Expand flashcards/));
    expect(screen.getByLabelText('Previous')).toBeDisabled();
  });

  test('shows progress indicator', () => {
    render(<FlashcardDeck title="Physics" cards={cards} />);
    fireEvent.click(screen.getByLabelText(/Expand flashcards/));
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  test('collapses when collapse clicked', () => {
    render(<FlashcardDeck title="Physics" cards={cards} />);
    fireEvent.click(screen.getByLabelText(/Expand flashcards/));
    fireEvent.click(screen.getByLabelText('Collapse'));
    expect(screen.getByText('click to study')).toBeInTheDocument();
  });
});
