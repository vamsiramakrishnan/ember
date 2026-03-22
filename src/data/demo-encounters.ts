/**
 * Sample encounter data for the Constellation surface.
 * Drawn from the Archive Ledger prototype (Screen 4).
 */
import type { Encounter } from '@/types/lexicon';

export const demoEncounters: Encounter[] = [
  {
    ref: '#001',
    thinker: 'Johannes Kepler',
    tradition: 'Celestial Mechanics',
    coreIdea:
      'The harmony you hear in music is the same mathematics that governs how planets move.',
    sessionTopic: 'The Music of the Spheres',
    date: 'Mar 18, Evening',
    status: 'active',
  },
  {
    ref: '#002',
    thinker: 'Pythagoras',
    tradition: 'Number Theory',
    coreIdea:
      'All is number. The ratios that make music beautiful are the same ratios that structure reality.',
    sessionTopic: 'Why Do Some Chords Sound Beautiful?',
    date: 'Mar 11, Afternoon',
    status: 'bridged',
    bridgedTo: 'Kepler',
  },
  {
    ref: '#003',
    thinker: 'Leonhard Euler',
    tradition: 'Analysis',
    coreIdea:
      'Made the mathematics of vibration precise enough to predict what you hear when you pluck a string.',
    sessionTopic: 'Wave Equations and Guitar Strings',
    date: 'Mar 4, Evening',
    status: 'active',
  },
  {
    ref: '#004',
    thinker: 'Ada Lovelace',
    tradition: 'Computation',
    coreIdea:
      'Machines could manipulate symbols of any kind — not just numbers, but music, patterns, ideas.',
    sessionTopic: 'Can Machines Think Musically?',
    date: 'Feb 25, Afternoon',
    status: 'dormant',
  },
];
