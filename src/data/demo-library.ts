/**
 * Sample primary text data for the Constellation surface.
 * Drawn from the Library prototype (Screen 1).
 */
import type { PrimaryText } from '@/types/lexicon';

export const demoLibrary: PrimaryText[] = [
  {
    title: 'Harmonices Mundi',
    author: 'Johannes Kepler',
    isCurrent: true,
    annotationCount: 8,
    quote:
      'The heavenly motions are nothing but a continuous song for several voices, perceived not by the ear but by the intellect.',
  },
  {
    title: 'Elements of Music',
    author: 'Euclid',
    isCurrent: false,
    annotationCount: 3,
    quote:
      'A ratio is a sort of relation in respect of size between two magnitudes of the same kind.',
  },
  {
    title: 'On the Sensations of Tone',
    author: 'Hermann von Helmholtz',
    isCurrent: false,
    annotationCount: 5,
    quote:
      'The sensation of a musical tone is compounded of harmonic upper partial tones.',
  },
];
