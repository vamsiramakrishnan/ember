# Ember — Interactive Controls: Buttons

## Family 8, Part 1: The Student's Tools

Buttons in Ember speak in IBM Plex Mono — the system voice. They are not the student's voice (Crimson Pro) and not the tutor's voice (Cormorant Garamond). Buttons are the quiet mechanism that makes things happen. They are set in uppercase, small, and light. They whisper.

---

### 8.1 — Primary Button

**What it is.** The single most important action on a surface. "Begin writing." "Submit." "Export Synthesis." Maximum one per visible viewport. If there is no singular important action, there is no primary button.

**Visual specification.**
- Typeface: IBM Plex Mono, 11px, Regular (400)
- Letter-spacing: 1.5px
- Text-transform: uppercase
- Color: `paper`
- Background: `ink`
- Height: `control-height-lg` (44px)
- Padding: 0 20px
- Border: none
- Border-radius: 2px

**Interactive states.**

| State | Background | Color | Other |
|---|---|---|---|
| Rest | `ink` | `paper` | — |
| Hover | `hover-overlay` on `ink` | `paper` | `transition-control` |
| Active | `ink` | `paper` | `transform: scale(0.98)`, 80ms |
| Focus | `ink` | `paper` | `focus-ring` outline, `focus-ring-offset` gap |
| Disabled | `ink-ghost` | `ink-faint` | `cursor: default`, no pointer events |

**Compositional rules.** A primary button is always right-aligned or centred. It never appears in a margin, in a tutor element, or inline with prose. It exists at the surface level — in headers, at the bottom of canvas regions, or in action bars.

---

### 8.2 — Secondary Button

**What it is.** A supporting action. "Clear Board." "Annotations (12)." Lower visual weight than primary. Used when there are two possible actions and one is clearly subordinate.

**Visual specification.**
- Typeface: IBM Plex Mono, 11px, Regular (400)
- Letter-spacing: 1px
- Text-transform: uppercase
- Color: `ink-soft`
- Background: transparent
- Height: `control-height-md` (36px)
- Padding: 0 `control-padding-x` (16px)
- Border: 1px solid `rule`
- Border-radius: 2px

**Interactive states.**

| State | Background | Border | Color |
|---|---|---|---|
| Rest | transparent | 1px `rule` | `ink-soft` |
| Hover | `hover-overlay` | 1px `ink-ghost` | `ink` |
| Active | `press-overlay` | 1px `ink-ghost` | `ink` |
| Focus | transparent | `focus-ring` outline | `ink-soft` |
| Disabled | transparent | 1px `rule-light` | `ink-ghost` |

**Compositional rules.** Secondary buttons appear beside primary buttons, in toolbar rows, or standalone when the action is the only one but is not important enough for primary treatment.

---

### 8.3 — Ghost Button

**What it is.** The quietest button. Appears as underlined text. Used for inline actions within content flow: "+ Integrate," "Export to Library," "View source." The ghost button is the closest thing Ember has to a hyperlink.

**Visual specification.**
- Typeface: IBM Plex Mono, 11px, Light (300)
- Letter-spacing: 1px
- Text-transform: uppercase
- Color: `ink-faint`
- Background: none
- Border: none
- Border-bottom: 1px solid `rule-light`
- Padding: 0 (inline with text flow)
- Height: auto (determined by line-height)

**Interactive states.**

| State | Color | Border-bottom |
|---|---|---|
| Rest | `ink-faint` | 1px `rule-light` |
| Hover | `ink` | 1px `ink-soft` |
| Active | `ink` | 1px `ink` |
| Focus | `ink-faint` | `focus-ring` outline, 2px offset |
| Disabled | `ink-ghost` | none |

**Compositional rules.** Ghost buttons appear inline — within marginalia, below bridge suggestions, beside metadata. They never appear in isolation. They are always attached to context.

---

### 8.4 — Icon Button

**What it is.** A button containing only a Material Symbols Outlined icon. Used for toolbar actions (search, settings, bookmark), header utilities, and canvas controls.

**Visual specification.**
- Icon: Material Symbols Outlined, 20px, `wght` 300, `FILL` 0
- Container: `control-height-sm` × `control-height-sm` (28px × 28px)
- Touch target: 44px × 44px (transparent padding extends the hit area)
- Color: `ink-faint`
- Background: transparent
- Border: none
- Border-radius: 2px

**Interactive states.**

| State | Color | Background |
|---|---|---|
| Rest | `ink-faint` | transparent |
| Hover | `ink-soft` | `hover-overlay` |
| Active | `ink` | `press-overlay` |
| Focus | `ink-faint` | `focus-ring` outline |
| Disabled | `ink-ghost` | transparent |

**Margin variant.** When an icon button triggers a tutor-related action, its hover color is `margin` instead of `ink-soft`. This is the only case where an interactive control uses the tutor's accent.

**Compositional rules.** Icon buttons appear in header rows, canvas toolbars, and context action bars. They never appear inside content blocks. Every icon button must have an `aria-label`.

---

### 8.5 — Floating Action Button (FAB)

**What it is.** A persistent creation button anchored to the bottom-right of the viewport. "Begin a new entry." Maximum one per surface.

**Visual specification.**
- Size: 44px × 44px
- Background: `ink`
- Icon: Material Symbols `edit`, 20px, color `paper`
- Border-radius: 2px (NOT circular — Ember does not use circles)
- Shadow: none (no elevation — this is a stamp on the page)
- Position: fixed, bottom 24px, right 24px

**Interactive states.**

| State | Background | Other |
|---|---|---|
| Rest | `ink` | — |
| Hover | `hover-overlay` on `ink` | `transition-control` |
| Active | `ink` | `transform: scale(0.96)`, 80ms |
| Focus | `ink` | `focus-ring` outline |

**Compositional rules.** The FAB exists on the Notebook surface only. It does not appear on Constellation or Philosophy. On narrow viewports (< 640px), the FAB moves to bottom-centre to avoid thumb-reach issues.

**Philosophy note.** The prototypes show round FABs with heavy shadows. This contradicts the spec's material philosophy. Ember's FAB is a square ink stamp in the corner — quiet, present, and flat.
