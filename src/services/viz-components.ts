/**
 * Ember Visualization Component Library — embeddable in sandboxed iframes.
 *
 * The Visualiser agent generates HTML that references these components.
 * This file exports the CSS + JS as a string that gets injected into
 * the generated HTML's <head>.
 *
 * Components:
 * - <ember-card>: bordered card with hover lift and optional accent
 * - <ember-timeline>: vertical timeline with animated reveals
 * - <ember-node>: concept node with label and sub-label
 * - <ember-carousel>: swipeable card carousel with scroll indicators
 * - <ember-compare>: side-by-side comparison grid
 * - <ember-quote>: attributed quotation
 * - <ember-tree>: hierarchical tree layout
 * - <ember-tabs>: tabbed content panels
 * - <ember-accordion>: expandable/collapsible sections
 * - <ember-tooltip>: hover tooltip on any element
 * - <ember-meter>: proportional bar visualization
 * - <ember-reveal>: click-to-reveal hidden content
 * - <ember-grid>: responsive card grid
 */

export const EMBER_VIZ_STYLES = `
/* ─── Ember Design Tokens ─────────────────────────── */
:root {
  --paper: #FAF6F1; --paper-warm: #F6F1EA; --paper-deep: #EDE6DB;
  --ink: #2C2825; --ink-soft: rgba(44,40,37,0.72);
  --ink-faint: rgba(44,40,37,0.45); --ink-ghost: rgba(44,40,37,0.2);
  --margin: #8B7355; --sage: #6B8F71; --indigo: #4A5899; --amber: #B8860B;
  --sage-dim: rgba(107,143,113,0.10); --indigo-dim: rgba(74,88,153,0.08);
  --amber-dim: rgba(184,134,11,0.08); --margin-dim: rgba(139,115,85,0.07);
  --rule: rgba(44,40,37,0.12); --rule-light: rgba(44,40,37,0.06);
  --font-tutor: 'Cormorant Garamond', serif;
  --font-student: 'Crimson Pro', serif;
  --font-system: 'IBM Plex Mono', monospace;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,400&family=Crimson+Pro:ital,wght@0,300;0,400;1,300;1,400&family=IBM+Plex+Mono:wght@300;400&display=swap');

/* ─── Base ────────────────────────────────────────── */
body { margin: 0; padding: 20px; background: var(--paper); color: var(--ink); font-family: var(--font-student); line-height: 1.7; }
h1, h2, h3 { font-family: var(--font-tutor); font-weight: 400; margin: 0 0 12px 0; letter-spacing: -0.2px; }
h1 { font-size: 24px; font-weight: 300; }
h2 { font-size: 19px; }
h3 { font-size: 16px; font-weight: 500; }
p { margin: 0 0 12px 0; font-size: 15px; color: var(--ink-soft); }
a { color: var(--margin); text-decoration: none; border-bottom: 1px solid var(--rule); }
a:hover { border-bottom-color: var(--margin); }
* { box-sizing: border-box; }

/* ─── Staggered Reveal Animation ──────────────────── */
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.reveal { animation: fadeSlideUp 0.5s var(--ease-out) both; }
.reveal:nth-child(1) { animation-delay: 0.05s; }
.reveal:nth-child(2) { animation-delay: 0.12s; }
.reveal:nth-child(3) { animation-delay: 0.19s; }
.reveal:nth-child(4) { animation-delay: 0.26s; }
.reveal:nth-child(5) { animation-delay: 0.33s; }
.reveal:nth-child(6) { animation-delay: 0.40s; }
.reveal:nth-child(7) { animation-delay: 0.47s; }
.reveal:nth-child(8) { animation-delay: 0.54s; }

/* ─── Card ────────────────────────────────────────── */
ember-card { display: block; border: 1px solid var(--rule); border-radius: 2px; padding: 20px 24px; margin: 10px 0; background: var(--paper); transition: border-color 0.25s ease, transform 0.25s var(--ease-out); }
ember-card:hover { border-color: var(--ink-ghost); transform: translateY(-1px); }
ember-card[accent="sage"] { border-top: 2px solid var(--sage); }
ember-card[accent="indigo"] { border-top: 2px solid var(--indigo); }
ember-card[accent="amber"] { border-top: 2px solid var(--amber); }
ember-card[accent="margin"] { border-top: 2px solid var(--margin); }
ember-card[accent="sage"]:hover { background: var(--sage-dim); }
ember-card[accent="indigo"]:hover { background: var(--indigo-dim); }
ember-card[accent="amber"]:hover { background: var(--amber-dim); }
ember-card[accent="margin"]:hover { background: var(--margin-dim); }
ember-card .card-title { font-family: var(--font-tutor); font-size: 17px; font-weight: 500; color: var(--ink); margin: 0 0 6px 0; }
ember-card .card-meta { font-family: var(--font-system); font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--ink-faint); margin-bottom: 6px; }
ember-card .card-body { font-size: 15px; line-height: 1.7; color: var(--ink-soft); margin: 0; }
ember-card .card-footer { font-family: var(--font-system); font-size: 10px; color: var(--ink-faint); margin-top: 12px; letter-spacing: 0.5px; border-top: 1px solid var(--rule-light); padding-top: 10px; }

/* ─── Node ────────────────────────────────────────── */
ember-node { display: inline-flex; flex-direction: column; align-items: center; padding: 12px 20px; border: 1px solid var(--rule-light); border-radius: 2px; background: var(--paper); text-align: center; transition: border-color 0.2s ease; }
ember-node:hover { border-color: var(--ink-ghost); }
ember-node .node-label { font-family: var(--font-tutor); font-size: 15px; font-weight: 500; color: var(--ink); }
ember-node .node-sub { font-family: var(--font-system); font-size: 10px; color: var(--ink-soft); margin-top: 4px; }

/* ─── Timeline ────────────────────────────────────── */
ember-timeline { display: flex; flex-direction: column; gap: 0; margin: 16px 0; }
ember-timeline .tl-item { display: flex; gap: 16px; align-items: flex-start; padding: 14px 0; cursor: default; transition: background 0.2s ease; border-radius: 2px; padding-left: 4px; margin-left: -4px; }
ember-timeline .tl-item:hover { background: var(--margin-dim); }
ember-timeline .tl-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--margin); flex-shrink: 0; margin-top: 6px; transition: transform 0.2s ease; }
ember-timeline .tl-item:hover .tl-dot { transform: scale(1.4); }
ember-timeline .tl-line { width: 1px; background: var(--rule); margin-left: 3.5px; min-height: 12px; }
ember-timeline .tl-date { font-family: var(--font-system); font-size: 10px; color: var(--ink-faint); letter-spacing: 1px; min-width: 60px; }
ember-timeline .tl-content { font-family: var(--font-student); font-size: 15px; color: var(--ink-soft); line-height: 1.6; }
ember-timeline .tl-title { font-family: var(--font-tutor); font-size: 16px; font-weight: 500; color: var(--ink); margin-bottom: 2px; }

/* ─── Carousel ────────────────────────────────────── */
ember-carousel { display: block; overflow-x: auto; -webkit-overflow-scrolling: touch; scroll-snap-type: x mandatory; padding: 8px 0; margin: 12px 0; scrollbar-width: none; }
ember-carousel::-webkit-scrollbar { display: none; }
ember-carousel .carousel-track { display: flex; gap: 16px; padding: 4px 0; }
ember-carousel .carousel-track > * { scroll-snap-align: start; flex-shrink: 0; width: 280px; }
ember-carousel .carousel-hint { font-family: var(--font-system); font-size: 9px; color: var(--ink-ghost); letter-spacing: 1px; text-align: right; margin-top: 8px; }

/* ─── Compare ─────────────────────────────────────── */
ember-compare { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--rule); margin: 16px 0; border: 1px solid var(--rule); border-radius: 2px; overflow: hidden; }
ember-compare > * { background: var(--paper); padding: 16px 20px; transition: background 0.2s ease; }
ember-compare > *:hover { background: var(--paper-warm); }
ember-compare .compare-header { font-family: var(--font-system); font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--ink-faint); padding-bottom: 4px; }
@media (max-width: 500px) { ember-compare { grid-template-columns: 1fr; } }

/* ─── Quote ───────────────────────────────────────── */
ember-quote { display: block; margin: 16px 0; padding: 16px 0 16px 20px; border-left: 2px solid var(--margin); transition: border-left-width 0.15s ease; }
ember-quote:hover { border-left-width: 3px; }
ember-quote .quote-text { font-family: var(--font-tutor); font-size: 17px; font-style: italic; font-weight: 300; color: var(--ink-soft); line-height: 1.7; margin: 0; }
ember-quote .quote-attr { font-family: var(--font-system); font-size: 10px; color: var(--ink-faint); margin-top: 8px; letter-spacing: 0.5px; }

/* ─── Tree ────────────────────────────────────────── */
ember-tree { display: block; margin: 16px 0; }
ember-tree .tree-node { padding-left: 24px; border-left: 1px solid var(--rule); margin-left: 8px; transition: border-left-color 0.2s ease; }
ember-tree .tree-node:hover { border-left-color: var(--ink-ghost); }
ember-tree .tree-label { font-family: var(--font-tutor); font-size: 15px; color: var(--ink); padding: 6px 0; cursor: default; }
ember-tree .tree-leaf { font-family: var(--font-student); font-size: 14px; color: var(--ink-soft); padding: 4px 0 4px 24px; border-left: 1px solid var(--rule-light); margin-left: 8px; }

/* ─── Tabs (NEW) ──────────────────────────────────── */
ember-tabs { display: block; margin: 16px 0; }
ember-tabs .tab-bar { display: flex; gap: 0; border-bottom: 1px solid var(--rule); margin-bottom: 16px; }
ember-tabs .tab-btn { font-family: var(--font-system); font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--ink-faint); background: none; border: none; border-bottom: 2px solid transparent; padding: 8px 16px; cursor: pointer; transition: color 0.2s ease, border-color 0.2s ease; }
ember-tabs .tab-btn:hover { color: var(--ink-soft); }
ember-tabs .tab-btn.active { color: var(--margin); border-bottom-color: var(--margin); }
ember-tabs .tab-panel { display: none; animation: fadeSlideUp 0.3s var(--ease-out); }
ember-tabs .tab-panel.active { display: block; }

/* ─── Accordion (NEW) ─────────────────────────────── */
ember-accordion { display: block; margin: 12px 0; }
ember-accordion .acc-item { border-bottom: 1px solid var(--rule-light); }
ember-accordion .acc-trigger { display: flex; justify-content: space-between; align-items: center; width: 100%; background: none; border: none; padding: 14px 0; cursor: pointer; font-family: var(--font-tutor); font-size: 16px; font-weight: 500; color: var(--ink); text-align: left; transition: color 0.2s ease; }
ember-accordion .acc-trigger:hover { color: var(--margin); }
ember-accordion .acc-icon { font-size: 14px; color: var(--ink-faint); transition: transform 0.25s var(--ease-out); }
ember-accordion .acc-item.open .acc-icon { transform: rotate(180deg); }
ember-accordion .acc-body { overflow: hidden; max-height: 0; transition: max-height 0.35s var(--ease-out); }
ember-accordion .acc-item.open .acc-body { max-height: 600px; }
ember-accordion .acc-content { padding: 0 0 16px 0; font-size: 15px; color: var(--ink-soft); line-height: 1.7; }

/* ─── Tooltip (NEW) ───────────────────────────────── */
[data-tip] { position: relative; cursor: help; border-bottom: 1px dotted var(--ink-ghost); }
[data-tip]::after { content: attr(data-tip); position: absolute; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%) translateY(4px); background: var(--ink); color: var(--paper); font-family: var(--font-system); font-size: 11px; padding: 6px 10px; border-radius: 2px; white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity 0.2s ease, transform 0.2s ease; z-index: 10; max-width: 240px; white-space: normal; line-height: 1.4; }
[data-tip]:hover::after { opacity: 1; transform: translateX(-50%) translateY(0); }

/* ─── Meter / Bar (NEW) ───────────────────────────── */
ember-meter { display: flex; align-items: center; gap: 12px; margin: 8px 0; }
ember-meter .meter-label { font-family: var(--font-system); font-size: 10px; color: var(--ink-faint); letter-spacing: 0.5px; min-width: 80px; text-align: right; }
ember-meter .meter-track { flex: 1; height: 4px; background: var(--rule-light); border-radius: 2px; overflow: hidden; }
ember-meter .meter-fill { height: 100%; border-radius: 2px; transition: width 0.8s var(--ease-out); }
ember-meter .meter-fill[data-color="sage"] { background: var(--sage); }
ember-meter .meter-fill[data-color="indigo"] { background: var(--indigo); }
ember-meter .meter-fill[data-color="amber"] { background: var(--amber); }
ember-meter .meter-fill[data-color="margin"] { background: var(--margin); }
ember-meter .meter-value { font-family: var(--font-system); font-size: 10px; color: var(--ink-faint); min-width: 30px; }

/* ─── Reveal (NEW) ────────────────────────────────── */
ember-reveal { display: block; margin: 12px 0; }
ember-reveal .reveal-trigger { font-family: var(--font-system); font-size: 10px; letter-spacing: 1px; text-transform: uppercase; color: var(--margin); background: none; border: 1px solid var(--rule); border-radius: 2px; padding: 6px 14px; cursor: pointer; transition: background 0.2s ease, border-color 0.2s ease; }
ember-reveal .reveal-trigger:hover { background: var(--margin-dim); border-color: var(--ink-ghost); }
ember-reveal .reveal-content { display: none; margin-top: 12px; animation: fadeSlideUp 0.3s var(--ease-out); }
ember-reveal.open .reveal-content { display: block; }
ember-reveal.open .reveal-trigger { color: var(--ink-faint); }

/* ─── Grid (NEW) ──────────────────────────────────── */
ember-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin: 16px 0; }
ember-grid[cols="2"] { grid-template-columns: repeat(2, 1fr); }
ember-grid[cols="3"] { grid-template-columns: repeat(3, 1fr); }
@media (max-width: 500px) { ember-grid, ember-grid[cols="2"], ember-grid[cols="3"] { grid-template-columns: 1fr; } }

/* ─── Section Heading ─────────────────────────────── */
.section-label { font-family: var(--font-system); font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: var(--ink-faint); margin: 24px 0 12px 0; }

/* ─── Reduced Motion ──────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition-duration: 0.01ms !important; }
}
`;

