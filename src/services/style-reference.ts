/**
 * Style Reference — provides a pre-rendered color palette PNG for the
 * Gemini image model (Nano Banana 2).
 *
 * NB2 is much better at style adherence with a visual example than with
 * hex codes in text. The palette at public/style-reference.png shows
 * Ember's exact token colors, cross-hatching texture, and paper tone.
 *
 * The PNG is fetched once and cached as base64 for the session lifetime.
 * File is ~6KB — negligible overhead per image generation call.
 */

/** MIME type for the style reference. */
export const STYLE_REFERENCE_MIME = 'image/png';

/** Cached base64 data. */
let cachedData: string | null = null;
let fetchPromise: Promise<string> | null = null;

/**
 * Get the style reference palette as base64-encoded PNG.
 * Fetches from /style-reference.png on first call, cached after.
 */
export async function getStyleReferenceData(): Promise<string> {
  if (cachedData) return cachedData;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const res = await fetch('/style-reference.png');
      const blob = await res.blob();
      const buffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i] as number);
      }
      cachedData = btoa(binary);
      return cachedData;
    } catch {
      // Fallback: return a 1×1 transparent PNG so calls don't break
      cachedData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
      return cachedData;
    }
  })();

  return fetchPromise;
}

/** Text description accompanying the palette reference.
 *
 * IMPORTANT: The note explicitly tells the model this is a STYLE GUIDE to
 * learn from — not an image to reproduce, copy, or return as-is. Without
 * this distinction, image models sometimes output the palette swatch itself
 * instead of generating an original illustration in that style.
 */
export const STYLE_REFERENCE_NOTE = `[STYLE GUIDE — DO NOT REPRODUCE THIS IMAGE] The image above is a STYLE REFERENCE ONLY. Do NOT copy, reproduce, or return this image. Instead, learn the color palette and drawing technique from it, then apply that style to the illustration you create from the prompt below.

How to read the style reference:
- Top row: paper tones (warm ivory background — never stark white)
- Second row: ink tones from darkest to lightest — use these for all line work
- Third row: the ONLY four accent colors allowed (sage green, blue-grey indigo, warm amber, terracotta)
- Fourth row: how accents appear as subtle background tints at low opacity
- Right side: cross-hatching texture sample — this is how all shading should be rendered (parallel lines at varying densities, never solid fills)

You must generate an ORIGINAL illustration for the prompt that follows, drawn in this style. The output should be a complete, original artwork — not the palette swatch.`;
