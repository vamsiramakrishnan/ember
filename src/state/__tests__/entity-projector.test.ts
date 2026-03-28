/**
 * Tests for entity-projector — projects entries into knowledge graph commands.
 */
import { describe, test, expect } from 'vitest';
import { projectEntry, projectEntries } from '../entity-projector';
import type { LiveEntry } from '@/types/entries';

function live(entry: Record<string, unknown>, id = 'e1'): LiveEntry {
  return {
    id, entry: entry as LiveEntry['entry'],
    revealed: true, stale: false,
    crossedOut: false, bookmarked: false, pinned: false,
  };
}

describe('entity-projector', () => {
  describe('projectEntry', () => {
    test('thinker-card produces create-entity command for thinker', () => {
      const le = live({
        type: 'thinker-card',
        thinker: { name: 'Kepler', dates: '1571-1630', gift: 'Harmony', bridge: '' },
      });
      const cmds = projectEntry(le);
      expect(cmds).toHaveLength(1);
      expect(cmds[0]!.action).toBe('create-entity');
      if (cmds[0]!.action === 'create-entity') {
        expect(cmds[0]!.kind).toBe('thinker');
        expect(cmds[0]!.data.name).toBe('Kepler');
        expect(cmds[0]!.relationToSource).toBe('introduces');
      }
    });

    test('concept-diagram produces create-entity for each item', () => {
      const le = live({
        type: 'concept-diagram',
        items: [{ label: 'Ratio' }, { label: 'Harmony' }],
      });
      const cmds = projectEntry(le);
      expect(cmds).toHaveLength(2);
      expect(cmds.every((c) => c.action === 'create-entity')).toBe(true);
    });

    test('bridge-suggestion produces curiosity entity', () => {
      const le = live({ type: 'bridge-suggestion', content: 'Why patterns repeat?' });
      const cmds = projectEntry(le);
      expect(cmds).toHaveLength(1);
      if (cmds[0]!.action === 'create-entity') {
        expect(cmds[0]!.kind).toBe('curiosity');
      }
    });

    test('question under 20 chars produces nothing', () => {
      const le = live({ type: 'question', content: 'Why?' });
      expect(projectEntry(le)).toHaveLength(0);
    });

    test('question over 20 chars produces curiosity', () => {
      const le = live({ type: 'question', content: 'Why do planetary orbits have elliptical shapes?' });
      const cmds = projectEntry(le);
      expect(cmds).toHaveLength(1);
    });

    test('tutor-connection with valid emphasis produces concept', () => {
      const le = live({
        type: 'tutor-connection',
        content: 'Harmonic motion is fundamental',
        emphasisEnd: 15,
      });
      const cmds = projectEntry(le);
      expect(cmds).toHaveLength(1);
      if (cmds[0]!.action === 'create-entity') {
        expect(cmds[0]!.data.term).toBe('Harmonic motion');
      }
    });

    test('tutor-connection with too-short emphasis produces nothing', () => {
      const le = live({ type: 'tutor-connection', content: 'Hi', emphasisEnd: 2 });
      expect(projectEntry(le)).toHaveLength(0);
    });

    test('hypothesis extracts concepts from capitalized terms', () => {
      const le = live({ type: 'hypothesis', content: 'Maybe Kepler Laws explain it' });
      const cmds = projectEntry(le);
      expect(cmds.length).toBeGreaterThan(0);
    });

    test('unregistered type produces no commands', () => {
      const le = live({ type: 'prose', content: 'Hello' });
      expect(projectEntry(le)).toHaveLength(0);
    });
  });

  describe('projectEntries', () => {
    test('deduplicates entities by identity', () => {
      const entries: LiveEntry[] = [
        live({
          type: 'thinker-card',
          thinker: { name: 'Kepler', dates: '', gift: '', bridge: '' },
        }, 'e1'),
        live({
          type: 'thinker-card',
          thinker: { name: 'kepler', dates: '', gift: '', bridge: '' },
        }, 'e2'),
      ];
      const cmds = projectEntries(entries);
      const creates = cmds.filter((c) => c.action === 'create-entity');
      expect(creates).toHaveLength(1);
    });

    test('preserves non-create commands without dedup', () => {
      // Only create-entity commands get deduped
      const entries: LiveEntry[] = [
        live({ type: 'concept-diagram', items: [{ label: 'A' }] }, 'e1'),
        live({ type: 'concept-diagram', items: [{ label: 'B' }] }, 'e2'),
      ];
      const cmds = projectEntries(entries);
      expect(cmds).toHaveLength(2);
    });
  });
});
