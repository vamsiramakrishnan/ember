/**
 * Tests for context-layers.ts — formats context layers into tagged text blocks.
 */
import { describe, it, expect } from 'vitest';
import {
  buildProfileLayer,
  buildNotebookLayer,
  buildMemoryLayer,
  buildResearchLayer,
  buildBackgroundResultsLayer,
} from '../context-layers';
import type { StudentProfile, NotebookContext, SemanticMemory } from '../context-assembler';
import type { BackgroundResults } from '../background-results';

describe('buildProfileLayer', () => {
  const profile: StudentProfile = {
    name: 'Ada',
    masterySnapshot: [
      { concept: 'Gravity', level: 'strong', percentage: 80 },
      { concept: 'Orbits', level: 'developing', percentage: 45 },
    ],
    vocabularyCount: 12,
    activeCuriosities: ['Why do planets orbit?', 'What is dark matter?'],
    totalMinutes: 150,
  };

  it('includes student name', () => {
    expect(buildProfileLayer(profile)).toContain('Ada');
  });

  it('converts minutes to hours', () => {
    expect(buildProfileLayer(profile)).toContain('3 hours');
  });

  it('includes vocabulary count', () => {
    expect(buildProfileLayer(profile)).toContain('12 terms');
  });

  it('includes mastery data', () => {
    const result = buildProfileLayer(profile);
    expect(result).toContain('Gravity: strong (80%)');
    expect(result).toContain('Orbits: developing (45%)');
  });

  it('includes curiosities', () => {
    const result = buildProfileLayer(profile);
    expect(result).toContain('Why do planets orbit?');
  });

  it('limits mastery to 8 entries', () => {
    const bigProfile: StudentProfile = {
      ...profile,
      masterySnapshot: Array.from({ length: 12 }, (_, i) => ({
        concept: `C${i}`, level: 'exploring', percentage: i * 10,
      })),
    };
    const result = buildProfileLayer(bigProfile);
    expect(result).toContain('C7');
    expect(result).not.toContain('C8');
  });

  it('shows placeholder for empty mastery', () => {
    const empty: StudentProfile = { ...profile, masterySnapshot: [], activeCuriosities: [] };
    const result = buildProfileLayer(empty);
    expect(result).toContain('(no mastery data yet)');
    expect(result).toContain('(no open questions yet)');
  });
});

describe('buildNotebookLayer', () => {
  const notebook: NotebookContext = {
    title: 'Planetary Motion',
    description: 'How do planets move?',
    sessionNumber: 3,
    sessionTopic: 'Kepler\'s Laws',
    thinkersMet: ['Kepler', 'Newton'],
  };

  it('includes notebook title', () => {
    expect(buildNotebookLayer(notebook)).toContain('Planetary Motion');
  });

  it('includes session number and topic', () => {
    const result = buildNotebookLayer(notebook);
    expect(result).toContain('Session 3');
    expect(result).toContain("Kepler's Laws");
  });

  it('includes thinkers', () => {
    expect(buildNotebookLayer(notebook)).toContain('Kepler, Newton');
  });

  it('handles no thinkers', () => {
    const noThinkers = { ...notebook, thinkersMet: [] };
    expect(buildNotebookLayer(noThinkers)).toContain('No thinker encounters yet');
  });
});

describe('buildMemoryLayer', () => {
  it('returns null when all fields are null', () => {
    const m: SemanticMemory = {
      relevantHistory: null, relevantVocabulary: null,
      relevantThinkers: null, citations: [],
    };
    expect(buildMemoryLayer(m)).toBeNull();
  });

  it('includes history section', () => {
    const m: SemanticMemory = {
      relevantHistory: 'Previous session about gravity',
      relevantVocabulary: null, relevantThinkers: null, citations: [],
    };
    const result = buildMemoryLayer(m);
    expect(result).toContain('[PAST SESSIONS');
    expect(result).toContain('gravity');
  });

  it('includes citations', () => {
    const m: SemanticMemory = {
      relevantHistory: 'text', relevantVocabulary: null,
      relevantThinkers: null, citations: ['doc1.txt', 'doc2.txt'],
    };
    const result = buildMemoryLayer(m);
    expect(result).toContain('[Sources: doc1.txt, doc2.txt]');
  });

  it('combines multiple sections', () => {
    const m: SemanticMemory = {
      relevantHistory: 'H', relevantVocabulary: 'V',
      relevantThinkers: 'T', citations: [],
    };
    const result = buildMemoryLayer(m)!;
    expect(result).toContain('[PAST SESSIONS');
    expect(result).toContain('[VOCABULARY');
    expect(result).toContain('[THINKERS');
  });
});

describe('buildResearchLayer', () => {
  it('wraps facts in tagged block', () => {
    const result = buildResearchLayer({ facts: 'Newton discovered gravity.' });
    expect(result).toContain('[RESEARCH');
    expect(result).toContain('Newton discovered gravity.');
  });
});

describe('buildBackgroundResultsLayer', () => {
  it('includes new thinkers', () => {
    const bg: BackgroundResults = {
      newThinkers: ['Euler'], newTerms: [], masteryChanges: [], updatedAt: 1,
    };
    expect(buildBackgroundResultsLayer(bg)).toContain('Euler');
  });

  it('includes new terms', () => {
    const bg: BackgroundResults = {
      newThinkers: [], newTerms: ['entropy'], masteryChanges: [], updatedAt: 1,
    };
    expect(buildBackgroundResultsLayer(bg)).toContain('entropy');
  });

  it('includes mastery changes', () => {
    const bg: BackgroundResults = {
      newThinkers: [], newTerms: [],
      masteryChanges: [{ concept: 'Gravity', from: 40, to: 60 }],
      updatedAt: 1,
    };
    const result = buildBackgroundResultsLayer(bg);
    expect(result).toContain('Gravity: 40% → 60%');
  });
});
