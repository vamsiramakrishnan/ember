/**
 * Sample lexicon data for the Constellation surface.
 * Drawn from the Lexicon prototype (Screen 3).
 */
import type { LexiconEntry } from '@/types/lexicon';

export const demoLexicon: LexiconEntry[] = [
  {
    number: 1,
    term: 'Harmonic Ratio',
    pronunciation: '/hɑːrˈmɒnɪk ˈreɪʃioʊ/',
    definition:
      'The mathematical relationship between frequencies that produce consonant intervals. When two notes vibrate in simple whole-number ratios, we hear them as harmonious.',
    level: 'mastered',
    percentage: 94,
    etymology:
      'Greek ἁρμονία (harmonía, "joint, agreement"), from ἁρμόζω (harmózō, "to fit together").',
    crossReferences: ['Musica Universalis', 'Consonance'],
  },
  {
    number: 2,
    term: 'Musica Universalis',
    pronunciation: '/ˈmjuːzɪkə ˌjuːnɪˈvɜːrsəlɪs/',
    definition:
      'The ancient philosophical concept that the movements of celestial bodies produce a form of music — not audible sound, but mathematical harmony. Kepler believed the ratios of planetary orbits formed a cosmic choir.',
    level: 'strong',
    percentage: 78,
    etymology:
      'Latin: "universal music". Attributed to Pythagoras, refined by Kepler in Harmonices Mundi (1619).',
    crossReferences: ['Harmonic Ratio', 'Orbital Mechanics'],
  },
  {
    number: 3,
    term: 'Elliptical Orbit',
    pronunciation: '/ɪˈlɪptɪkəl ˈɔːrbɪt/',
    definition:
      'The path a planet traces around the sun — not a circle, but an ellipse. The sun sits at one focus. This shape means the planet speeds up when closer and slows down when farther away.',
    level: 'developing',
    percentage: 52,
    etymology:
      'Greek ἔλλειψις (élleipsis, "falling short"), because an ellipse is a circle that falls short of closing evenly.',
    crossReferences: ['Semi-major Axis', 'Kepler\'s Laws'],
  },
  {
    number: 4,
    term: 'Fourier Analysis',
    pronunciation: '/ˈfʊrieɪ əˈnæləsɪs/',
    definition:
      'The decomposition of any complex wave into a sum of simple sine waves. Any sound, any vibration, any periodic signal can be broken into pure frequencies.',
    level: 'exploring',
    percentage: 12,
    etymology:
      'Named for Joseph Fourier (1768–1830), who showed that heat conduction could be expressed as trigonometric series.',
    crossReferences: ['Wave Mechanics', 'Harmonic Series'],
  },
];
