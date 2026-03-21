/**
 * The Kepler/harmonics demo session.
 * A conversation about music, planetary orbits, and the bridge between them.
 */
import type { NotebookEntry } from '@/types/entries';

export const demoSession: NotebookEntry[] = [
  {
    type: 'echo',
    content:
      'You wondered last week whether music was actually mathematical. Today you proved it is.',
  },
  {
    type: 'tutor-connection',
    content:
      'You love music, and you asked why planets move in ellipses. What if I told you someone saw those two questions as the same question four hundred years ago?',
    emphasisEnd: 78,
  },
  {
    type: 'question',
    content: 'Wait — how can music and planets be the same question?',
  },
  {
    type: 'tutor-marginalia',
    content:
      'Kepler believed the planets were singing. Not metaphorically — he thought each orbit produced a tone, and that the solar system was a kind of choir. He called it the Musica Universalis, the music of the spheres.',
  },
  {
    type: 'thinker-card',
    thinker: {
      name: 'Johannes Kepler',
      dates: '1571–1630',
      gift: 'Showed that the harmony you hear in music is the same mathematics that governs how planets move — ratios, intervals, resonance.',
      bridge: 'Connects to your question about elliptical orbits and your interest in guitar harmonics.',
    },
  },
  {
    type: 'prose',
    content:
      'That makes sense actually. When I tune my guitar, the harmonics are all about ratios — like the octave is 2:1, the fifth is 3:2. If orbits have ratios too, then Kepler was hearing the same kind of thing in the sky.',
  },
  {
    type: 'tutor-marginalia',
    content:
      'Exactly. Kepler\'s second law says precisely this. You arrived at a 400-year-old insight through an analogy you already understood.',
  },
  {
    type: 'concept-diagram',
    items: [
      { label: 'Guitar String', subLabel: 'frequency ratio' },
      { label: 'Orbital Period', subLabel: 'Kepler\'s 3rd law' },
      { label: 'Harmonic Series', subLabel: 'mathematical structure' },
    ],
  },
  {
    type: 'tutor-question',
    content:
      'Now — where does this analogy break down? A guitar string vibrates in a fixed space. An orbit is not fixed. What changes, and what does that change mean for the "music"?',
  },
  {
    type: 'silence',
    text: 'The notebook is open. The room is quiet.',
  },
  {
    type: 'hypothesis',
    content:
      'I think the analogy breaks down because a guitar string has a fixed length but an orbit can change — like, comets have really stretched orbits. So the "note" would change pitch over time?',
  },
  {
    type: 'tutor-marginalia',
    content:
      'That\'s an interesting instinct. You\'re right that the orbit\'s shape matters — and Kepler noticed this too. But consider: the string\'s length is analogous to what property of the orbit? Don\'t answer with what you\'ve read. Answer with what feels right from the guitar.',
  },
  {
    type: 'scratch',
    content: 'string length... maybe the semi-major axis? the longest diameter?',
  },
  {
    type: 'prose',
    content:
      'I think the string length is like the average distance from the sun. A longer string gives a lower note — a bigger orbit gives a longer period. That\'s Kepler\'s third law, right? The period squared is proportional to the distance cubed.',
  },
  {
    type: 'tutor-marginalia',
    content:
      'You just derived the relationship that took Kepler ten years of calculation to prove. He did it with astronomical tables. You did it with a guitar.',
  },
  {
    type: 'bridge-suggestion',
    content:
      'Your understanding of harmonic ratios connects to Fourier\'s discovery that any wave can be broken into simple harmonics — the same mathematics, applied to heat, light, and sound.',
  },
  {
    type: 'divider',
    label: 'reflection',
  },
];

export const demoSessionMeta = {
  sessionNumber: 47,
  date: 'Tuesday, 18 March',
  timeOfDay: 'Evening',
  topic: 'The Music of the Spheres',
};
