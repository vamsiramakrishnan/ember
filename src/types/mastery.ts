/**
 * Mastery state shape for the Constellation surface.
 * Levels map to semantic colours from the token system.
 */

export type MasteryLevel = 'mastered' | 'strong' | 'developing' | 'exploring';

export interface ConceptMastery {
  concept: string;
  level: MasteryLevel;
  percentage: number;
}

export interface CuriosityThread {
  question: string;
}
