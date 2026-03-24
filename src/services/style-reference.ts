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

/** Text description accompanying the palette reference. */
export const STYLE_REFERENCE_NOTE = `[STYLE REFERENCE] The image above shows the EXACT color palette and drawing style you must use. Top row: paper tones (warm ivory, never white). Second row: ink tones from darkest to lightest — use these for all line work. Third row: the ONLY four accent colors allowed (sage green, blue-grey indigo, warm amber, terracotta). Fourth row: how accents appear as subtle background tints. Right side: cross-hatching texture sample — this is how all shading should be rendered. The thin lines show structural dividers. Match these exact colors and this hand-drawn cross-hatching style.`;
