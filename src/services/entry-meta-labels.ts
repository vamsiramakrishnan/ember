/**
 * Entry Meta-Labels — async background queue that generates short titles
 * and tags for notebook entries using Gemma 3 1B IT.
 *
 * After entries are created, this queue:
 * 1. Batches unlabeled entries (debounced 2s)
 * 2. Calls Gemma with a lightweight prompt (~50 output tokens per batch)
 * 3. Extracts JSON via json-cast (Gemma has no JSON mode)
 * 4. Patches entries with title + tags metadata
 * 5. Notifies store so canvas/graph cards update reactively
 *
 * Falls back to flash-lite micro agent if Gemma fails.
 * Cost: ~20 output tokens per batch of 5. Negligible.
 */
import { isGeminiAvailable } from './gemini';
import { gemmaGenerateJson } from './gemma';
import { runTextAgent } from './run-agent';
import { micro } from './agents';
import { entryMetaLabelSchema } from './schemas';

/** Fallback: flash-lite micro agent with JSON mode (if Gemma fails). */
const LABELER_FALLBACK = micro(
  `Generate concise meta-labels for notebook entries.
For each entry, produce:
- title: 3-6 word descriptive title (not generic like "Student thought")
- tags: 1-3 single-word topic tags (lowercase, no punctuation)

Be specific and meaningful. "Kepler's harmonic ratios" not "Discussion about music".
Respond as JSON with a "labels" array matching the input IDs.`,
  entryMetaLabelSchema,
);

/** Gemma system instruction for cell tagging. */
const GEMMA_SYSTEM = `You are a notebook tagger. Given entries, output JSON:
{"labels":[{"id":"...","title":"3-6 word title","tags":["tag1","tag2"]}]}
Be specific. No generic titles. Output ONLY the JSON object.`;

export interface MetaLabel {
  title: string;
  tags: string[];
}

interface LabelResult {
  labels?: Array<{ id: string; title: string; tags: string[] }>;
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

  const labels = await generateLabels(prompt);
  applyLabels(labels);

  // If more items queued while we were processing, continue
  if (pendingQueue.length > 0) {
    debounceTimer = setTimeout(() => void processQueue(), 500);
  }
}

/** Try Gemma first, fall back to flash-lite if it fails. */
async function generateLabels(
  prompt: string,
): Promise<Array<{ id: string; title: string; tags: string[] }>> {
  // Primary: Gemma 3 1B IT (cheap, fast, no JSON mode)
  try {
    const result = await gemmaGenerateJson<LabelResult>(prompt, {
      systemInstruction: GEMMA_SYSTEM,
      maxOutputTokens: 256,
    });
    if (result?.labels && Array.isArray(result.labels)) {
      return result.labels;
    }
  } catch (err) {
    console.warn('[Ember] Gemma label generation failed, falling back:', err);
  }

  // Fallback: flash-lite with JSON mode (guaranteed structure)
  try {
    const result = await runTextAgent(LABELER_FALLBACK, [{
      role: 'user', parts: [{ text: prompt }],
    }]);
    const parsed = JSON.parse(result.text) as LabelResult;
    return parsed.labels ?? [];
  } catch (err) {
    console.error('[Ember] Meta-label generation failed:', err);
    return [];
  }
}

/** Apply parsed labels to cache and notify callback. */
function applyLabels(
  labels: Array<{ id: string; title: string; tags: string[] }>,
): void {
  for (const label of labels) {
    const meta: MetaLabel = { title: label.title, tags: label.tags ?? [] };
    labelCache.set(label.id, meta);
    labelCallback?.(label.id, meta);
  }
}
