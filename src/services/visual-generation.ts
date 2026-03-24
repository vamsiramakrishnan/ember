/**
 * Visual Generation — produces portraits, covers, mnemonics, textures,
 * and inline sketches via the ILLUSTRATOR_AGENT.
 *
 * All generated images share Ember's visual language: warm sepia paper,
 * fountain pen ink, minimal colour. No neon, no gradients, no flat-design
 * vector art. Everything feels hand-drawn, as if someone sketched it in
 * the margin of a notebook.
 *
 * Generation is fire-and-forget with caching — a portrait for "Kepler"
 * is generated once and stored as a data URL in the entity record.
 */
import { runImageAgent } from './run-agent';
import { ILLUSTRATOR_AGENT } from './agents';

// ─── Shared style constraints ───────────────────────────────

const BASE_STYLE = [
  'Style: warm sepia-toned paper texture, fountain pen ink, hand-drawn.',
  'Palette: ivory (#F6F1EA), charcoal ink (#2C2825), terracotta (#B8564F), sage (#6B8F71), amber (#C49A3C).',
  'No gradients, no neon, no flat vector art, no pure black, no pure white.',
  'Feels like a sketch in the margin of a well-loved notebook.',
].join(' ');

// ─── Portrait generation ────────────────────────────────────

/**
 * Generate a historical-style portrait for a thinker.
 * Returns a data URL (base64 PNG), or null on failure.
 */
export async function generatePortrait(
  name: string,
  dates: string,
  tradition?: string,
): Promise<string | null> {
  const prompt = [
    `Portrait sketch of ${name} (${dates}).`,
    tradition ? `${tradition} tradition.` : '',
    'Head and shoulders, three-quarter view, looking slightly away.',
    'Fine pen cross-hatching for shading. Subtle warmth in the paper.',
    'No background — just the figure emerging from the page.',
    'Square format, 256x256.',
    BASE_STYLE,
  ].filter(Boolean).join(' ');

  return safeGenerate(prompt);
}

// ─── Cover art generation ───────────────────────────────────

/**
 * Generate cover art for reading material or podcast.
 * Returns a data URL, or null on failure.
 */
export async function generateCoverArt(
  title: string,
  topic: string,
  variant: 'book' | 'podcast' | 'deck' = 'book',
): Promise<string | null> {
  const layouts: Record<string, string> = {
    book: 'Book cover composition: centred title area, ornamental border, era-appropriate decorative element at top.',
    podcast: 'Square podcast artwork: abstract concept in centre, title below. Waveform motif at bottom edge.',
    deck: 'Study card cover: geometric pattern suggesting the topic, title overlaid. Clean, structured.',
  };

  const prompt = [
    `Cover artwork for "${title}".`,
    `Topic: ${topic}.`,
    layouts[variant] ?? layouts.book,
    'The title text should be legible but hand-lettered, not typeset.',
    'Square format, 512x512.',
    BASE_STYLE,
  ].join(' ');

  return safeGenerate(prompt);
}

// ─── Visual mnemonic generation ─────────────────────────────

/**
 * Generate a small visual mnemonic for a flashcard concept.
 * Returns a data URL, or null on failure.
 */
export async function generateMnemonic(
  concept: string,
  context?: string,
): Promise<string | null> {
  const prompt = [
    `Small visual mnemonic sketch for the concept: "${concept}".`,
    context ? `Context: ${context}.` : '',
    'Simple, iconic, memorable — like a margin doodle that helps you remember.',
    'One clear visual metaphor. Minimal detail. No text or labels.',
    'Square format, 128x128.',
    BASE_STYLE,
  ].filter(Boolean).join(' ');

  return safeGenerate(prompt);
}

// ─── Inline sketch generation ───────────────────────────────

/**
 * Generate a small inline sketch for embedding within tutor prose.
 * Returns a data URL, or null on failure.
 */
export async function generateInlineSketch(
  description: string,
): Promise<string | null> {
  const prompt = [
    `Small inline concept sketch: ${description}.`,
    'Monochrome ink on warm paper. Simple diagram or illustration.',
    'Like a professor drawing on a napkin during office hours.',
    'Landscape format, 320x180.',
    BASE_STYLE,
  ].join(' ');

  return safeGenerate(prompt);
}

// ─── Ambient texture generation ─────────────────────────────

/**
 * Generate a subtle ambient background texture for a session topic.
 * Returns a data URL, or null on failure.
 */
export async function generateAmbientTexture(
  topic: string,
): Promise<string | null> {
  const prompt = [
    `Abstract ambient texture inspired by "${topic}".`,
    'Extremely subtle — meant to be displayed at 3-5% opacity as a page background.',
    'Ghostly outlines, faint watermark-like marks, whispered geometry.',
    'Must tile seamlessly. No text, no faces, no recognizable objects.',
    'Just atmosphere. Like looking at old paper under a microscope.',
    'Square format, 512x512.',
    BASE_STYLE,
  ].join(' ');

  return safeGenerate(prompt);
}

// ─── Shared error handling ──────────────────────────────────

async function safeGenerate(prompt: string): Promise<string | null> {
  try {
    const result = await runImageAgent(ILLUSTRATOR_AGENT, [{
      role: 'user',
      parts: [{ text: prompt }],
    }]);
    const img = result.images[0];
    if (!img) return null;
    return `data:${img.mimeType};base64,${img.data}`;
  } catch (err) {
    console.warn('[Ember] Visual generation failed:', err);
    return null;
  }
}
