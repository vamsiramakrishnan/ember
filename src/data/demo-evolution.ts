/**
 * Demo notebook: Darwin & the Tangled Bank
 * A student exploring evolution, natural selection, and the
 * surprising mathematics hiding in ecological systems.
 */
import type { NotebookEntry } from '@/types/entries';

export const demoEvolutionSession: NotebookEntry[] = [
  {
    type: 'echo',
    content:
      'Last session you asked why some species look *almost identical* but can\'t interbreed. Today that question has a name.',
  },
  {
    type: 'tutor-connection',
    content:
      'You noticed something Darwin spent twenty years trying to explain. The gap between "looks similar" and "is related" is where the entire theory of speciation lives.',
    emphasisEnd: 60,
  },
  {
    type: 'question',
    content: 'Why does evolution happen so slowly? If natural selection is so powerful, why aren\'t things changing all the time?',
  },
  {
    type: 'tutor-marginalia',
    content:
      'That\'s a deeper question than it appears. Consider: evolution *is* happening all the time. You just can\'t see it at a human timescale. The bacteria in your gut evolved resistance to something **this week**. The question isn\'t "why is it slow?" — it\'s "why do you expect it to be fast?"',
  },
  {
    type: 'thinker-card',
    thinker: {
      name: 'Charles Darwin',
      dates: '1809–1882',
      gift: 'Saw that the "tangled bank" of nature — messy, competitive, interdependent — was itself the engine of all biological complexity.',
      bridge: 'Connects to your fascination with how simple rules create complex systems.',
    },
  },
  {
    type: 'prose',
    content:
      'Okay, so if I think about it like a population instead of an individual... each generation is like a tiny experiment. Most experiments fail. But the ones that work get *copied*. So the speed limit isn\'t selection — it\'s **reproduction**.',
  },
  {
    type: 'tutor-marginalia',
    content:
      'Exactly right. And this is why bacteria evolve visibly fast (they reproduce every 20 minutes) while elephants seem frozen (one calf every few years). The clock of evolution ticks in generations, not years.',
  },
  {
    type: 'concept-diagram',
    items: [
      { label: 'Variation', subLabel: 'random mutation' },
      { label: 'Selection', subLabel: 'environmental pressure' },
      { label: 'Inheritance', subLabel: 'passed to offspring' },
      { label: 'Time', subLabel: 'generations, not years' },
    ],
  },
  {
    type: 'tutor-question',
    content:
      'Now — if evolution is driven by *randomness* (mutation) filtered by *necessity* (selection), does that make the outcome random or determined? Could you rewind the tape of life and get the same result?',
  },
  {
    type: 'silence',
    text: 'The notebook is open. The room is quiet.',
  },
  {
    type: 'hypothesis',
    content:
      'I think you\'d get different species but similar *shapes*. Like, something would evolve eyes again because seeing is useful. But it wouldn\'t be a human eye. It would be a totally different solution to the same problem.',
  },
  {
    type: 'tutor-marginalia',
    content:
      'You just independently arrived at the concept of **convergent evolution**. Eyes have evolved independently at least 40 different times. Wings at least 4 times. Your instinct is remarkably close to what Stephen Jay Gould argued in *Wonderful Life*.',
  },
  {
    type: 'scratch',
    content: 'convergent evolution — same problem, different solutions. like how planes and birds both fly but totally differently',
  },
  {
    type: 'bridge-suggestion',
    content:
      'Your insight about "same problem, different solutions" connects to a question in computer science: when you run an algorithm with random inputs, do you converge on the same answer? This is the foundation of **genetic algorithms** — evolution as computation.',
  },
  {
    type: 'divider',
    label: 'reflection',
  },
];

export const demoEvolutionMeta = {
  sessionNumber: 12,
  date: 'Thursday, 20 March',
  timeOfDay: 'Afternoon',
  topic: 'The Speed of Evolution',
};

export const demoEvolutionNotebook = {
  title: 'Darwin & the Tangled Bank',
  description: 'How does complexity arise from simplicity? What is natural selection really selecting?',
};
