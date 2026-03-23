/**
 * entity-decompose — extracts referenceable entities from live
 * notebook entries for the @ mention index.
 *
 * Extracted from useEntityIndex to enforce the 150-line file limit.
 */
import type { LiveEntry } from '@/types/entries';
import type { Entity } from './entity-types';

/** Extract referenceable entities from live notebook entries. */
export function decomposeEntries(entries: LiveEntry[], notebookId: string): Entity[] {
  const result: Entity[] = [];

  for (const le of entries) {
    const e = le.entry;

    switch (e.type) {
      case 'prose':
        result.push({ id: le.id, type: 'entry', notebookId, name: e.content.slice(0, 60).replace(/\n/g, ' '), detail: 'student note', meta: 'prose' });
        break;
      case 'hypothesis':
        result.push({ id: le.id, type: 'entry', notebookId, name: e.content.slice(0, 60).replace(/\n/g, ' '), detail: 'student hypothesis', meta: 'hypothesis' });
        break;
      case 'question':
        result.push({ id: le.id, type: 'entry', notebookId, name: e.content.slice(0, 60).replace(/\n/g, ' '), detail: 'student question', meta: 'question' });
        break;
      case 'tutor-marginalia':
      case 'tutor-question':
      case 'tutor-connection':
        result.push({ id: le.id, type: 'tutor-note', notebookId, name: e.content.slice(0, 60).replace(/\n/g, ' '), detail: e.type.replace('tutor-', ''), meta: e.type.replace('tutor-', '') });
        break;
      case 'reading-material':
        result.push({ id: le.id, type: 'entry', notebookId, name: e.title, detail: `${e.slides.length} slides`, meta: 'reading' });
        for (let i = 0; i < e.slides.length; i++) {
          result.push({ id: `${le.id}:slide:${i}`, type: 'slide', notebookId, name: e.slides[i]!.heading, detail: e.slides[i]!.body.slice(0, 50), meta: `slide ${i + 1} of ${e.slides.length}`, parentId: le.id });
        }
        break;
      case 'flashcard-deck':
        result.push({ id: le.id, type: 'entry', notebookId, name: e.title, detail: `${e.cards.length} cards`, meta: 'deck' });
        for (let i = 0; i < e.cards.length; i++) {
          result.push({ id: `${le.id}:card:${i}`, type: 'card', notebookId, name: e.cards[i]!.front.slice(0, 60), detail: e.cards[i]!.concept ?? '', meta: `card ${i + 1}`, parentId: le.id });
        }
        break;
      case 'exercise-set':
        result.push({ id: le.id, type: 'entry', notebookId, name: e.title, detail: `${e.exercises.length} exercises`, meta: e.difficulty });
        for (let i = 0; i < e.exercises.length; i++) {
          result.push({ id: `${le.id}:exercise:${i}`, type: 'exercise', notebookId, name: e.exercises[i]!.prompt.slice(0, 60), detail: e.exercises[i]!.concept ?? '', meta: `#${i + 1} · ${e.exercises[i]!.format}`, parentId: le.id });
        }
        break;
      case 'code-cell':
        result.push({ id: le.id, type: 'code', notebookId, name: e.source.split('\n')[0]?.slice(0, 60) ?? 'code', detail: e.language, meta: e.language });
        break;
      case 'concept-diagram':
        result.push({ id: le.id, type: 'diagram', notebookId, name: e.title ?? e.items.map((n) => n.label).join(', '), detail: `${e.items.length} nodes`, meta: 'diagram' });
        break;
      case 'image':
        result.push({ id: le.id, type: 'image', notebookId, name: e.alt ?? e.caption ?? 'image', detail: e.caption ?? '', meta: 'image' });
        break;
      case 'file-upload':
        result.push({ id: le.id, type: 'file', notebookId, name: e.file.name, detail: e.file.mimeType, meta: e.file.name.split('.').pop() ?? 'file' });
        break;
      case 'document':
        result.push({ id: le.id, type: 'file', notebookId, name: e.file.name, detail: `${e.pages ?? '?'} pages`, meta: 'pdf' });
        break;
      case 'thinker-card':
        result.push({ id: le.id, type: 'entry', notebookId, name: e.thinker.name, detail: e.thinker.gift, meta: 'thinker' });
        break;
    }
  }

  return result;
}
