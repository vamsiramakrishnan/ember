/**
 * useTutorResponse — simulates tutor responses after student entries.
 * Follows the Socratic sequence: student writes → silence → tutor responds.
 * In production this would call the AI. Here we use curated responses.
 */
import { useCallback, useRef } from 'react';
import type { NotebookEntry } from '@/types/entries';

/** Pre-written tutor responses keyed by pattern. */
const questionResponses: NotebookEntry[] = [
  {
    type: 'tutor-question',
    content:
      'Before I answer that — what does your intuition say? What feels true, even if you can\'t prove it yet?',
  },
  {
    type: 'tutor-question',
    content:
      'That\'s worth thinking about carefully. Can you find an analogy from something you already understand?',
  },
  {
    type: 'tutor-question',
    content:
      'Interesting question. Where do you think the answer might live — in mathematics, in physics, or in something else entirely?',
  },
];

const proseResponses: NotebookEntry[] = [
  {
    type: 'tutor-marginalia',
    content:
      'You\'re circling something important here. Keep going — what does this imply for the relationship you noticed earlier?',
  },
  {
    type: 'tutor-marginalia',
    content:
      'That\'s a genuine insight. You arrived at it through your own reasoning, which is exactly how understanding should form.',
  },
  {
    type: 'tutor-marginalia',
    content:
      'Notice how this connects to what you wrote two entries ago. The thread is becoming visible.',
  },
];

const hypothesisResponses: NotebookEntry[] = [
  {
    type: 'tutor-marginalia',
    content:
      'That\'s a testable hypothesis. Let me ask you this — what would have to be true for your guess to be wrong?',
  },
  {
    type: 'tutor-marginalia',
    content:
      'Interesting instinct. You\'re not far off — but consider: does this hold if you push the analogy further?',
  },
];

export function useTutorResponse(
  addEntry: (entry: NotebookEntry) => void,
  addEntries: (entries: NotebookEntry[]) => void,
) {
  const responseIndex = useRef({ q: 0, p: 0, h: 0 });

  const respond = useCallback(
    (studentEntry: NotebookEntry) => {
      const idx = responseIndex.current;
      let responses: NotebookEntry[];

      if (studentEntry.type === 'question') {
        const silence: NotebookEntry = { type: 'silence' };
        const qIdx = idx.q % questionResponses.length;
        idx.q++;
        responses = [silence, questionResponses[qIdx] as NotebookEntry];
      } else if (studentEntry.type === 'hypothesis') {
        const hIdx = idx.h % hypothesisResponses.length;
        idx.h++;
        responses = [hypothesisResponses[hIdx] as NotebookEntry];
      } else if (studentEntry.type === 'prose') {
        const pIdx = idx.p % proseResponses.length;
        idx.p++;
        responses = [proseResponses[pIdx] as NotebookEntry];
      } else {
        return;
      }

      const silenceDelay = studentEntry.type === 'question' ? 1200 : 800;
      setTimeout(() => {
        const first = responses[0];
        const second = responses[1];
        if (first && !second) {
          addEntry(first);
        } else if (first && second) {
          addEntry(first);
          setTimeout(() => { addEntry(second); }, 2000);
        }
      }, silenceDelay);
    },
    [addEntry, addEntries],
  );

  return { respond };
}
