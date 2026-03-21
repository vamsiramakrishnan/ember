# Ember — Interactive Controls: Navigation

## Family 8, Part 2: Moving Between Surfaces

Navigation in Ember is a page turn. The student moves between three surfaces — Notebook, Constellation, Philosophy — the way someone moves between the desk, the bookshelf, and the star chart. The transition is instantaneous and quiet.

---

### 8.6 — Tab Bar (Surface Navigation)

**What it is.** The three-surface navigation at the top of every page. This is Ember's primary navigation and the only way to move between surfaces.

Partially specified in `04-information-architecture.md`. This section completes it with full interactive detail.

**Visual specification.**
- Container: full content width, bottom border 1px `rule-light`
- Tab item typeface: Cormorant Garamond, 14px, Regular (400)
- Tab spacing: 24px between items
- Container height: 44px (touch target)
- No icons in surface tabs — text only
- Aligned left, within the content column

**Tab states.**

| State | Color | Underline | Transition |
|---|---|---|---|
| Inactive | `ink-faint` | none | — |
| Hover | `ink-soft` | none | `transition-control-color` (200ms) |
| Active | `ink` | 1.5px solid `ink`, 6px below baseline | `transition-tab` (300ms) |
| Focus | `ink-faint` | none | `focus-ring` outline, 2px offset |

**Behaviour.** The active underline does NOT animate horizontally between tabs. There is no sliding indicator, no pill highlight, no background change. The previous tab's underline disappears; the new tab's underline appears. This is a page turn, not a carousel.

**Accessibility.**
- Container: `role="tablist"`
- Each tab: `role="tab"`, `aria-selected="true|false"`
- Arrow keys move focus between tabs
- `Enter` or `Space` activates the focused tab
- Tab panels: `role="tabpanel"`, `aria-labelledby` referencing the tab

---

### 8.7 — Sub-Tab Navigation

**What it is.** Secondary navigation within a surface. The prototypes show these extensively: "Catalog / Manuscripts / Thinkers" (screen-1), "Workbench / Archive / Formulas" (screen-2), "Personal Dictionary / Etymologies / Indices" (screen-3).

The spec does not formally include sub-tabs. If they are introduced, they follow this specification.

**Visual specification.**
- Typeface: Cormorant Garamond, 13px, Regular (400)
- Position: below the main tab bar, 12px vertical separation
- No container border

**Sub-tab states.**

| State | Color |
|---|---|
| Inactive | `ink-ghost` |
| Hover | `ink-faint` |
| Active | `ink-soft`, 1px bottom border `ink-faint` |
| Focus | `focus-ring` outline |

**Compositional rules.** Sub-tabs are optional. Most surfaces have no sub-tabs. When present, maximum three items. They never appear without a parent surface tab above them.

---

### 8.8 — Side Navigation

**What it is.** The prototypes show a fixed 256px sidebar on every screen. The spec does not include a sidebar — the spec says three surfaces, accessed via top tabs.

However, if a sidebar is adopted for wider viewports (> 1200px) as a convenience, this is the specification.

**Visual specification.**
- Width: 256px fixed, collapsible to icon-only (64px) on viewports 768–1200px
- Background: `paper-deep`
- Position: fixed left, full height
- Padding: 32px
- Logo: Cormorant Garamond, 20px, SemiBold (600), `ink`
- Subtitle: IBM Plex Mono, 10px, uppercase, letter-spacing 3px, `ink-ghost`

**Nav item specification.**
- Typeface: Cormorant Garamond, 18px, Regular (400)
- Color (inactive): `ink` at 60% opacity
- Icon: Material Symbols Outlined, 20px, `wght` 300, gap 16px to label
- Height: 44px per item (touch target)
- Spacing: 8px between items

**Nav item states.**

| State | Color | Icon | Other |
|---|---|---|---|
| Inactive | `ink` at 60% | `ink` at 60% | — |
| Hover | `ink` at 100% | `margin` | `transition-control-color` (200ms) |
| Active | `ink`, weight 600 | `ink` | 1px underline, offset 8px; `translateX(1px)` |
| Focus | `ink` at 60% | — | `focus-ring` outline |

**Bottom section.**
- Separated by 1px `rule-light`, 32px top margin
- Student identity: IBM Plex Mono, 10px, `ink-ghost` (label); Cormorant Garamond, 14px, SemiBold (600), `ink` (name)
- Avatar area: 40px × 40px, `paper-deep` background, 2px radius, 1px `rule-light` border

**On viewports < 768px.** The sidebar disappears entirely. A hamburger icon button (8.4) appears in the top-left header. It opens the sidebar as an overlay with a `paper` background and dismisses on outside tap or `Escape`.

**Philosophy note.** The sidebar is a concession to complex navigation — it should only exist if Ember grows beyond three surfaces. For the initial product, top tabs (8.6) are the canonical navigation.
