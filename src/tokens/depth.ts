/**
 * Ember depth tokens — paper-on-paper layering.
 *
 * Three-layer shadow model: every shadow is built from three
 * components that simulate real physical light:
 *   1. Contact shadow — tight, sharp, right at the edge
 *   2. Form shadow — medium diffusion, defines the shape
 *   3. Ambient shadow — large, barely-there, creates atmosphere
 *
 * Shadow colour: always warm brown (#2C2825), never grey or black.
 * Light direction: reading lamp, above and slightly right.
 *
 * Material backgrounds use subtle gradients rather than flat tints —
 * light falls from above, so the top is slightly warmer/brighter
 * than the bottom. This creates the feel of physical paper stocks
 * without looking like a UI gradient.
 */

export const depth = {
  /** Flat on the page — student prose, scratch notes.
   *  No shadow. The default. */
  flat: 'none',

  /** Barely lifted — annotation slips, hypothesis cards.
   *  Like a slip of tracing paper laid on the page. */
  inset: [
    '0 0.5px 1px rgba(44, 40, 37, 0.045)',
    '0 2px 6px rgba(44, 40, 37, 0.025)',
  ].join(', '),

  /** Resting on the page — tutor cards, diagrams, directives.
   *  Like a card or photograph placed on the notebook. */
  resting: [
    '0 0.5px 1px rgba(44, 40, 37, 0.05)',   // contact
    '0 3px 8px rgba(44, 40, 37, 0.04)',       // form
    '0 12px 28px rgba(44, 40, 37, 0.025)',    // ambient
  ].join(', '),

  /** Lifted — hovered entry, active interaction.
   *  Like picking up a card from the desk. */
  lifted: [
    '0 1px 2px rgba(44, 40, 37, 0.05)',      // contact
    '0 6px 16px rgba(44, 40, 37, 0.045)',     // form
    '0 20px 48px rgba(44, 40, 37, 0.03)',     // ambient
  ].join(', '),

  /** Floating — modal, lightbox, popover.
   *  Like holding a page up to the reading lamp. */
  floating: [
    '0 2px 4px rgba(44, 40, 37, 0.05)',
    '0 10px 24px rgba(44, 40, 37, 0.06)',
    '0 32px 80px rgba(44, 40, 37, 0.04)',
  ].join(', '),
} as const;

/**
 * Material backgrounds — subtle top-to-bottom gradients that
 * simulate light falling on different paper stocks.
 *
 * Not flat tints. The slight gradient makes the material feel
 * physical — light pools slightly at the top where the reading
 * lamp catches the edge of the paper.
 */
export const material = {
  /** Student's writing paper — the base page. */
  page: 'transparent',

  /** Tutor's annotation paper — aged parchment, warm at the top. */
  annotation: 'linear-gradient(180deg, rgba(184, 86, 79, 0.035) 0%, rgba(184, 86, 79, 0.012) 100%)',

  /** Knowledge card — library card stock, cool and even. */
  card: 'linear-gradient(180deg, rgba(44, 40, 37, 0.02) 0%, rgba(44, 40, 37, 0.008) 100%)',

  /** Suggestion / bridge — sage tissue paper, translucent. */
  suggestion: 'linear-gradient(180deg, rgba(107, 143, 113, 0.07) 0%, rgba(107, 143, 113, 0.035) 100%)',

  /** Diagram / visualization — warm cream card stock. */
  diagram: 'linear-gradient(180deg, rgba(246, 241, 234, 0.8) 0%, rgba(237, 230, 219, 0.4) 100%)',

  /** Reflection — the lightest vellum overlay. */
  vellum: 'linear-gradient(180deg, rgba(44, 40, 37, 0.015) 0%, transparent 100%)',
} as const;

export type DepthLevel = keyof typeof depth;
export type MaterialType = keyof typeof material;
