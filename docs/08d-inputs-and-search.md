# Ember — Interactive Controls: Inputs & Search

## Family 8, Part 3: Where the Student Speaks to the System

The main notebook input zone (7.4 in the component inventory) is not a control — it is the notebook itself, borderless and continuous with the page. The inputs specified here are *subsidiary*: search fields, canvas labels, Socratic response prompts, table cell editors. They are utility inputs, not the primary writing surface.

---

### 8.9 — Text Input

**What it is.** A single-line text field for system interactions. Used for search, canvas region labeling, table cell editing, and inline prompts.

**Visual specification.**
- Typeface: Crimson Pro, 15px, Regular (400) — the student's voice, because inputs are the student speaking
- Color: `ink`
- Placeholder: Crimson Pro Italic, 15px, `ink-ghost`
- Background: transparent
- Border: bottom-only, 1px solid `rule`
- Height: `control-height-md` (36px)
- Padding: 0 left, `control-padding-x` right (to clear trailing icon if present)
- Border-radius: 0 — inputs are lines on paper, not boxes

**Interactive states.**

| State | Border-bottom | Color | Other |
|---|---|---|---|
| Rest | 1px `rule` | — | — |
| Hover | 1px `ink-ghost` | — | `transition-control-color` |
| Focus | 1px `ink-soft` | `ink` | No glow, no box-shadow. The line darkens, like pressing a pen harder. |
| Filled | 1px `rule` | `ink` | Returns to rest border on blur |
| Disabled | 1px `rule-light` | `ink-ghost` | `cursor: default` |
| Error | 1px `margin` at 60% | `ink` | Error text below (see below) |

**Error state.**
- Message: IBM Plex Mono, 10px, Regular (400), `margin`
- Position: 6px below the input line
- No icon. The text is sufficient.

**Compositional rules.** Text inputs appear in headers (search), inside canvas regions (labels), and in peripheral UI. They never appear inside content blocks or tutor elements. The main notebook writing area is NOT this component.

---

### 8.10 — Search Input

**What it is.** A specialised text input for finding content across the notebook, constellation, and philosophy surfaces. Searching is like flipping through pages with a finger — quiet and quick.

**Visual specification.**
- Typeface: IBM Plex Mono, 12px, Regular (400) — search is a system function, not student prose
- Color: `ink`
- Placeholder: IBM Plex Mono Italic, 12px, `ink-ghost`. Content: "Search..." (not "Search the scriptorium" — that's decorative)
- Background: transparent
- Border: bottom-only, 1px `rule-light`
- Height: `control-height-md` (36px)
- Width: 200px default; on focus, expands to 280px over 300ms ease
- Trailing icon: Material Symbols `search`, 18px, `ink-ghost`

**Interactive states.**

| State | Border | Icon color | Width |
|---|---|---|---|
| Rest | 1px `rule-light` | `ink-ghost` | 200px |
| Focus | 1px `ink-faint` | `ink-faint` | 280px, 300ms ease |
| Typing | 1px `ink-faint` | `ink-faint` | 280px |
| Loading | 1px `ink-faint` | `ink-faint`, pulse 0.3–0.6 opacity, 1.2s | 280px |
| Blur (empty) | 1px `rule-light` | `ink-ghost` | 200px, 300ms ease |

**Keyboard shortcut.** `Cmd/Ctrl+K` focuses the search input from anywhere. `Escape` clears and blurs.

**Search results.** Not specified here — search results are content (entries, thinkers, concepts) rendered in their native component styles within a dropdown column. The dropdown:
- Width: matches search input expanded width (280px)
- Background: `paper`
- Border: 1px `rule`
- Border-radius: 2px
- Shadow: `0 1px 3px rgba(0,0,0,0.04)` — the only permitted shadow in Ember, used because the dropdown must visually separate from content below
- Max height: 320px, scrollable
- Each result item: 44px height (touch target), hover `hover-overlay`

---

### 8.11 — Inline Editable Field

**What it is.** A text element that becomes editable on click. Used for canvas region names, table cell editing, and divider labels. At rest it looks like static text. On click it reveals itself as an input.

**Visual specification.**
- At rest: renders as its parent component's typography (e.g., a canvas label renders in IBM Plex Mono 11px `ink-ghost`)
- Cursor on hover: `text` (indicating editability)
- On click: a 1px bottom border in `rule` appears beneath the text, and the cursor is placed at the end of the text
- On blur or Enter: the border disappears, the new text is saved immediately

**Interactive states.**

| State | Visual change |
|---|---|
| Rest | Static text, no affordance visible |
| Hover | `cursor: text` |
| Focus/editing | 1px bottom border `rule`, text becomes `ink` if it was lighter |
| Blur | Border disappears, text returns to its resting color |

**Compositional rules.** Inline editable fields appear only where the spec explicitly allows renaming: canvas headers (4.1), divider labels (3.6), and card titles (3.2). They do not appear on tutor elements, student prose (which is immutable once submitted), or peripheral elements.
