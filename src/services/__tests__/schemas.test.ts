/**
 * Tests for schemas — Zod schemas for structured agent responses.
 */
import { describe, test, expect } from 'vitest';
import {
  tutorMarginaliaSchema,
  tutorQuestionSchema,
  tutorConnectionSchema,
  tutorDirectiveSchema,
  thinkerCardSchema,
  conceptDiagramSchema,
  tutorResponseSchema,
  taskSignalsSchema,
  thinkerExtractionSchema,
  vocabExtractionSchema,
  masteryUpdateSchema,
  annotationResultSchema,
  echoResponseSchema,
  routingSchema,
  bootstrapSchema,
  entityEnrichmentSchema,
  entryMetaLabelSchema,
} from '../schemas';

describe('tutorResponseSchema', () => {
  test('parses valid tutor-marginalia', () => {
    const data = { type: 'tutor-marginalia', content: 'A note' };
    expect(tutorMarginaliaSchema.parse(data)).toEqual(data);
  });

  test('parses valid tutor-question', () => {
    const data = { type: 'tutor-question', content: 'Why?' };
    expect(tutorQuestionSchema.parse(data)).toEqual(data);
  });

  test('parses valid tutor-connection', () => {
    const data = { type: 'tutor-connection', content: 'Connected to X', emphasisEnd: 5 };
    expect(tutorConnectionSchema.parse(data)).toEqual(data);
  });

  test('parses valid tutor-directive', () => {
    const data = { type: 'tutor-directive', content: 'Explore this' };
    expect(tutorDirectiveSchema.parse(data)).toEqual(data);
  });

  test('parses valid thinker-card', () => {
    const data = {
      type: 'thinker-card',
      thinker: { name: 'Euler', dates: '1707-1783', gift: 'analysis', bridge: 'calculus' },
    };
    expect(thinkerCardSchema.parse(data)).toEqual(data);
  });

  test('parses valid concept-diagram', () => {
    const data = {
      type: 'concept-diagram',
      items: [{ label: 'Node A' }, { label: 'Node B', subLabel: 'detail' }],
    };
    expect(conceptDiagramSchema.parse(data)).toEqual(data);
  });

  test('discriminated union rejects unknown type', () => {
    expect(() => tutorResponseSchema.parse({ type: 'unknown', content: '' })).toThrow();
  });
});

describe('taskSignalsSchema', () => {
  test('parses valid task signals', () => {
    const data = {
      updateThinkers: true, updateVocabulary: false,
      updateMastery: true, updateCuriosities: false,
    };
    expect(taskSignalsSchema.parse(data)).toEqual(data);
  });
});

describe('thinkerExtractionSchema', () => {
  test('parses thinker array', () => {
    const data = { thinkers: [{ name: 'Newton', tradition: 'physics', coreIdea: 'gravity' }] };
    expect(thinkerExtractionSchema.parse(data)).toEqual(data);
  });
});

describe('vocabExtractionSchema', () => {
  test('parses terms array', () => {
    const data = { terms: [{ term: 'entropy', definition: 'disorder measure' }] };
    expect(vocabExtractionSchema.parse(data)).toEqual(data);
  });
});

describe('masteryUpdateSchema', () => {
  test('parses valid mastery update', () => {
    const data = { updates: [{ concept: 'calculus', level: 'developing', percentage: 40 }] };
    expect(masteryUpdateSchema.parse(data)).toEqual(data);
  });

  test('rejects invalid mastery level', () => {
    const data = { updates: [{ concept: 'x', level: 'expert', percentage: 100 }] };
    expect(() => masteryUpdateSchema.parse(data)).toThrow();
  });
});

describe('annotationResultSchema', () => {
  test('parses valid annotation', () => {
    const data = {
      annotations: [{ span: 'some text', kind: 'trivia', content: 'fun fact' }],
    };
    expect(annotationResultSchema.parse(data)).toEqual(data);
  });
});

describe('echoResponseSchema', () => {
  test('parses skip response', () => {
    expect(echoResponseSchema.parse({ skip: true })).toEqual({ skip: true });
  });

  test('parses content response', () => {
    const data = { content: 'Echo content', sourceSession: 3 };
    expect(echoResponseSchema.parse(data)).toEqual(data);
  });
});

describe('routingSchema', () => {
  test('parses valid routing decision', () => {
    const data = {
      tutor: true, research: false, visualize: false,
      illustrate: false, deepMemory: false, directive: false, reason: 'simple q',
    };
    expect(routingSchema.parse(data)).toEqual(data);
  });
});

describe('bootstrapSchema', () => {
  test('parses minimal bootstrap', () => {
    expect(bootstrapSchema.parse({})).toEqual({});
  });

  test('parses full bootstrap', () => {
    const data = {
      opening: 'Welcome',
      thinkers: [{ name: 'A', dates: '1', tradition: 't', coreIdea: 'c', gift: 'g', bridge: 'b' }],
      vocabulary: [{ term: 'x', pronunciation: 'ex', definition: 'd', etymology: 'e' }],
      concepts: [{ concept: 'y', level: 'exploring', percentage: 5 }],
      library: [{ title: 't', author: 'a', quote: 'q' }],
      curiosities: ['Why?'],
    };
    expect(bootstrapSchema.parse(data)).toEqual(data);
  });
});

describe('entityEnrichmentSchema', () => {
  test('parses valid entity enrichment', () => {
    const data = { kind: 'thinker', name: 'Euler', detail: 'Mathematician' };
    expect(entityEnrichmentSchema.parse(data)).toEqual(data);
  });

  test('rejects invalid kind', () => {
    expect(() => entityEnrichmentSchema.parse({ kind: 'planet', name: 'x', detail: 'd' })).toThrow();
  });
});

describe('entryMetaLabelSchema', () => {
  test('parses valid labels', () => {
    const data = {
      labels: [{ id: '1', title: 'Kepler harmonics', tags: ['astronomy'] }],
    };
    expect(entryMetaLabelSchema.parse(data)).toEqual(data);
  });
});
