/**
 * Inline Annotations — finds specific phrases worth annotating
 * and creates span-targeted EntryAnnotations.
 *
 * Runs as a background task after tutor response.
 * Scans the last student entry + tutor response for annotatable spans.
 */
import { ANNOTATOR_AGENT } from './agents/annotator';
import { runTextAgent } from './run-agent';
import { isGeminiAvailable } from './gemini';
import { updateEntry, getEntry } from '@/persistence/repositories/entries';
import { Store, notify } from '@/persistence';
import { createId } from '@/persistence/ids';
import type { EntryAnnotation } from '@/types/entries';
import type { EntryRecord } from '@/persistence/records';

interface AnnotationResult {
  span: string;
  kind: 'trivia' | 'connection' | 'question' | 'insight';
  content: string;
}

/** Annotate an entry by finding spans worth highlighting. */
export async function annotateEntry(
  entryId: string,
  entryContent: string,
  notebookContext: string,
): Promise<number> {
  if (!isGeminiAvailable() || !entryContent.trim()) return 0;

  try {
    const result = await runTextAgent(ANNOTATOR_AGENT, [{
      role: 'user',
      parts: [{
        text: `Notebook context: ${notebookContext}\n\nEntry to annotate:\n"${entryContent}"`,
      }],
    }]);

    const parsed = parseAnnotations(result.text);
    if (parsed.length === 0) return 0;

    const entry = await getEntry(entryId);
    if (!entry) return 0;

    const existing = entry.annotations ?? [];
    const newAnnotations: EntryAnnotation[] = [];

    for (const ann of parsed) {
      const spanStart = entryContent.indexOf(ann.span);
      if (spanStart === -1) continue; // span not found in text

      newAnnotations.push({
        id: createId(),
        author: 'tutor',
        content: ann.content,
        timestamp: Date.now(),
        spanStart,
        spanEnd: spanStart + ann.span.length,
        kind: ann.kind,
      });
    }

    if (newAnnotations.length === 0) return 0;

    await updateEntry(entryId, {
      annotations: [...existing, ...newAnnotations],
    } as Partial<EntryRecord>);
    notify(Store.Entries);

    return newAnnotations.length;
  } catch {
    return 0;
  }
}

/** Run annotation on the latest student and tutor entries. */
export async function annotateRecentEntries(
  studentEntryId: string,
  studentText: string,
  tutorEntryId: string | null,
  tutorText: string,
  notebookTitle: string,
): Promise<void> {
  const ctx = `Notebook: "${notebookTitle}"`;

  // Annotate student entry and tutor entry in parallel
  const tasks: Promise<number>[] = [
    annotateEntry(studentEntryId, studentText, ctx),
  ];

  if (tutorEntryId && tutorText) {
    tasks.push(annotateEntry(tutorEntryId, tutorText, ctx));
  }

  await Promise.allSettled(tasks);
}

function parseAnnotations(text: string): AnnotationResult[] {
  try {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/) ??
                  text.match(/(\{[\s\S]*\})/);
    if (!match?.[1]) return [];
    const data = JSON.parse(match[1]) as Record<string, unknown>;
    if (!Array.isArray(data.annotations)) return [];
    return (data.annotations as Array<Record<string, unknown>>)
      .filter((a) => typeof a.span === 'string' && typeof a.content === 'string' && typeof a.kind === 'string')
      .map((a) => ({
        span: a.span as string,
        kind: a.kind as AnnotationResult['kind'],
        content: a.content as string,
      }));
  } catch {
    return [];
  }
}
