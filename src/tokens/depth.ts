/**
 * Ember depth tokens — physical notebook layering.
 *
 * Three-tier depth hierarchy:
 *
 * WRITTEN — text on the page. No depth. Student prose and tutor
 *   annotations live on the same surface, differentiated by ink
 *   colour and typeface, not elevation. The left rule is enough.
 *
 * PINNED — pressed into or adhered to the page. Socratic questions
 *   are worn into the page (inset, not raised). Bridge suggestions
 *   are sticky notes (small offset shadow, slight asymmetry).
 *
 * OBJECT — physical things placed on the notebook. Thinker cards
 *   are index cards (asymmetric shadow, slight tilt). Diagrams
 *   are printed card stock (clean resting shadow). Visualizations
 *   are glossy clippings (deeper shadow, thumbnail/expand).
 *
 * Shadow colour: warm brown (#2C2825), never grey.
 * Light source: reading lamp, top-left. Shadows fall bottom-right.
 */

export const depth = {
  /** Written on the page. No shadow. */
  none: 'none',

  /** Pressed into the page — a question read so many times the page
   *  is slightly worn. Inner glow, not outer shadow. */
  pressed: 'inset 0 1px 3px rgba(44, 40, 37, 0.04)',

  /** Adhered — a sticky note or clipping taped to the page.
   *  Asymmetric: heavier bottom-right (light is top-left). */
  adhered: [
    '0 1px 1px rgba(44, 40, 37, 0.04)',
    '1px 2px 6px rgba(44, 40, 37, 0.045)',
    '2px 6px 16px rgba(44, 40, 37, 0.025)',
  ].join(', '),

  /** Resting — a card or printout placed on the desk.
   *  Three-layer: contact + form + ambient. Slightly asymmetric. */
  resting: [
    '0 1px 1px rgba(44, 40, 37, 0.05)',
    '1px 3px 8px rgba(44, 40, 37, 0.04)',
    '2px 10px 24px rgba(44, 40, 37, 0.025)',
  ].join(', '),

  /** Lifted — picking up a card from the desk.
   *  Shadow spreads and softens as the object rises. */
  lifted: [
    '0 2px 3px rgba(44, 40, 37, 0.04)',
    '2px 8px 20px rgba(44, 40, 37, 0.05)',
    '4px 20px 48px rgba(44, 40, 37, 0.03)',
  ].join(', '),

  /** Floating — modal, lightbox. Held up to the lamp. */
  floating: [
    '0 4px 6px rgba(44, 40, 37, 0.04)',
    '4px 16px 32px rgba(44, 40, 37, 0.06)',
    '8px 32px 80px rgba(44, 40, 37, 0.04)',
  ].join(', '),
} as const;

/**
 * Material backgrounds — only for physical objects, not for text.
 * Text entries (marginalia, connection, reflection) get NO material.
 * Their ink colour IS their material.
 */
export const material = {
  /** No material — text written on the page. */
  page: 'transparent',

  /** Worn page — where a question has been re-read many times.
   *  Barely visible warmth, like foxing on old paper. */
  worn: 'rgba(184, 86, 79, 0.04)',

  /** Sticky note — sage-tinted, slightly translucent. */
  stickyNote: [
    'linear-gradient(170deg,',
    '  rgba(107, 143, 113, 0.08) 0%,',
    '  rgba(107, 143, 113, 0.05) 100%)',
  ].join(''),

  /** Index card — warm cream, heavier stock feel. */
  indexCard: [
    'linear-gradient(175deg,',
    '  rgba(246, 241, 234, 0.9) 0%,',
    '  rgba(237, 230, 219, 0.6) 100%)',
  ].join(''),

  /** Printed card stock — warm white, clean. */
  cardStock: [
    'linear-gradient(178deg,',
    '  rgba(249, 244, 237, 0.85) 0%,',
    '  rgba(242, 236, 227, 0.5) 100%)',
  ].join(''),

  /** Glossy clipping — slightly cooler, higher contrast surface. */
  clipping: 'rgba(246, 241, 234, 0.95)',
} as const;

export type DepthLevel = keyof typeof depth;
export type MaterialType = keyof typeof material;
