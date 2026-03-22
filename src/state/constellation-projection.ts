/**
 * ConstellationProjection — declarative projection from notebook entries
 * to constellation data (lexicon, encounters, mastery, curiosities).
 *
 * Eigen principle: The constellation is a reflection, not a destination.
 * It shows what the student has encountered, not what they've been told
 * to study. Every constellation entry traces back to a notebook moment.
 *
 * Architecture: A set of pure projection functions that map entry types
 * to constellation records. The useConstellationSync hook calls these
 * projections, keeping the logic centralized and testable.
 *
 * Traces to:
 * - 04-information-architecture.md: "The student visits the Constellation
 *   infrequently — perhaps once a week"
 * - Principle III (Mastery is Invisible): projections are quiet, automatic
 * - 06-component-inventory.md: Family 8 (Constellation views)
 */

import type { LiveEntry } from '@/types/entries';

// ─── Projection types ──────────────────────────────────────

export interface EncounterProjection {
  thinkerName: string;
  coreIdea: string;
  sourceEntryId: string;
}

export interface MasteryProjection {
  concept: string;
  level: 'exploring' | 'developing';
  percentage: number;
  sourceEntryId: string;
}

export interface CuriosityProjection {
  question: string;
  sourceEntryId: string;
}

export interface LexiconProjection {
  term: string;
  definition: string;
  sourceEntryId: string;
}

export interface ProjectionResult {
  encounters: EncounterProjection[];
  mastery: MasteryProjection[];
  curiosities: CuriosityProjection[];
  lexicon: LexiconProjection[];
}

// ─── Projection functions ──────────────────────────────────

/** Project a single entry to constellation records. */
export function projectEntry(le: LiveEntry): ProjectionResult {
  const result: ProjectionResult = {
    encounters: [],
    mastery: [],
    curiosities: [],
    lexicon: [],
  };

  const entry = le.entry;

  switch (entry.type) {
    // Thinker cards → encounters
    case 'thinker-card':
      result.encounters.push({
        thinkerName: entry.thinker.name,
        coreIdea: entry.thinker.gift,
        sourceEntryId: le.id,
      });
      break;

    // Concept diagrams → mastery seeds (exploring level)
    case 'concept-diagram':
      for (const item of entry.items) {
        result.mastery.push({
          concept: item.label,
          level: 'exploring',
          percentage: 15,
          sourceEntryId: le.id,
        });
      }
      break;

    // Bridge suggestions → curiosity threads
    case 'bridge-suggestion':
      result.curiosities.push({
        question: entry.content,
        sourceEntryId: le.id,
      });
      break;

    // Student questions → curiosity threads (if substantive)
    case 'question':
      if (entry.content.length > 20) {
        result.curiosities.push({
          question: entry.content,
          sourceEntryId: le.id,
        });
      }
      break;

    // Tutor connections → mastery seeds for the concepts mentioned
    case 'tutor-connection':
      // Extract the emphasized portion as a concept
      if (entry.emphasisEnd > 0) {
        const concept = entry.content.slice(0, entry.emphasisEnd).trim();
        if (concept.length > 2 && concept.length < 60) {
          result.mastery.push({
            concept,
            level: 'exploring',
            percentage: 10,
            sourceEntryId: le.id,
          });
        }
      }
      break;

    // Hypotheses → developing mastery for the core concept
    case 'hypothesis':
      // A student forming hypotheses signals developing understanding
      // Extract the first noun phrase as a rough concept
      extractConcepts(entry.content).forEach((concept) => {
        result.mastery.push({
          concept,
          level: 'developing',
          percentage: 35,
          sourceEntryId: le.id,
        });
      });
      break;
  }

  return result;
}

/** Project all entries and merge results (deduplicating). */
export function projectEntries(entries: LiveEntry[]): ProjectionResult {
  const merged: ProjectionResult = {
    encounters: [],
    mastery: [],
    curiosities: [],
    lexicon: [],
  };

  for (const le of entries) {
    const proj = projectEntry(le);
    merged.encounters.push(...proj.encounters);
    merged.mastery.push(...proj.mastery);
    merged.curiosities.push(...proj.curiosities);
    merged.lexicon.push(...proj.lexicon);
  }

  // Deduplicate by key
  merged.encounters = dedup(merged.encounters, (e) => e.thinkerName.toLowerCase());
  merged.mastery = dedup(merged.mastery, (m) => m.concept.toLowerCase());
  merged.curiosities = dedup(merged.curiosities, (c) => c.question.slice(0, 50));

  return merged;
}

// ─── Concept extraction (simple heuristic) ─────────────────

/** Extract potential concept terms from text. */
function extractConcepts(text: string): string[] {
  // Look for capitalized multi-word phrases (proper nouns, concepts)
  const matches = text.match(
    /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g,
  ) ?? [];

  // Also look for quoted terms
  const quoted = text.match(/"([^"]{3,40})"/g) ?? [];
  const quotedTerms = quoted.map((q) => q.slice(1, -1));

  return [...matches, ...quotedTerms]
    .filter((t) => t.length > 2 && t.length < 60)
    .slice(0, 3); // Max 3 concepts per entry
}

// ─── Utility ───────────────────────────────────────────────

function dedup<T>(arr: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  return arr.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
