import { describe, test, expect } from 'vitest';
import { render } from '@testing-library/react';

import { ConceptDiagramEdge } from '../ConceptDiagramEdge';

const fromRect = { x: 0, y: 50, w: 100, h: 40 };
const toRect = { x: 200, y: 50, w: 100, h: 40 };
const edge = { from: 0, to: 1, type: 'causes' as const, label: 'drives' };

describe('ConceptDiagramEdge', () => {
  test('renders null when fromRect is null', () => {
    const { container } = render(
      <svg><ConceptDiagramEdge edge={edge} fromRect={null} toRect={toRect} /></svg>,
    );
    expect(container.querySelector('g')).toBeNull();
  });

  test('renders null when toRect is null', () => {
    const { container } = render(
      <svg><ConceptDiagramEdge edge={edge} fromRect={fromRect} toRect={null} /></svg>,
    );
    expect(container.querySelector('g')).toBeNull();
  });

  test('renders path and arrowhead when both rects provided', () => {
    const { container } = render(
      <svg><ConceptDiagramEdge edge={edge} fromRect={fromRect} toRect={toRect} /></svg>,
    );
    expect(container.querySelector('path')).toBeTruthy();
    expect(container.querySelector('polygon')).toBeTruthy();
  });

  test('renders edge label when provided', () => {
    const { container } = render(
      <svg><ConceptDiagramEdge edge={edge} fromRect={fromRect} toRect={toRect} /></svg>,
    );
    expect(container.querySelector('text')?.textContent).toBe('drives');
  });

  test('does not render label when not provided', () => {
    const noLabelEdge = { from: 0, to: 1, type: 'causes' as const };
    const { container } = render(
      <svg><ConceptDiagramEdge edge={noLabelEdge} fromRect={fromRect} toRect={toRect} /></svg>,
    );
    expect(container.querySelector('text')).toBeNull();
  });

  test('applies dashed stroke for enables type', () => {
    const dashEdge = { from: 0, to: 1, type: 'enables' as const };
    const { container } = render(
      <svg><ConceptDiagramEdge edge={dashEdge} fromRect={fromRect} toRect={toRect} /></svg>,
    );
    const path = container.querySelector('path');
    expect(path?.getAttribute('stroke-dasharray')).toBe('4 3');
  });
});
