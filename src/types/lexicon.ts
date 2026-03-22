/**
 * Types for the Lexicon (personal vocabulary) and Encounter (intellectual history).
 * These support the enriched Constellation surface drawn from prototypes.
 */

import type { MasteryLevel } from './mastery';

export interface LexiconEntry {
  /** Entry number in the student's personal dictionary. */
  number: number;
  /** The term itself. */
  term: string;
  /** IPA or simplified pronunciation. */
  pronunciation: string;
  /** The student's definition in their own words. */
  definition: string;
  /** Mastery level for this term. */
  level: MasteryLevel;
  /** Mastery percentage (1–100). */
  percentage: number;
  /** Brief etymological note. */
  etymology: string;
  /** Related terms the student has encountered. */
  crossReferences: string[];
}

export interface Encounter {
  /** Reference number in the archive. */
  ref: string;
  /** Name of the thinker encountered. */
  thinker: string;
  /** Category or tradition. */
  tradition: string;
  /** Core idea or quote. */
  coreIdea: string;
  /** Session context — what was being explored. */
  sessionTopic: string;
  /** Date string. */
  date: string;
  /** Current bridge status. */
  status: 'active' | 'dormant' | 'bridged' | 'pending';
  /** If bridged, to what concept. */
  bridgedTo?: string;
}

export interface PrimaryText {
  /** Title of the work. */
  title: string;
  /** Author name. */
  author: string;
  /** Whether currently being read. */
  isCurrent: boolean;
  /** Number of annotations the student has made. */
  annotationCount: number;
  /** A representative quote. */
  quote: string;
}
