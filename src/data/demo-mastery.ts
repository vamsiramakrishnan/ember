/**
 * Sample mastery data for the Constellation surface.
 */
import type { ConceptMastery, CuriosityThread } from '@/types/mastery';

export const demoMastery: ConceptMastery[] = [
  { concept: 'Harmonic Ratios', level: 'mastered', percentage: 94 },
  { concept: 'Wave Mechanics', level: 'strong', percentage: 78 },
  { concept: 'Orbital Mechanics', level: 'developing', percentage: 52 },
  { concept: 'Number Theory', level: 'developing', percentage: 41 },
  { concept: 'Fourier Analysis', level: 'exploring', percentage: 12 },
];

export const demoCuriosityThreads: CuriosityThread[] = [
  { question: 'Is there a mathematical pattern to why some chords sound beautiful and others don\'t?' },
  { question: 'Why do planets orbit in ellipses instead of circles?' },
  { question: 'Can you hear the shape of a drum?' },
];
