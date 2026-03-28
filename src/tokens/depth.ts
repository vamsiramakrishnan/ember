/**
 * Ember depth tokens — paper-on-paper layering.
 *
 * The metaphor: a scrapbook on a wooden desk. Different materials
 * sit at different heights — a clipping pinned over a page, a card
 * laid on top, a translucent tissue overlay. Depth is communicated
 * through warm, diffuse shadows (never sharp, never cold) and
 * subtle background tint shifts.
 *
 * Shadow colour: always warm brown, never grey or black.
 * Shadow spread: always diffuse, never tight.
 * Shadow direction: always slightly down-right (the reading lamp).
 */

/**
 * Shadow layers — each level represents a physical distance from
 * the desk surface. Colours are warm brown (#2C2825) at low opacity.
 */
export const depth = {
  /** Flat on the page — student prose, scratch notes.
   *  No shadow. The default. */
  flat: 'none',

  /** Barely lifted — tutor marginalia, connections.
   *  Like a slip of paper laid on the page. */
  inset: '0 1px 2px rgba(44, 40, 37, 0.04)',

  /** Resting on the page — tutor cards, diagrams, directives.
   *  Like a card or photograph placed on the notebook. */
  resting: '0 1px 3px rgba(44, 40, 37, 0.06), 0 4px 12px rgba(44, 40, 37, 0.04)',

  /** Lifted — hovered entry, active interaction.
   *  Like picking up a card from the desk. */
  lifted: '0 2px 4px rgba(44, 40, 37, 0.06), 0 8px 24px rgba(44, 40, 37, 0.06)',

  /** Floating — modal, lightbox, popover.
   *  Like holding a page up to the reading lamp. */
  floating: '0 4px 8px rgba(44, 40, 37, 0.06), 0 12px 40px rgba(44, 40, 37, 0.08)',
} as const;

/**
 * Background tints — each material type has a subtly different warmth,
 * like different paper stocks in a scrapbook.
 */
export const material = {
  /** Student's writing paper — the base page. */
  page: 'transparent',

  /** Tutor's annotation paper — slightly warmer, like aged parchment. */
  annotation: 'rgba(184, 86, 79, 0.02)',

  /** Knowledge card — slightly cooler, like a library card. */
  card: 'rgba(44, 40, 37, 0.015)',

  /** Suggestion / bridge — sage-tinted tissue paper. */
  suggestion: 'rgba(107, 143, 113, 0.06)',

  /** Diagram / visualization — warm cream card stock. */
  diagram: 'rgba(196, 154, 60, 0.03)',

  /** Reflection — the lightest vellum overlay. */
  vellum: 'rgba(44, 40, 37, 0.01)',
} as const;

export type DepthLevel = keyof typeof depth;
export type MaterialType = keyof typeof material;
