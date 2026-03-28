/**
 * Zod schemas for all structured agent responses.
 * Used with Gemini's responseJsonSchema for type-safe output.
 *
 * Each schema matches the expected JSON shape of an agent's response.
 * Replaces all regex-based JSON parsing with validated schemas.
 */
import { z } from 'zod';

// ─── Tutor Response ──────────────────────────────────────────

export const tutorMarginaliaSchema = z.object({
  type: z.literal('tutor-marginalia'),
  content: z.string(),
});

export const tutorQuestionSchema = z.object({
  type: z.literal('tutor-question'),
  content: z.string(),
});

export const tutorConnectionSchema = z.object({
  type: z.literal('tutor-connection'),
  content: z.string(),
  emphasisEnd: z.number(),
});

export const tutorDirectiveSchema = z.object({
  type: z.literal('tutor-directive'),
  content: z.string(),
  action: z.enum(['search', 'read', 'try', 'observe', 'compare']).optional(),
});

export const thinkerCardSchema = z.object({
  type: z.literal('thinker-card'),
  thinker: z.object({
    name: z.string(),
    dates: z.string(),
    gift: z.string(),
    bridge: z.string(),
  }),
});

const conceptDiagramItemSchema: z.ZodType = z.object({
  label: z.string(),
  subLabel: z.string().optional(),
  accent: z.enum(['sage', 'indigo', 'amber', 'margin']).optional(),
  detail: z.string().optional(),
  entityKind: z.enum(['concept', 'thinker', 'term']).optional(),
  children: z.array(z.lazy(() => conceptDiagramItemSchema)).optional(),
});

export const conceptDiagramSchema = z.object({
  type: z.literal('concept-diagram'),
  title: z.string().optional(),
  layout: z.enum([
    'flow', 'tree', 'radial', 'pyramid', 'cycle',
    'timeline', 'constellation', 'graph',
  ]).optional(),
  items: z.array(conceptDiagramItemSchema),
  edges: z.array(z.object({
    from: z.number(),
    to: z.number(),
    label: z.string().optional(),
    type: z.enum(['causes', 'enables', 'contrasts', 'extends', 'requires', 'bridges']).optional(),
  })).optional(),
});

export const tutorResponseSchema = z.discriminatedUnion('type', [
  tutorMarginaliaSchema,
  tutorQuestionSchema,
  tutorConnectionSchema,
  tutorDirectiveSchema,
  thinkerCardSchema,
  conceptDiagramSchema,
]);

export type TutorResponse = z.infer<typeof tutorResponseSchema>;

// ─── Task Assessment ─────────────────────────────────────────

export const taskSignalsSchema = z.object({
  updateThinkers: z.boolean(),
  updateVocabulary: z.boolean(),
  updateMastery: z.boolean(),
  updateCuriosities: z.boolean(),
});

// ─── Thinker Extraction ──────────────────────────────────────

export const thinkerExtractionSchema = z.object({
  thinkers: z.array(z.object({
    name: z.string(),
    tradition: z.string(),
    coreIdea: z.string(),
  })),
});

// ─── Vocabulary Extraction ───────────────────────────────────

export const vocabExtractionSchema = z.object({
  terms: z.array(z.object({
    term: z.string(),
    definition: z.string(),
    etymology: z.string().optional(),
  })),
});

// ─── Mastery Update ──────────────────────────────────────────

export const masteryUpdateSchema = z.object({
  updates: z.array(z.object({
    concept: z.string(),
    level: z.enum(['exploring', 'developing', 'strong', 'mastered']),
    percentage: z.number(),
  })),
});

// ─── Inline Annotations ─────────────────────────────────────

export const annotationResultSchema = z.object({
  annotations: z.array(z.object({
    span: z.string(),
    kind: z.enum(['trivia', 'connection', 'question', 'insight', 'correction']),
    content: z.string(),
  })),
});

// ─── Echo ────────────────────────────────────────────────────

export const echoResponseSchema = z.union([
  z.object({ skip: z.literal(true) }),
  z.object({ content: z.string(), sourceSession: z.number().optional() }),
]);

// ─── Reflection ──────────────────────────────────────────────

export const reflectionResponseSchema = z.union([
  z.object({ skip: z.literal(true) }),
  z.object({ content: z.string() }),
]);

// ─── Router ──────────────────────────────────────────────────

export const routingSchema = z.object({
  tutor: z.boolean(),
  research: z.boolean(),
  visualize: z.boolean(),
  illustrate: z.boolean(),
  deepMemory: z.boolean(),
  directive: z.boolean(),
  graphExplore: z.boolean(),
  reason: z.string(),
});

// ─── Bootstrap ───────────────────────────────────────────────

export const bootstrapSchema = z.object({
  opening: z.string().optional(),
  thinkers: z.array(z.object({
    name: z.string(),
    dates: z.string(),
    tradition: z.string(),
    coreIdea: z.string(),
    gift: z.string(),
    bridge: z.string(),
  })).optional(),
  vocabulary: z.array(z.object({
    term: z.string(),
    pronunciation: z.string(),
    definition: z.string(),
    etymology: z.string(),
  })).optional(),
  concepts: z.array(z.object({
    concept: z.string(),
    level: z.string(),
    percentage: z.number(),
  })).optional(),
  library: z.array(z.object({
    title: z.string(),
    author: z.string(),
    quote: z.string(),
  })).optional(),
  curiosities: z.array(z.string()).optional(),
});

// ─── Metadata Enrichment ─────────────────────────────────────

export const metadataSchema = z.object({
  tags: z.array(z.string()),
  discipline: z.string(),
  summary: z.string(),
});

// ─── Entity Enrichment (@ mention creation) ─────────────────

export const entityEnrichmentSchema = z.object({
  kind: z.enum(['thinker', 'concept', 'term', 'question']),
  name: z.string(),
  dates: z.string().optional(),
  tradition: z.string().optional(),
  coreIdea: z.string().optional(),
  definition: z.string().optional(),
  etymology: z.string().optional(),
  detail: z.string(),
});

// ─── Entry Meta-Labels (async title/tag generation) ──────────

export const entryMetaLabelSchema = z.object({
  labels: z.array(z.object({
    id: z.string(),
    title: z.string(),
    tags: z.array(z.string()),
  })),
});
