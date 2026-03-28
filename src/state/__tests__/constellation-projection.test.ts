/**
 * Tests for constellation-projection — declarative projection from entries.
 */
import { describe, test, expect } from 'vitest';
import { projectEntry, projectEntries } from '../constellation-projection';
import type { LiveEntry } from '@/types/entries';

function live(entry: Record<string, unknown>, id = 'e1'): LiveEntry {
  return {
    id, entry: entry as LiveEntry['entry'],
    crossedOut: false, bookmarked: false, pinned: false, timestamp: Date.now(),
  };
}

describe('constellation-projection', () => {
  describe('projectEntry', () => {
    test('thinker-card projects to encounter', () => {
      const le = live({
        type: 'thinker-card',
        thinker: { name: 'Kepler', dates: '1571-1630', gift: 'Harmony', bridge: '' },
      });
      const result = projectEntry(le);
      expect(result.encounters).toHaveLength(1);
      expect(result.encounters[0]!.thinkerName).toBe('Kepler');
    });

    test('concept-diagram projects to mastery seeds', () => {
      const le = live({
        type: 'concept-diagram',
        items: [{ label: 'Ratio' }, { label: 'Harmony' }],
      });
      const result = projectEntry(le);
      expect(result.mastery).toHaveLength(2);
      expect(result.mastery[0]!.concept).toBe('Ratio');
      expect(result.mastery[0]!.level).toBe('exploring');
      expect(result.mastery[0]!.percentage).toBe(15);
    });

    test('bridge-suggestion projects to curiosity', () => {
      const le = live({ type: 'bridge-suggestion', content: 'Why harmonic?' });
      const result = projectEntry(le);
      expect(result.curiosities).toHaveLength(1);
      expect(result.curiosities[0]!.question).toBe('Why harmonic?');
    });

    test('question projects to curiosity only if > 20 chars', () => {
      const short = live({ type: 'question', content: 'Why?' });
      expect(projectEntry(short).curiosities).toHaveLength(0);

      const long = live({ type: 'question', content: 'Why are planetary orbits elliptical?' });
      expect(projectEntry(long).curiosities).toHaveLength(1);
    });

    test('tutor-connection projects mastery for emphasized concept', () => {
      const le = live({
        type: 'tutor-connection', content: 'Orbital resonance leads to stability',
        emphasisEnd: 17,
      });
      const result = projectEntry(le);
      expect(result.mastery).toHaveLength(1);
      expect(result.mastery[0]!.concept).toBe('Orbital resonance');
    });

    test('tutor-connection with no emphasis produces nothing', () => {
      const le = live({
        type: 'tutor-connection', content: 'test', emphasisEnd: 0,
      });
      expect(projectEntry(le).mastery).toHaveLength(0);
    });

    test('hypothesis extracts capitalized concepts', () => {
      const le = live({
        type: 'hypothesis', content: 'Perhaps Pythagorean Ratios explain this',
      });
      const result = projectEntry(le);
      expect(result.mastery.length).toBeGreaterThan(0);
      expect(result.mastery[0]!.level).toBe('developing');
    });

    test('unknown entry type produces empty result', () => {
      const le = live({ type: 'prose', content: 'Hello' });
      const result = projectEntry(le);
      expect(result.encounters).toHaveLength(0);
      expect(result.mastery).toHaveLength(0);
      expect(result.curiosities).toHaveLength(0);
    });
  });

  describe('projectEntries', () => {
    test('merges results from multiple entries', () => {
      const entries: LiveEntry[] = [
        live({ type: 'thinker-card', thinker: { name: 'A', dates: '', gift: '', bridge: '' } }, 'e1'),
        live({ type: 'thinker-card', thinker: { name: 'B', dates: '', gift: '', bridge: '' } }, 'e2'),
      ];
      const result = projectEntries(entries);
      expect(result.encounters).toHaveLength(2);
    });

    test('deduplicates encounters by thinker name (case-insensitive)', () => {
      const entries: LiveEntry[] = [
        live({ type: 'thinker-card', thinker: { name: 'Kepler', dates: '', gift: '', bridge: '' } }, 'e1'),
        live({ type: 'thinker-card', thinker: { name: 'kepler', dates: '', gift: '', bridge: '' } }, 'e2'),
      ];
      const result = projectEntries(entries);
      expect(result.encounters).toHaveLength(1);
    });

    test('deduplicates mastery by concept name', () => {
      const entries: LiveEntry[] = [
        live({ type: 'concept-diagram', items: [{ label: 'Ratio' }] }, 'e1'),
        live({ type: 'concept-diagram', items: [{ label: 'ratio' }] }, 'e2'),
      ];
      const result = projectEntries(entries);
      expect(result.mastery).toHaveLength(1);
    });
  });
});
