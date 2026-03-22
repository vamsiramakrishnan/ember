/**
 * Demo notebook: The Hard Problem
 * A student grappling with consciousness, qualia, and
 * whether a machine could ever truly "feel."
 */
import type { NotebookEntry } from '@/types/entries';

export const demoConsciousnessSession: NotebookEntry[] = [
  {
    type: 'echo',
    content:
      'You asked last time: "If I perfectly simulated a brain, would the simulation be *conscious*?" You\'re still not satisfied with the answer.',
  },
  {
    type: 'tutor-connection',
    content:
      'This question has consumed philosophy for three hundred years. The fact that you find every answer unsatisfying is itself a sign that you\'re thinking about it correctly.',
    emphasisEnd: 63,
  },
  {
    type: 'question',
    content: 'What\'s the difference between *processing information* and *experiencing* something? A thermostat "knows" the temperature, but it doesn\'t feel cold. Right?',
  },
  {
    type: 'tutor-marginalia',
    content:
      'You\'ve just articulated what David Chalmers calls the **Hard Problem of Consciousness**. The "easy" problems — how the brain processes sensory data, controls movement, integrates information — are engineering challenges. The hard problem is: *why does any of this processing feel like something from the inside?*',
  },
  {
    type: 'thinker-card',
    thinker: {
      name: 'Thomas Nagel',
      dates: '1937–',
      gift: 'Asked the devastating question: "What is it like to be a bat?" — proving that subjective experience cannot be reduced to objective physical description.',
      bridge: 'Connects to your intuition that consciousness is real but unmeasurable.',
    },
  },
  {
    type: 'prose',
    content:
      'The bat thing is interesting. A bat perceives the world through echolocation — it "sees" with sound. I can learn *everything* about how echolocation works at the neural level. I can describe the physics perfectly. But I still won\'t know what it **feels like** to be a bat. That gap — between knowing the mechanism and having the experience — is the hard problem?',
  },
  {
    type: 'tutor-marginalia',
    content:
      'Precisely. And notice: you arrived at this not through abstract reasoning but through *empathy* — trying to imagine another being\'s inner life. That itself is a form of consciousness investigating consciousness.',
  },
  {
    type: 'concept-diagram',
    items: [
      { label: 'Easy Problems', subLabel: 'how the brain processes' },
      { label: 'Hard Problem', subLabel: 'why it feels like something' },
      { label: 'Qualia', subLabel: 'subjective experience itself' },
    ],
  },
  {
    type: 'tutor-question',
    content:
      'Consider this thought experiment: imagine a neuroscientist who has only ever seen in black and white. She knows *everything* about colour — wavelengths, cone cells, neural pathways. Then one day she sees red for the first time. Did she learn something new?',
  },
  {
    type: 'silence',
    text: 'The notebook is open. The room is quiet.',
  },
  {
    type: 'hypothesis',
    content:
      'I think she *did* learn something new. She knew all the facts about red, but she didn\'t know **what red looks like**. So there\'s a kind of knowledge that isn\'t facts — it\'s experience. And if that\'s true, then consciousness contains something that physics can\'t capture.',
  },
  {
    type: 'tutor-marginalia',
    content:
      'That is Frank Jackson\'s *Mary\'s Room* argument, almost word for word. You reconstructed it independently. Jackson later changed his mind about it — but the thought experiment remains one of the most powerful in all of philosophy.',
  },
  {
    type: 'scratch',
    content: 'if experience is a kind of knowledge, then AI that only processes data can never truly "know" colour — it can only know *about* colour',
  },
  {
    type: 'bridge-suggestion',
    content:
      'Your distinction between "knowing about" and "knowing through experience" connects to **phenomenology** — the philosophical tradition that begins with Husserl and leads through Heidegger and Merleau-Ponty. It also connects directly to current debates about whether large language models have genuine understanding.',
  },
  {
    type: 'divider',
    label: 'reflection',
  },
];

export const demoConsciousnessMeta = {
  sessionNumber: 5,
  date: 'Friday, 21 March',
  timeOfDay: 'Evening',
  topic: 'The Hard Problem',
};

export const demoConsciousnessNotebook = {
  title: 'What Is It Like to Be?',
  description: 'Can a machine think? What is the difference between information and experience?',
};
