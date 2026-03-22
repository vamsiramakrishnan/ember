/**
 * Ember Visualization Component Library — embeddable in sandboxed iframes.
 *
 * The Visualiser agent generates HTML that references these components.
 * This file exports the CSS + JS as a string that gets injected into
 * the generated HTML's <head>.
 *
 * Components:
 * - <ember-card>: bordered card with title and body
 * - <ember-timeline>: horizontal or vertical timeline
 * - <ember-node>: concept node with label and sub-label
 * - <ember-carousel>: swipeable card carousel
 * - <ember-compare>: side-by-side comparison
 * - <ember-quote>: attributed quotation
 * - <ember-tree>: hierarchical tree layout
 */

export const EMBER_VIZ_STYLES = `
/* ─── Ember Design Tokens ─────────────────────────── */
:root {
  --paper: #FAF6F1; --paper-warm: #F6F1EA;
  --ink: #2C2825; --ink-soft: rgba(44,40,37,0.72);
  --ink-faint: rgba(44,40,37,0.45); --ink-ghost: rgba(44,40,37,0.2);
  --margin: #8B7355; --sage: #6B8F71; --indigo: #4A5899; --amber: #B8860B;
  --rule: rgba(44,40,37,0.12); --rule-light: rgba(44,40,37,0.06);
  --font-tutor: 'Cormorant Garamond', serif;
  --font-student: 'Crimson Pro', serif;
  --font-system: 'IBM Plex Mono', monospace;
}
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,400&family=Crimson+Pro:ital,wght@0,300;0,400;1,300;1,400&family=IBM+Plex+Mono:wght@300;400&display=swap');
body { margin: 0; padding: 24px; background: var(--paper); color: var(--ink); font-family: var(--font-student); }

/* ─── Card ────────────────────────────────────────── */
ember-card { display: block; border: 1px solid var(--rule); border-radius: 2px; padding: 20px 24px; margin: 12px 0; background: var(--paper); }
ember-card[accent="sage"] { border-top: 2px solid var(--sage); }
ember-card[accent="indigo"] { border-top: 2px solid var(--indigo); }
ember-card[accent="amber"] { border-top: 2px solid var(--amber); }
ember-card[accent="margin"] { border-top: 2px solid var(--margin); }
ember-card .card-title { font-family: var(--font-tutor); font-size: 17px; font-weight: 500; color: var(--ink); margin: 0 0 8px 0; }
ember-card .card-meta { font-family: var(--font-system); font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--ink-faint); margin-bottom: 6px; }
ember-card .card-body { font-size: 15px; line-height: 1.7; color: var(--ink-soft); margin: 0; }

/* ─── Node ────────────────────────────────────────── */
ember-node { display: inline-flex; flex-direction: column; align-items: center; padding: 12px 20px; border: 1px solid var(--rule-light); border-radius: 2px; background: var(--paper); text-align: center; }
ember-node .node-label { font-family: var(--font-tutor); font-size: 15px; font-weight: 500; color: var(--ink); }
ember-node .node-sub { font-family: var(--font-system); font-size: 10px; color: var(--ink-soft); margin-top: 4px; }

/* ─── Timeline ────────────────────────────────────── */
ember-timeline { display: flex; flex-direction: column; gap: 0; margin: 16px 0; }
ember-timeline .tl-item { display: flex; gap: 16px; align-items: flex-start; padding: 12px 0; }
ember-timeline .tl-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--margin); flex-shrink: 0; margin-top: 6px; }
ember-timeline .tl-line { width: 1px; background: var(--rule); margin-left: 3.5px; min-height: 16px; }
ember-timeline .tl-date { font-family: var(--font-system); font-size: 10px; color: var(--ink-faint); letter-spacing: 1px; min-width: 60px; }
ember-timeline .tl-content { font-family: var(--font-student); font-size: 15px; color: var(--ink-soft); line-height: 1.6; }
ember-timeline .tl-title { font-family: var(--font-tutor); font-size: 16px; font-weight: 500; color: var(--ink); }

/* ─── Carousel ────────────────────────────────────── */
ember-carousel { display: block; overflow-x: auto; -webkit-overflow-scrolling: touch; scroll-snap-type: x mandatory; padding: 8px 0; margin: 12px 0; }
ember-carousel .carousel-track { display: flex; gap: 16px; }
ember-carousel .carousel-track > * { scroll-snap-align: start; flex-shrink: 0; width: 260px; }
ember-carousel .carousel-dots { display: flex; justify-content: center; gap: 6px; margin-top: 12px; }
ember-carousel .carousel-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--ink-ghost); }
ember-carousel .carousel-dot.active { background: var(--margin); }

/* ─── Compare ─────────────────────────────────────── */
ember-compare { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--rule); margin: 16px 0; border: 1px solid var(--rule); border-radius: 2px; overflow: hidden; }
ember-compare > * { background: var(--paper); padding: 16px 20px; }
ember-compare .compare-header { font-family: var(--font-system); font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--ink-faint); padding-bottom: 4px; }
@media (max-width: 500px) { ember-compare { grid-template-columns: 1fr; } }

/* ─── Quote ───────────────────────────────────────── */
ember-quote { display: block; margin: 16px 0; padding: 16px 0 16px 20px; border-left: 2px solid var(--margin); }
ember-quote .quote-text { font-family: var(--font-tutor); font-size: 17px; font-style: italic; font-weight: 300; color: var(--ink-soft); line-height: 1.7; margin: 0; }
ember-quote .quote-attr { font-family: var(--font-system); font-size: 10px; color: var(--ink-faint); margin-top: 8px; letter-spacing: 0.5px; }

/* ─── Tree ────────────────────────────────────────── */
ember-tree { display: block; margin: 16px 0; }
ember-tree .tree-node { padding-left: 24px; border-left: 1px solid var(--rule); margin-left: 8px; }
ember-tree .tree-label { font-family: var(--font-tutor); font-size: 15px; color: var(--ink); padding: 6px 0; }
ember-tree .tree-leaf { font-family: var(--font-student); font-size: 14px; color: var(--ink-soft); padding: 4px 0 4px 24px; border-left: 1px solid var(--rule-light); margin-left: 8px; }
`;

/** Full component kit as a string to inject into visualiser HTML. */
export const EMBER_VIZ_KIT = `<style>${EMBER_VIZ_STYLES}</style>`;
