# Ember — Interactive Controls: Philosophy & Tokens

## Why this document exists

The component inventory (06) specifies every *content* element in Ember — prose entries, marginalia, concept diagrams, thinker cards. These are the things that live on the page. But a notebook also has tools: a pen, a bookmark ribbon, a finger flipping through pages, a fold. These are the interactive controls — the elements through which the student initiates action.

This document and its companions (08a–08g) specify every interactive control in Ember. They are the missing layer between the design philosophy and a buildable product.

---

## The governing principle

**A control should feel like a notation in a margin, not like a button on a screen.**

Controls in Ember are servants. They exist to let the student do something, then they disappear. They never draw attention to themselves. They never celebrate being clicked. They are the quiet mechanisms of the notebook — the clasp, the ribbon, the turned corner — not the content.

The notebook metaphor extends to controls:
- A **pen** is a control (the input zone)
- A **bookmark ribbon** is a control (the pin action)
- A **page turn** is a control (the tab navigation)
- A **fold** is a control (the canvas collapse)

None of them look like "buttons" in the tech-product sense.

---

## What the prototypes got wrong

The HTML prototypes (screen-1 through screen-9) diverge from the spec's philosophy in their interactive controls. The following patterns must NOT be carried forward:

- **Material Design color system.** The prototypes use `surface-container`, `on-primary`, `secondary-container` — a tech palette. Use only Ember's own tokens from `02-visual-language.md`.
- **Box shadows and elevation.** Prototypes use `shadow-lg`, `shadow-2xl`. Ember forbids all shadows deeper than `0 1px 3px rgba(0,0,0,0.04)`.
- **Circular avatars.** Ember's radius is 2px everywhere. No circles.
- **Filled icons on active state.** Ember icons are always outlined (`wght` 300, `FILL` 0). Active state changes opacity, not fill.
- **Hover-lift effects** (`translateY(-4px)`). Ember elements do not float. Hover is indicated through ink color change only.
- **The 6-item sidebar navigation.** The spec says three surfaces. The sidebar is a prototype invention, not part of the spec.

Where the prototypes *are* useful: they reveal which controls are needed and approximate their placement. The visual treatment must be re-derived from the spec.

---

## New tokens: Interactive states

The token system in `02-visual-language.md` covers color, typography, spacing, and motion for content. The following tokens extend it to interactive states. All values derive from existing Ember colors — no new hues are introduced.

### State color tokens

Interactive states in Ember feel like changes in ink pressure on paper. Hover darkens the ink slightly. Press brings it to full weight. Focus uses `indigo` because focus is an inquiry state — the interface is asking "is this what you want?"

| Token | Value | Usage |
|---|---|---|
| `hover-overlay` | `rgba(44,40,37, 0.04)` | Background tint on hover for any interactive element |
| `press-overlay` | `rgba(44,40,37, 0.08)` | Background tint on press/active |
| `focus-ring` | `rgba(91,107,138, 0.40)` | Focus indicator outline (indigo at 40%) |
| `disabled-opacity` | `0.38` | Opacity multiplier for all disabled elements |

### State spacing tokens

| Token | Value | Usage |
|---|---|---|
| `control-height-sm` | `28px` | Icon buttons, compact controls |
| `control-height-md` | `36px` | Default buttons, inputs |
| `control-height-lg` | `44px` | Primary actions, touch targets |
| `control-padding-x` | `16px` | Default horizontal padding inside controls |
| `control-gap` | `8px` | Space between icon and label in a button |
| `focus-ring-width` | `1.5px` | Width of focus outline |
| `focus-ring-offset` | `2px` | Gap between element edge and focus ring |

### State motion tokens

| Token | Value | Usage |
|---|---|---|
| `transition-control` | `180ms ease` | Default for hover/focus state changes |
| `transition-control-color` | `200ms ease` | Color transitions on interactive elements |
| `transition-tab` | `300ms ease` | Tab underline and color transitions |

---

## Universal interactive rules

These apply to every control specified in 08b–08f:

1. **No ripple effects.** Ripples are Material Design. Ember is paper and ink.
2. **No border-radius greater than 2px.** On any control, ever.
3. **No filled icon variants.** Icons are always `FILL` 0, `wght` 300.
4. **No elevation or box-shadow on controls.** Controls are on the page, not above it.
5. **No color-filled backgrounds on buttons** except the primary variant (8.1).
6. **No animation that draws attention to the control itself.** The student's eye should stay on their writing.
7. **No tooltips on touch devices.** Tooltips are pointer-only.
8. **No confirmation dialogs for reversible actions** (bookmark, pin, group).
9. **All transitions respect `prefers-reduced-motion`.** When reduced motion is preferred, state changes are instant.
10. **Color is never the sole state indicator.** Always paired with text, icon, shape, or opacity change.
