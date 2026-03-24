/**
 * Visual Generation — produces portraits, covers, mnemonics, textures,
 * and inline sketches via the ILLUSTRATOR_AGENT.
 *
 * All prompts follow Gemini image generation best practices:
 * - Narrative descriptive paragraphs (not keyword lists)
 * - Specific art direction: medium, lighting, composition, mood
 * - No text/labels in images (Gemini struggles with text rendering)
 * - Aspect ratios from supported set: 1:1, 3:4, 4:3, 16:9
 *
 * All generated images share Ember's visual language: warm sepia paper,
 * fountain pen ink, minimal colour. Everything feels hand-drawn.
 *
 * Generation is fire-and-forget with caching — a portrait for "Kepler"
 * is generated once and stored as a data URL in the entity record.
 */
import { runImageAgent } from './run-agent';
import { ILLUSTRATOR_AGENT } from './agents';

// ─── Shared style direction ─────────────────────────────────
// Gemini best practice: describe a coherent scene, not a feature list.

const EMBER_AESTHETIC = `The entire image should feel like it was drawn by hand in a well-loved notebook. Use warm sepia-toned paper as the background — the colour of old ivory (#FAF6F1). All marks should be in dark brown fountain pen ink (#2C2825) with fine cross-hatching for shading. The only accent colours, used sparingly, are a muted sage green (#6B8F71), deep indigo (#6B67B2), and warm amber (#C49A3C). No gradients, no neon colours, no pure black, no pure white, no flat-design vector art. The mood is quiet, scholarly, and warm — like finding a beautiful sketch in the margin of a library book.`;

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
  const traditionNote = tradition
    ? ` They belong to the ${tradition} intellectual tradition.`
    : '';

  const prompt = `Create a portrait sketch of ${name} (${dates}).${traditionNote} Show head and shoulders in a three-quarter view, with the subject looking slightly to the side as if lost in thought. Use fine pen cross-hatching to build up the shading, with delicate lines that suggest the texture of skin and fabric. The figure should emerge naturally from the warm paper background with no hard edges — as if sketched by a careful hand during a lecture. Leave the background empty. ${EMBER_AESTHETIC}`;

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
  const variantDirection: Record<string, string> = {
    book: `Design a book cover for "${title}", a work about ${topic}. The composition should have a centred decorative element — perhaps a symbolic illustration or ornamental motif that represents the subject matter. Surround it with a thin hand-drawn border with subtle corner flourishes, like an old academic press edition. Do not render any text or letters — the title will be overlaid separately.`,
    podcast: `Design square podcast artwork for "${title}", a discussion about ${topic}. Place an abstract visual concept in the centre — a symbolic representation of the topic rendered as a careful pen illustration. Along the bottom edge, suggest a subtle waveform pattern in sage green, as if sound is woven into the design. Do not include any text or letters.`,
    deck: `Design a study card cover for "${title}", about ${topic}. Use a geometric pattern that abstractly suggests the subject — repeating shapes, mathematical curves, or natural forms arranged in a structured grid. The pattern should feel both decorative and meaningful. Do not include any text or letters.`,
  };

  const prompt = `${variantDirection[variant] ?? variantDirection.book} ${EMBER_AESTHETIC}`;
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
  const contextNote = context
    ? ` The concept appears in the context of ${context}.`
    : '';

  const prompt = `Create a small visual mnemonic for the concept "${concept}".${contextNote} This should be a single, iconic image — one clear visual metaphor that makes the concept memorable. Think of it as a tiny margin doodle that a brilliant professor would sketch while explaining an idea: simple, evocative, and immediately recognizable. Use minimal detail — just enough lines to convey the core meaning. Do not include any text, labels, or words. ${EMBER_AESTHETIC}`;

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
  const prompt = `Create a small concept sketch showing ${description}. This is an inline illustration embedded within tutor prose — imagine a professor drawing a quick diagram on a napkin during office hours to clarify a point. It should be simple and clear: monochrome ink lines on warm paper, with just enough detail to communicate the idea. If it's a diagram, use clean arrows and simple shapes. If it's an illustration, keep it to essential outlines. Do not include any text labels. ${EMBER_AESTHETIC}`;

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
  const prompt = `Create an extremely subtle abstract texture inspired by the concept of "${topic}". This texture will be displayed at only 3-5% opacity as a page background, so it must be very faint — ghostly outlines, barely-there watermark-like marks, whispered geometry that you can only see if you look closely. Think of it as the grain in old paper that happens to suggest the shapes of ${topic}. The pattern should tile seamlessly at the edges. Do not include any recognizable faces, text, or specific objects — only abstract atmospheric marks that create a mood. ${EMBER_AESTHETIC}`;

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
