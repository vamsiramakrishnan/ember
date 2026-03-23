/**
 * Tool Implementations — Content retrieval tools.
 *
 * Contains getEntryContent() and readFileContent(), which resolve
 * entry IDs to their full structured content or raw file data.
 * Split from tool-executor.ts for the 150-line file-size discipline.
 */
import { getEntry } from '@/persistence/repositories/entries';
import { getBlob } from '@/persistence/repositories/blobs';
import { extractContent } from './entry-utils';

/** Fetch full structured content of any entry by ID. */
export async function getEntryContent(entryId: string): Promise<string> {
  if (!entryId) return '(no entry_id provided)';

  const record = await getEntry(entryId);
  if (!record) return `Entry "${entryId}" not found.`;

  const entry = record.entry;

  // Return rich structured content based on type
  switch (entry.type) {
    case 'reading-material':
      return JSON.stringify({
        type: 'reading-material',
        title: entry.title,
        subtitle: entry.subtitle,
        slideCount: entry.slides.length,
        slides: entry.slides.map((s, i) => ({
          index: i + 1, heading: s.heading, layout: s.layout,
          body: s.body.slice(0, 300), accent: s.accent,
          ...(s.timeline ? { timeline: s.timeline } : {}),
          ...(s.tableData ? { tableData: s.tableData } : {}),
          ...(s.diagramItems ? { diagramItems: s.diagramItems } : {}),
        })),
      });
    case 'flashcard-deck':
      return JSON.stringify({
        type: 'flashcard-deck',
        title: entry.title,
        cardCount: entry.cards.length,
        cards: entry.cards.map((c, i) => ({
          index: i + 1, front: c.front, back: c.back, concept: c.concept,
        })),
      });
    case 'exercise-set':
      return JSON.stringify({
        type: 'exercise-set',
        title: entry.title,
        difficulty: entry.difficulty,
        exercises: entry.exercises.map((e, i) => ({
          index: i + 1, prompt: e.prompt, format: e.format, concept: e.concept,
          hintCount: e.hints?.length ?? 0,
        })),
      });
    case 'code-cell':
      return JSON.stringify({
        type: 'code-cell', language: entry.language,
        source: entry.source, result: entry.result,
      });
    case 'concept-diagram':
      return JSON.stringify({
        type: 'concept-diagram', title: entry.title,
        items: entry.items, edges: entry.edges,
      });
    default: {
      const content = extractContent(entry);
      return content ?? JSON.stringify({ type: entry.type, note: 'No drillable content.' });
    }
  }
}

/** Read text content from an uploaded file's blob storage. */
export async function readFileContent(entryId: string): Promise<string> {
  if (!entryId) return '(no entry_id provided)';

  const record = await getEntry(entryId);
  if (!record) return `Entry "${entryId}" not found.`;

  const entry = record.entry;

  // Code cells: return full source directly
  if (entry.type === 'code-cell') {
    return entry.source;
  }

  // File uploads and documents: try to read from blob storage
  if (entry.type === 'file-upload' || entry.type === 'document') {
    const hash = entry.file.blobHash;
    const mime = entry.file.mimeType;

    // Only read text-based files
    if (mime.startsWith('text/') || mime === 'application/json' ||
        mime === 'text/csv' || mime.includes('javascript') || mime.includes('xml')) {
      const blob = await getBlob(hash);
      if (!blob) return '(file data not found in storage)';
      try {
        const text = await blob.data.text();
        return text.slice(0, 2000);
      } catch {
        return '(could not read file as text)';
      }
    }

    // Binary files: suggest alternative tools
    if (mime.startsWith('image/')) {
      return `This is an image file (${mime}). Use read_attachment(entry_id="${entryId}") to see it visually.`;
    }
    if (mime === 'application/pdf') {
      return `This is a PDF. Use search_history(query="...", scope="notebook") to search its content — it was indexed when uploaded.`;
    }
    return `Binary file (${mime}, ${entry.file.size} bytes). Cannot read as text.`;
  }

  return '(not a file entry)';
}
