/**
 * Podcast Generation — creates NotebookLM-style audio discussions.
 *
 * Architecture:
 * 1. Generate a multi-segment dialogue script (~1000 words, 5 parts)
 * 2. Stream-synthesize segment 1 → start playback immediately
 * 3. Background-synthesize segments 2-5 while user listens
 * 4. Segments are stitched into a sequential playlist
 *
 * Uses generateContentStream on the server for incremental audio delivery
 * (avoids Edge Function 25s initial-response timeout).
 */
import { micro } from './agents';
import { runTextAgent } from './run-agent';
import { recentContext } from './entry-utils';
import { synthesizeSegment } from './tts-synthesize';
import type { NotebookEntry, LiveEntry } from '@/types/entries';

/** Number of dialogue segments. Each ~200 words ≈ 60-90s audio. */
const SEGMENT_COUNT = 5;

/** Generate a podcast. Returns the entry once segment 1 is ready. */
export async function generatePodcast(
  topic: string,
  entries: LiveEntry[],
  onSegmentReady?: (index: number, url: string) => void,
): Promise<NotebookEntry | null> {
  try {
    const context = recentContext(entries, 6, 500);
    const scripts = await generateScripts(topic, context);
    if (!scripts.length) {
      return errorEntry('Could not generate dialogue script. Try again.');
    }

    const seg1Url = await synthesizeSegment(scripts[0]!, topic);
    const transcript = scripts.join('\n\n');

    if (!seg1Url) {
      return { type: 'podcast', topic, audioUrl: '', transcript };
    }

    // Remaining segments synthesize in background while user listens
    if (scripts.length > 1) {
      void synthesizeRemaining(scripts.slice(1), topic, onSegmentReady);
    }

    return { type: 'podcast', topic, audioUrl: seg1Url, transcript };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Ember] Podcast generation failed:', err);
    return errorEntry(`Podcast generation failed: ${msg}`);
  }
}

// ─── Script generation ───────────────────────────────────────────

async function generateScripts(
  topic: string, context: string,
): Promise<string[]> {
  const agent = micro(SCRIPT_SYSTEM);
  const result = await runTextAgent(agent, [{
    role: 'user',
    parts: [{ text: scriptPrompt(topic, context) }],
  }]);

  const text = result.text.trim()
    .replace(/^```\w*\s*/i, '').replace(/```\s*$/i, '').trim();
  if (!text || text.length < 80) return [];

  const segments = text.split(/\[Part \d+\]\s*/i).filter((s) => s.trim());
  return segments.length > 0 ? segments : [text];
}

// ─── Background synthesis ────────────────────────────────────────

async function synthesizeRemaining(
  scripts: string[], topic: string,
  onReady?: (index: number, url: string) => void,
): Promise<void> {
  for (let i = 0; i < scripts.length; i++) {
    try {
      const url = await synthesizeSegment(scripts[i]!, topic);
      if (url) onReady?.(i + 1, url);
    } catch (err) {
      console.warn(`[Ember] Segment ${i + 2} failed:`, err);
    }
  }
}

// ─── Helpers & prompts ───────────────────────────────────────────

function errorEntry(message: string): NotebookEntry {
  return { type: 'tutor-marginalia', content: message };
}

const SCRIPT_SYSTEM = `You write podcast dialogue scripts. Output ONLY dialogue lines. Format: "Speaker: text". Two speakers: "Tutor" and "Student". Write ${SEGMENT_COUNT} parts of ~200 words each, labeled [Part 1] through [Part ${SEGMENT_COUNT}]. Each part is self-contained but builds on the previous. Total ~1000 words.`;

function scriptPrompt(topic: string, context: string): string {
  return `Write a ${SEGMENT_COUNT}-part podcast dialogue (~1000 words total) about: ${topic}

Label each: [Part 1], [Part 2], ... [Part ${SEGMENT_COUNT}]
Each part: ~200 words. Format: Tutor: / Student:

Narrative arc:
- Part 1: Hook — introduce the topic with a surprising angle
- Part 2: Foundations — build the core concepts
- Part 3: Depth — explore nuance, tensions, or counterexamples
- Part 4: Connections — link to broader ideas or other fields
- Part 5: Open end — synthesis + a genuinely provocative question

Style: Warm, curious, intellectually rigorous. Natural reactions.${context ? `\nContext:\n${context}` : ''}`;
}
