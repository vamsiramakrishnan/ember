# Ember — Interactive Controls: Labels, Badges & Tooltips

## Family 8, Part 5: The Marginal Notes of the Interface

These are the quietest interactive elements. They annotate, they classify, they explain — but they do not demand attention. They are the pencil marks in the margin of the interface itself.

---

### 8.16 — Status Label

**What it is.** A small text label indicating the state of an element or process. "SYNTHESIS ACTIVE." "DORMANT." "BRIDGED TO HEGEL." These are the system's marginal notes about state — present for the student who looks, invisible to the student who doesn't.

**Visual specification.**
- Typeface: IBM Plex Mono, 10px, Regular (400)
- Letter-spacing: 1px
- Text-transform: uppercase
- Padding: 4px 8px
- Border: 1px solid, same color as text at 40% opacity
- Border-radius: 2px
- Background: transparent

**Semantic variants.**

| Meaning | Text color | Border color |
|---|---|---|
| Active / Tutor process | `margin` | `margin` at 40% |
| Complete / Mastered | `sage` | `sage` at 40% |
| Inquiry / Developing | `indigo` | `indigo` at 40% |
| Connection / Synthesis | `amber` | `amber` at 40% |
| Dormant / Neutral | `ink-ghost` | `ink-ghost` at 40% |

**Behaviour.** Status labels are read-only. They have no hover state, no click action. If a status label must become interactive (e.g., to filter by state), it becomes a Ghost Button (8.3) with the appropriate semantic border color.

**Compositional rules.** Status labels appear in the Constellation view, in table headers, and beside metadata. They never appear inside notebook content or tutor elements. Maximum two per visible element — more than that is clutter.

---

### 8.17 — Category Tag

**What it is.** A keyword classifier. "GREEK." "PHILOSOPHY." "COGNITION." "ETHICS." Used in the Constellation and Lexicon views to categorise concepts and thinkers.

**Visual specification.**
- Typeface: IBM Plex Mono, 10px, Regular (400)
- Letter-spacing: 0.5px
- Text-transform: uppercase
- Color: `ink-faint`
- Background: `paper-deep`
- Padding: 3px 8px
- Border: none
- Border-radius: 2px

**Interactive states (when filterable).**

| State | Background | Color | Border |
|---|---|---|---|
| Rest | `paper-deep` | `ink-faint` | none |
| Hover | `hover-overlay` on `paper-deep` | `ink-soft` | none |
| Selected | `press-overlay` on `paper-deep` | `ink` | 1px `rule` |
| Focus | `paper-deep` | `ink-faint` | `focus-ring` outline |

**Compositional rules.** Tags appear in horizontal rows below or beside content elements. Maximum five visible tags per element — additional tags collapse behind a "+ N more" ghost button. Tag rows wrap naturally. Spacing: 4px between tags.

---

### 8.18 — Context Action Bar

**What it is.** The floating toolbar that appears when the student selects an element. This is how "pin," "group," "cross out," and "bookmark" are triggered — the actions that the component inventory references but never specifies an affordance for.

**Visual specification.**
- Position: 8px above the selected element, horizontally centred
- Background: `paper-deep`
- Border: 1px `rule`
- Border-radius: 2px
- Padding: 4px 8px
- Layout: flex row, `control-gap` (8px) between items
- Shadow: `0 1px 3px rgba(0,0,0,0.04)` — the minimal permitted shadow, used because the bar floats above content

**Action items.** Each is an icon button (8.4) at 24px size:

| Icon | Action | `aria-label` |
|---|---|---|
| `push_pin` | Pin to top of notebook (3.1) | "Pin this entry" |
| `group_work` | Group with other selected elements (3.4) | "Group selection" |
| `strikethrough_s` | Cross out / mark as struck (see 1.1 behaviour) | "Cross out" |
| `bookmark` | Toggle bookmark (3.5) | "Bookmark" |
| `open_in_new` | Open in canvas (4.1) | "Open as canvas" |

**Appearance animation.**
- Fade in: 150ms ease
- Translate: 4px upward from starting position
- `prefers-reduced-motion`: instant, no animation

**Dismissal.**
- Click outside the selected element
- Press `Escape`
- Complete an action (the bar dismisses after the action executes)
- Scroll more than 50px (the selection is implicitly released)

**Selection indicator.** When an element is selected (before the action bar appears):
- The element gains a 1px `rule-light` outline, 2px offset
- This outline appears over 100ms
- It disappears when the context action bar is dismissed

---

### 8.19 — Tooltip

**What it is.** A brief text label that appears when hovering on an icon button or an ambiguous control. The last resort for conveying meaning — if the icon is clear enough, no tooltip is needed.

**Visual specification.**
- Typeface: IBM Plex Mono, 10px, Regular (400)
- Color: `paper`
- Background: `ink`
- Padding: 4px 8px
- Border-radius: 2px
- Position: below the target element, 6px gap, horizontally centred
- Arrow: none (too decorative for Ember)
- Shadow: none
- Max-width: 200px
- Line-height: 1.4

**Timing.**
- Delay before appearance: 500ms
- Fade in: 150ms ease
- Disappearance on mouse leave: 100ms fade out
- If pointer moves to another tooltip-bearing element within 200ms, the next tooltip appears without delay

**Accessibility.** Tooltip content is always duplicated in `aria-label` on the target element. Tooltips are a visual convenience, never the sole source of information.

**Compositional rules.** Tooltips appear only on pointer devices. They are suppressed entirely on touch screens (`@media (pointer: coarse)`). They never contain interactive elements, links, or multi-line content. One tooltip visible at a time.
