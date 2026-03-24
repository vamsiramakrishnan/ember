/**
 * Style Reference — generates a visual color palette + texture reference
 * image for the Gemini image model (Nano Banana 2).
 *
 * NB2 is much better at style adherence with a visual example than with
 * hex codes in text. This module creates an SVG palette swatch showing
 * Ember's exact token colors, cross-hatching texture, and paper tone,
 * encoded as a base64 data URI for injection as an inlineData part.
 *
 * The palette is generated once and cached for the session lifetime.
 */
import { colors } from '@/tokens/colors';


/**
 * Build an SVG that shows Ember's visual language as a reference sheet.
 * Layout: paper background, ink swatches, accent swatches, hatching sample.
 */
function buildPaletteSvg(): string {
  // 400×300 reference sheet — small enough for fast transfer,
  // large enough for the model to read the colors clearly.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <!-- Paper background -->
  <rect width="400" height="300" fill="${colors.paper}"/>

  <!-- Paper variants row -->
  <rect x="20" y="20" width="70" height="40" rx="2" fill="${colors.paperWarm}" stroke="${colors.rule}" stroke-width="1"/>
  <rect x="100" y="20" width="70" height="40" rx="2" fill="${colors.paper}" stroke="${colors.rule}" stroke-width="1"/>
  <rect x="180" y="20" width="70" height="40" rx="2" fill="${colors.paperDeep}" stroke="${colors.rule}" stroke-width="1"/>

  <!-- Ink gradient row -->
  <rect x="20" y="80" width="50" height="40" rx="2" fill="${colors.ink}"/>
  <rect x="80" y="80" width="50" height="40" rx="2" fill="${colors.inkSoft}"/>
  <rect x="140" y="80" width="50" height="40" rx="2" fill="${colors.inkFaint}"/>
  <rect x="200" y="80" width="50" height="40" rx="2" fill="${colors.inkGhost}"/>

  <!-- Accent colors — the only chromatic colors allowed -->
  <rect x="20" y="140" width="60" height="50" rx="2" fill="${colors.sage}"/>
  <rect x="90" y="140" width="60" height="50" rx="2" fill="${colors.indigo}"/>
  <rect x="160" y="140" width="60" height="50" rx="2" fill="${colors.amber}"/>
  <rect x="230" y="140" width="60" height="50" rx="2" fill="${colors.margin}"/>

  <!-- Dim accent tints (how accents appear as backgrounds) -->
  <rect x="20" y="200" width="60" height="30" rx="2" fill="${colors.sageDim}" stroke="${colors.rule}" stroke-width="1"/>
  <rect x="90" y="200" width="60" height="30" rx="2" fill="${colors.indigoDim}" stroke="${colors.rule}" stroke-width="1"/>
  <rect x="160" y="200" width="60" height="30" rx="2" fill="${colors.amberDim}" stroke="${colors.rule}" stroke-width="1"/>
  <rect x="230" y="200" width="60" height="30" rx="2" fill="${colors.marginDim}" stroke="${colors.rule}" stroke-width="1"/>

  <!-- Cross-hatching texture sample (the Ember drawing style) -->
  <rect x="310" y="20" width="70" height="100" rx="2" fill="${colors.paper}" stroke="${colors.inkFaint}" stroke-width="1"/>
  <g stroke="${colors.ink}" stroke-width="0.5" opacity="0.7">
    <!-- Primary hatch lines (45°) -->
    <line x1="315" y1="25" x2="375" y2="85"/>
    <line x1="315" y1="35" x2="375" y2="95"/>
    <line x1="315" y1="45" x2="375" y2="105"/>
    <line x1="315" y1="55" x2="375" y2="115"/>
    <line x1="315" y1="65" x2="365" y2="115"/>
    <line x1="315" y1="75" x2="355" y2="115"/>
    <line x1="325" y1="25" x2="375" y2="75"/>
    <line x1="335" y1="25" x2="375" y2="65"/>
    <line x1="345" y1="25" x2="375" y2="55"/>
    <!-- Cross-hatch lines (135°) -->
    <line x1="375" y1="25" x2="315" y2="85"/>
    <line x1="375" y1="35" x2="315" y2="95"/>
    <line x1="375" y1="45" x2="315" y2="105"/>
    <line x1="375" y1="55" x2="315" y2="115"/>
    <line x1="365" y1="25" x2="315" y2="75"/>
    <line x1="355" y1="25" x2="315" y2="65"/>
    <line x1="345" y1="25" x2="315" y2="55"/>
  </g>

  <!-- Structural rules (dividers, borders) -->
  <line x1="20" y1="248" x2="380" y2="248" stroke="${colors.rule}" stroke-width="1"/>
  <line x1="20" y1="252" x2="380" y2="252" stroke="${colors.ruleLight}" stroke-width="1"/>

  <!-- Margin rule sample (tutor's terracotta line) -->
  <line x1="310" y1="140" x2="310" y2="230" stroke="${colors.margin}" stroke-width="3" opacity="0.35"/>

  <!-- Small circles showing accent colors at small scale -->
  <circle cx="330" cy="160" r="8" fill="${colors.sage}"/>
  <circle cx="355" cy="160" r="8" fill="${colors.indigo}"/>
  <circle cx="330" cy="185" r="8" fill="${colors.amber}"/>
  <circle cx="355" cy="185" r="8" fill="${colors.margin}"/>

  <!-- Warm border around the whole sheet -->
  <rect x="0" y="0" width="400" height="300" fill="none" stroke="${colors.rule}" stroke-width="2" rx="2"/>
</svg>`;
}

/**
 * Convert SVG string to a base64 data URI suitable for Gemini inlineData.
 * Uses SVG directly (image/svg+xml) since Gemini supports it.
 */
function svgToBase64(svg: string): string {
  // Use btoa for browser environments
  return btoa(unescape(encodeURIComponent(svg)));
}

/** Cached palette data. */
let cachedData: string | null = null;

/**
 * Get the style reference palette as a base64-encoded SVG.
 * Cached after first call — zero cost on subsequent uses.
 */
export function getStyleReferenceData(): string {
  if (!cachedData) {
    cachedData = svgToBase64(buildPaletteSvg());
  }
  return cachedData;
}

/** MIME type for the style reference (SVG). */
export const STYLE_REFERENCE_MIME = 'image/svg+xml';

/**
 * Brief text description to accompany the palette reference.
 * Tells the model what it's looking at and how to use it.
 */
export const STYLE_REFERENCE_NOTE = `[STYLE REFERENCE] The image above shows the EXACT color palette and drawing style you must use. Top row: paper tones (warm ivory, never white). Second row: ink tones from darkest to lightest — use these for all line work. Third row: the ONLY four accent colors allowed (sage green, blue-grey indigo, warm amber, terracotta). Fourth row: how accents appear as subtle background tints. Right side: cross-hatching texture sample — this is how all shading should be rendered. The thin lines show structural dividers. Match these exact colors and this hand-drawn cross-hatching style.`;