/** Interactive JS for tabs, accordions, reveals — injected into visualisations. */
export const EMBER_VIZ_JS = `
<script>
// Tabs
document.querySelectorAll('ember-tabs').forEach(tabs => {
  const btns = tabs.querySelectorAll('.tab-btn');
  const panels = tabs.querySelectorAll('.tab-panel');
  if (btns.length && panels.length) {
    btns[0].classList.add('active');
    panels[0].classList.add('active');
  }
  btns.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      if (panels[i]) panels[i].classList.add('active');
    });
  });
});

// Accordions
document.querySelectorAll('ember-accordion .acc-trigger').forEach(trigger => {
  trigger.addEventListener('click', () => {
    const item = trigger.closest('.acc-item');
    if (item) item.classList.toggle('open');
  });
});

// Reveals
document.querySelectorAll('ember-reveal .reveal-trigger').forEach(btn => {
  btn.addEventListener('click', () => {
    const reveal = btn.closest('ember-reveal');
    if (reveal) reveal.classList.toggle('open');
    btn.textContent = reveal?.classList.contains('open') ? 'Hide' : btn.dataset.label || 'Show more';
  });
});

// Staggered reveal on scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('reveal'); observer.unobserve(e.target); }});
}, { threshold: 0.1 });
document.querySelectorAll('.animate-in').forEach(el => observer.observe(el));
</script>`;

/** Full component kit as a string to inject into visualiser HTML. */
export const EMBER_VIZ_KIT = `<style>${EMBER_VIZ_STYLES}</style>${EMBER_VIZ_JS}`;
