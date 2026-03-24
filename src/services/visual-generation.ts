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
// Gemini best practice: narrative paragraphs describing medium, composition,
// mood. A visual palette reference image is injected by runImageAgent,
// so we focus on technique and atmosphere here, not hex codes.

const EMBER_AESTHETIC = `The drawing medium is fountain pen on aged ivory paper — fine nibs producing delicate, slightly irregular lines that feel genuinely hand-drawn. All shading is built through careful cross-hatching: parallel lines at varying densities to create depth, never solid fills or smooth gradients. The ink is warm dark brown, not pure black. The paper shows through everywhere — it breathes. Accent colours appear only where meaning demands them: a muted sage green for growth, a quiet indigo for inquiry, a warm amber for connection. These accents are applied as thin washes, never bold or saturated. No digital effects, no drop shadows, no glow, no neon, no flat vector art. The mood is the quiet warmth of a late-afternoon library — scholarly, patient, intimate. Match the exact colours shown in the style reference palette.`;

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

  const prompt = `A portrait of ${name} (${dates}) rendered as a careful fountain pen sketch on warm ivory paper.${traditionNote} The composition is head and shoulders, three-quarter view, with the subject gazing slightly to one side as if pausing mid-thought during a conversation about their life's work. The drawing technique is pure cross-hatching — no solid fills, no smooth shading. Fine parallel pen strokes at varying angles build up the volume of the face: denser hatching in the hollows of the cheeks and under the brow, lighter and more spaced lines where the light catches the forehead and bridge of the nose. The hair and clothing are suggested with looser, more gestural strokes — just enough detail to convey period and character, not a photographic likeness. The figure emerges from the paper itself with no background, no border, no frame — the warm ivory paper is visible between every line, as if the portrait was drawn quickly but with great skill in the margin of a notebook during a lecture. The overall impression should be of a thoughtful, intelligent face captured by someone who admired this person's mind. ${EMBER_AESTHETIC}`;

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
    book: `A book cover for "${title}", a work about ${topic}, rendered as a fountain pen illustration on warm ivory paper. The composition places a single centred decorative element — a symbolic illustration or ornamental motif that embodies the subject matter, drawn with fine cross-hatching and delicate pen work. Around it, a thin hand-drawn border with subtle corner flourishes evokes an old academic press edition from the nineteenth century. The illustration has the quality of a woodcut or engraving: precise parallel lines building up tone, no solid fills, no smooth gradients. If the subject suggests a particular visual — a celestial diagram for astronomy, a molecular structure for chemistry, a flowing curve for mathematics — let that shape anchor the centre. One or two accent colours at most, applied as light washes. Do not render any text, letters, or words anywhere — the title will be overlaid separately.`,
    podcast: `Square podcast artwork for "${title}", a discussion about ${topic}, drawn in fountain pen on warm ivory paper. The centrepiece is an abstract symbolic representation of the topic rendered with careful cross-hatching — think of it as a bookplate or ex libris design, geometrically structured but organically detailed. Along the bottom edge, a subtle waveform pattern in muted sage green suggests sound woven into the design. The overall feel is a hand-printed limited-edition record sleeve from a quiet independent press. Do not include any text, letters, or words.`,
    deck: `A study card cover for "${title}", about ${topic}, drawn in fountain pen on warm ivory paper. The design uses a geometric pattern that abstractly suggests the subject — repeating shapes, mathematical curves, or natural forms arranged in a structured grid. Each element is drawn with fine pen strokes and selective cross-hatching, like the decorative endpapers of a well-made cloth-bound book. The pattern should feel both decorative and meaningful, hinting at the intellectual structure of the topic. Do not include any text, letters, or words.`,
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

  const prompt = `A small visual mnemonic for the concept "${concept}" drawn in fountain pen on warm ivory paper.${contextNote} This is a single iconic image — one clear visual metaphor that makes the concept instantly memorable. Think of it as the kind of tiny, perfect doodle a brilliant professor draws in the margin while lecturing: three or four deliberate pen strokes that somehow capture the essence of the idea. The composition is centred and compact, no larger than a postage stamp in feel. Use only contour lines and selective cross-hatching — no solid fills, no colour unless the metaphor specifically demands one accent tone. The image should be immediately recognizable at a glance, like a well-designed icon but with the warmth and slight imperfection of a hand-drawn mark. Leave generous empty paper around it. Do not include any text, letters, labels, or words anywhere in the image. ${EMBER_AESTHETIC}`;

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
  const prompt = `A small explanatory sketch showing ${description}, drawn in fountain pen on warm ivory paper. Imagine a brilliant professor reaching for a napkin during office hours and drawing exactly the right diagram to make an idea click. The composition is compact and centred — this sketch lives inline within a paragraph of text, so it should be visually self-contained. If the concept is a relationship or process, show it with clean arrows connecting simple shapes, each shape drawn with two or three confident pen strokes. If it is an object or phenomenon, render it with loose but precise contour lines and selective cross-hatching only where shadow defines form. Every line should feel intentional — nothing decorative, nothing ornamental. The paper shows through generously between marks. Use accent colours only if the concept has distinct categories that need visual separation. Do not include any text, labels, numbers, or letters anywhere in the image. ${EMBER_AESTHETIC}`;

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
  const prompt = `An extremely subtle abstract texture inspired by the concept of "${topic}", rendered in faint fountain pen marks on warm ivory paper. This texture will be displayed at only three to five percent opacity as a page background, so every mark must be whisper-light — ghostly outlines, barely-there watermarks, the faintest suggestion of geometry that reveals itself only when you lean close. Imagine the natural grain of handmade paper that happens, if you squint, to suggest the shapes and structures of ${topic}: perhaps faint concentric curves, or the shadow of a lattice, or the echo of a natural pattern. The marks should be so light they feel like memory rather than drawing. The pattern should tile seamlessly at all edges with no visible seams or borders. Do not include any recognizable faces, text, specific objects, or sharp lines — only abstract atmospheric marks that create a mood of quiet intellectual warmth. ${EMBER_AESTHETIC}`;

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
