/**
 * Entry Meta-Labels — async background queue that generates short titles
 * and tags for notebook entries using Gemini flash-lite.
 *
 * After entries are created, this queue:
 * 1. Batches unlabeled entries (debounced 2s)
 * 2. Calls flash-lite with ~30 output tokens per entry
 * 3. Patches entries with title + tags metadata
 * 4. Notifies store so canvas/graph cards update reactively
 *
 * Cost: ~150 output tokens per batch of 5. Negligible.
 */
import { isGeminiAvailable } from './gemini';
import { runTextAgent } from './run-agent';
import { micro } from './agents';
import { entryMetaLabelSchema } from './schemas';

const LABELER = micro(
  `Generate concise meta-labels for notebook entries.
For each entry, produce:
- title: 3-6 word descriptive title (not generic like "Student thought")
- tags: 1-3 single-word topic tags (lowercase, no punctuation)

Be specific and meaningful. "Kepler's harmonic ratios" not "Discussion about music".
Respond as JSON with a "labels" array matching the input IDs.`,
  entryMetaLabelSchema,
);

export interface MetaLabel {
  title: string;
  tags: string[];
}

type LabelCallback = (id: string, label: MetaLabel) => void;

/** In-memory cache of generated labels. */
const labelCache = new Map<string, MetaLabel>();

/** Pending entries waiting to be labeled. */
const pendingQueue: Array<{ id: string; content: string }> = [];
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let labelCallback: LabelCallback | null = null;

/** Register a callback that fires when labels are generated. */
export function onLabelsGenerated(cb: LabelCallback): () => void {
  labelCallback = cb;
  return () => { if (labelCallback === cb) labelCallback = null; };
}

/** Get a cached label, or null if not yet generated. */
export function getCachedLabel(entryId: string): MetaLabel | null {
  return labelCache.get(entryId) ?? null;
}

/** Enqueue an entry for labeling. Debounces and batches. */
export function enqueueForLabeling(entryId: string, content: string): void {
  if (labelCache.has(entryId)) return;
  if (pendingQueue.some((p) => p.id === entryId)) return;
  if (!content.trim() || content.length < 10) return;

  pendingQueue.push({ id: entryId, content: content.slice(0, 200) });

  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => void processQueue(), 2000);
}

/** Process all pending entries in a single batch call. */
async function processQueue(): Promise<void> {
  if (pendingQueue.length === 0 || !isGeminiAvailable()) return;

  // Take up to 5 entries per batch
  const batch = pendingQueue.splice(0, 5);

  const prompt = batch
    .map((e, i) => `${i + 1}. [id: ${e.id}] "${e.content}"`)
    .join('\n');

  try {
    const result = await runTextAgent(LABELER, [{
      role: 'user', parts: [{ text: prompt }],
    }]);

    const parsed = JSON.parse(result.text) as { labels?: Array<{ id: string; title: string; tags: string[] }> };
    const labels = parsed.labels ?? [];

    for (const label of labels) {
      const meta: MetaLabel = { title: label.title, tags: label.tags ?? [] };
      labelCache.set(label.id, meta);
      labelCallback?.(label.id, meta);
    }
  } catch (err) {
    console.error('[Ember] Meta-label generation failed:', err);
  }

  // If more items queued while we were processing, continue
  if (pendingQueue.length > 0) {
    debounceTimer = setTimeout(() => void processQueue(), 500);
  }
}
