/**
 * Teaching Content Indexer — indexes flashcards, exercises, and reading
 * material as dedicated searchable documents in the File Search store.
 *
 * Previously teaching entries were only indexed inline within sessions.
 * Now they get their own documents with typed metadata, enabling the
 * tutor to search specifically for "flashcards about X" or "exercises on Y".
 */
import { uploadDocument, type MetadataEntry } from './store';
import type { NotebookEntry, ReadingSlide, Flashcard, Exercise } from '@/types/entries';
import { extractContent } from '@/services/entry-utils';

/** Index any teaching entry — dispatches by type. */
export async function indexTeachingEntry(
  storeName: string,
  notebookId: string,
  entry: NotebookEntry,
): Promise<void> {
  switch (entry.type) {
    case 'reading-material':
      return indexReadingMaterial(storeName, notebookId, entry.title, entry.slides);
    case 'flashcard-deck':
      return indexFlashcardDeck(storeName, notebookId, entry.title, entry.cards);
    case 'exercise-set':
      return indexExerciseSet(storeName, notebookId, entry.title, entry.exercises, entry.difficulty);
  }
}

async function indexReadingMaterial(
  storeName: string, notebookId: string,
  title: string, slides: ReadingSlide[],
): Promise<void> {
  const lines = slides.map((s) =>
    `## ${s.heading}\n${s.body}${s.notes ? `\n(Notes: ${s.notes})` : ''}`,
  );
  const topics = slides
    .filter((s) => s.layout !== 'title' && s.layout !== 'summary')
    .map((s) => s.heading).join(', ');

  const metadata: MetadataEntry[] = [
    { key: 'type', string_value: 'reading-material' },
    { key: 'notebookId', string_value: notebookId },
    { key: 'title', string_value: title },
    { key: 'slideCount', numeric_value: slides.length },
    { key: 'topics', string_value: topics },
    { key: 'indexedAt', numeric_value: Date.now() },
  ];

  await uploadDocument(
    storeName,
    `reading-${notebookId}-${slug(title)}`,
    `# ${title}\n\n${lines.join('\n\n')}`,
    metadata,
  );
}

async function indexFlashcardDeck(
  storeName: string, notebookId: string,
  title: string, cards: Flashcard[],
): Promise<void> {
  const lines = cards.map((c, i) =>
    `Card ${i + 1}:\nQ: ${c.front}\nA: ${c.back}${c.concept ? `\nConcept: ${c.concept}` : ''}`,
  );
  const conceptList = cards.map((c) => c.concept).filter(Boolean) as string[];
  const metadata: MetadataEntry[] = [
    { key: 'type', string_value: 'flashcard' },
    { key: 'notebookId', string_value: notebookId },
    { key: 'title', string_value: title },
    { key: 'cardCount', numeric_value: cards.length },
    { key: 'concepts', string_list_value: conceptList },
    { key: 'indexedAt', numeric_value: Date.now() },
  ];

  await uploadDocument(
    storeName,
    `flashcards-${notebookId}-${slug(title)}`,
    `# Flashcards: ${title}\n\n${lines.join('\n\n')}`,
    metadata,
  );
}

async function indexExerciseSet(
  storeName: string, notebookId: string,
  title: string, exercises: Exercise[], difficulty: string,
): Promise<void> {
  const lines = exercises.map((e, i) =>
    `Exercise ${i + 1} (${e.format}):\n${e.prompt}${e.concept ? `\nConcept: ${e.concept}` : ''}`,
  );
  const conceptList = exercises.map((e) => e.concept).filter(Boolean) as string[];
  const metadata: MetadataEntry[] = [
    { key: 'type', string_value: 'exercise' },
    { key: 'notebookId', string_value: notebookId },
    { key: 'title', string_value: title },
    { key: 'exerciseCount', numeric_value: exercises.length },
    { key: 'difficulty', string_value: difficulty },
    { key: 'concepts', string_list_value: conceptList },
    { key: 'indexedAt', numeric_value: Date.now() },
  ];

  await uploadDocument(
    storeName,
    `exercises-${notebookId}-${slug(title)}`,
    `# Exercises: ${title} (${difficulty})\n\n${lines.join('\n\n')}`,
    metadata,
  );
}

/** Re-export extractContent for session indexer use. */
export { extractContent };

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30);
}
