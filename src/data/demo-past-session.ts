/**
 * A brief past session shown above the current session.
 * Demonstrates session continuity — the notebook is one continuous scroll.
 */
import type { NotebookEntry } from '@/types/entries';

export const demoPastSession: NotebookEntry[] = [
  {
    type: 'prose',
    content:
      'I think music is mathematical because every note is a frequency, and frequencies have ratios. An octave is exactly double the frequency. A fifth is 3:2. These aren\'t arbitrary — they come from physics.',
  },
  {
    type: 'tutor-marginalia',
    content:
      'You\'ve just described something Pythagoras discovered 2,500 years ago. He noticed that a string half the length produces a note one octave higher. The same ratios, the same mathematics.',
  },
  {
    type: 'question',
    content:
      'But why do simple ratios sound beautiful? Why does 3:2 sound consonant but 45:32 sounds dissonant?',
  },
  {
    type: 'tutor-question',
    content:
      'That\'s the deepest question in music theory. Before I answer — what does your ear tell you? When you play a perfect fifth on your guitar, what do you feel?',
  },
  {
    type: 'divider',
  },
];

export const demoPastSessionMeta = {
  sessionNumber: 46,
  date: 'Monday, 10 March',
  timeOfDay: 'Afternoon',
  topic: 'Why Music Is Mathematical',
};
