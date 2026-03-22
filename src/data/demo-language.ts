/**
 * Demo notebook: The Archaeology of Words
 * A student exploring how languages change, die, and leave
 * fossils in the words we use every day.
 */
import type { NotebookEntry } from '@/types/entries';

export const demoLanguageSession: NotebookEntry[] = [
  {
    type: 'echo',
    content:
      'You were surprised that *salary* comes from the Latin word for salt. You started pulling at a thread.',
  },
  {
    type: 'tutor-connection',
    content:
      'Every word you speak is an archaeological artifact. Etymology is not trivia — it is a map of human thought preserved in sound.',
    emphasisEnd: 48,
  },
  {
    type: 'prose',
    content:
      'I looked up more words after last time. *Disaster* literally means "bad star" — like, people blamed catastrophes on the stars. And *influenza* comes from "influence" because they thought the flu was caused by celestial influence. So before science, people explained everything through the sky?',
  },
  {
    type: 'tutor-marginalia',
    content:
      'You\'ve discovered something important: language is a fossil record of **belief systems**. When a culture stops believing in astrology, they don\'t replace the words — they just forget what the words originally meant. The belief dies, but the word survives.',
  },
  {
    type: 'question',
    content: 'Do languages die the same way species do? Like, is there a kind of "extinction" for words?',
  },
  {
    type: 'tutor-marginalia',
    content:
      'Yes — and the parallel is remarkably precise. A language dies when its last native speaker dies. Right now, a language goes extinct roughly **every two weeks**. Of the ~7,000 languages alive today, nearly half are endangered. Each one carries a unique way of seeing the world that cannot be reconstructed.',
  },
  {
    type: 'thinker-card',
    thinker: {
      name: 'Ferdinand de Saussure',
      dates: '1857–1913',
      gift: 'Realized that the relationship between a word and its meaning is arbitrary — there is nothing "dog-like" about the word *dog*. Language is a system of differences, not a collection of labels.',
      bridge: 'Connects to your question about why different languages have untranslatable words.',
    },
  },
  {
    type: 'concept-diagram',
    items: [
      { label: 'Sound', subLabel: 'the word itself (signifier)' },
      { label: 'Meaning', subLabel: 'what it points to (signified)' },
      { label: 'Convention', subLabel: 'social agreement' },
    ],
  },
  {
    type: 'hypothesis',
    content:
      'I think untranslatable words exist because some cultures *notice things* that others don\'t. Like the Japanese word `mono no aware` — the bittersweet awareness that everything is temporary. English speakers feel it too, we just never gave it a name.',
  },
  {
    type: 'tutor-marginalia',
    content:
      'This is the Sapir-Whorf hypothesis in embryonic form — the idea that language doesn\'t just *describe* thought, it **shapes** it. Having a word for something makes you more likely to notice it. You arrived at this through intuition; linguists spent decades arguing about it.',
  },
  {
    type: 'tutor-question',
    content:
      'If a word shapes how you think, and languages are dying at the rate of one every two weeks — what exactly is being lost? Is it just vocabulary, or is it *ways of seeing*?',
  },
  {
    type: 'silence',
    text: 'The notebook is open. The room is quiet.',
  },
  {
    type: 'prose',
    content:
      'I think it\'s ways of seeing. If a language has 15 words for different types of snow, those speakers literally *perceive* snow differently than I do. When the language dies, that perception goes with it. It\'s not like losing a dictionary — it\'s like losing a sense organ.',
  },
  {
    type: 'tutor-marginalia',
    content:
      'That is a genuinely profound analogy. "Losing a sense organ." You should remember that phrase — it may be the beginning of something important in your thinking.',
  },
  {
    type: 'bridge-suggestion',
    content:
      'Your idea about language-as-perception connects to research in **cognitive linguistics** — particularly Lera Boroditsky\'s work on how speakers of different languages perceive time, colour, and spatial relationships differently.',
  },
  {
    type: 'divider',
    label: 'reflection',
  },
];

export const demoLanguageMeta = {
  sessionNumber: 8,
  date: 'Wednesday, 19 March',
  timeOfDay: 'Morning',
  topic: 'When Languages Die',
};

export const demoLanguageNotebook = {
  title: 'The Archaeology of Words',
  description: 'What do words remember that we have forgotten? Can a language shape what you see?',
};
