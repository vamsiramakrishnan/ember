# Ember — Interactive Controls: States, Keyboard & Accessibility

## Family 8, Part 6: The Invisible Architecture of Interaction

The controls in 08b–08f define *what* the student can do. This document defines the global rules: what happens when nothing is happening, what happens when something goes wrong, how the keyboard moves through the interface, and how every element remains accessible.

---

## Loading states

Following the spec's principle that "silence is a feature," Ember does not show conventional loading indicators.

### AI-generated content

No loading indicator. The silence marker (2.6) serves this purpose — the cursor blinks, the page waits. No "thinking" animation, no typing indicator, no shimmer. The tutor is simply quiet until it speaks.

### System operations

When the student navigates between surfaces or loads a past session:

- A single horizontal rule in `rule` appears at the top of the content column
- It animates its width from 0% to 100% over 1.5s with `cubic-bezier(0.16, 1, 0.3, 1)` easing
- On completion, the rule fades out over 200ms
- `prefers-reduced-motion`: no animation, content appears immediately

### Search

While results are loading:
- The trailing search icon (`search`, 18px) gains an opacity pulse: 0.3 to 0.6, 1.2s cycle
- No skeleton screens, no placeholder cards
- Results appear as they are ready

### What is forbidden

- No spinners. Ever.
- No skeleton screens (they imply a known structure before content arrives).
- No "shimmer" effects.
- No progress percentages.
- No "Loading..." text.
- No animated dots ("...").

These are screen behaviours, not notebook behaviours. A notebook does not load. It is simply there, or it is being opened.

---

## Empty states

What the student sees when a surface or section has no content.

### Visual specification

- A single line of text, centred within the content column
- Typeface: Cormorant Garamond Italic, 18px, Light (300), `ink-ghost`
- Vertical position: 40% from top of available space
- No illustration. No icon. No decorative element.

### Content by context

| Context | Text |
|---|---|
| Empty notebook (first session) | "The notebook is open." |
| Empty constellation | "The sky is clear. Begin writing to see your stars." |
| Empty philosophy | "No thinkers yet. They will arrive as you explore." |
| No search results | "Nothing found." |
| Empty canvas | "Drag elements here, or start writing." |
| No pinned threads | *(zone collapses to zero height — no message)* |
| No bookmarks | "No bookmarks yet." |

### Rules

- Empty state text is never instructional beyond one sentence. No tutorials, no onboarding flows, no "Getting started" guides.
- The blinking cursor (from the silence marker, 2.6) appears below the empty notebook message — the notebook is open and waiting.
- Empty states are not actionable. They do not contain buttons, links, or suggestions. The student begins by writing.

---

## Keyboard shortcut map

Every action in Ember is reachable by keyboard. These are the global shortcuts, grouped by context.

### Notebook (linear mode)

| Shortcut | Action |
|---|---|
| `Enter` | Submit current entry |
| `Shift+Enter` | New line within entry |
| `---` + `Enter` | Insert divider (3.6) |
| `Cmd/Ctrl+Shift+S` | Toggle scratch note mode for current input |
| `Cmd/Ctrl+Shift+H` | Mark current input as hypothesis |

### Selection & actions

| Shortcut | Action |
|---|---|
| `Click` on element | Select element, show context action bar (8.18) |
| `Escape` | Dismiss selection / context bar |
| `Cmd/Ctrl+Shift+P` | Pin selected element |
| `Cmd/Ctrl+B` | Bookmark selected element |
| `Cmd/Ctrl+Shift+G` | Group selected elements |
| `Delete` or `Backspace` | Cross out selected element |
| `Cmd/Ctrl+Shift+K` | Open selection as canvas |

### Canvas mode

| Shortcut | Action |
|---|---|
| `Space` + drag | Pan canvas |
| `Cmd/Ctrl+=` | Zoom in |
| `Cmd/Ctrl+-` | Zoom out |
| `Cmd/Ctrl+0` | Reset zoom to 100% |
| `Tab` | Cycle focus through canvas elements |
| `Arrow keys` | Move selected element by 1px (or 8px with `Shift`) |
| `Escape` | Exit canvas mode / deselect |

### Navigation

| Shortcut | Action |
|---|---|
| `Cmd/Ctrl+1` | Switch to Notebook |
| `Cmd/Ctrl+2` | Switch to Constellation |
| `Cmd/Ctrl+3` | Switch to Philosophy |
| `Cmd/Ctrl+K` | Focus search input |
| `Escape` (in search) | Clear search, blur input |

### Global

| Shortcut | Action |
|---|---|
| `Tab` | Move focus to next interactive element |
| `Shift+Tab` | Move focus to previous interactive element |
| `Enter` or `Space` | Activate focused element |

---

## Accessibility specification

These rules apply to every interactive element in Ember.

### Focus management

1. **Focus must always be visible.** Every interactive element renders a `focus-ring` outline (1.5px, `rgba(91,107,138,0.40)`, 2px offset) when focused via keyboard.
2. **Focus is suppressed for pointer interaction.** When an element is clicked with a mouse or tapped, the focus ring does not appear. It appears only on keyboard navigation (`:focus-visible`).
3. **Focus order follows document order.** No `tabindex` values greater than 0. Interactive elements are focusable in the order they appear in the DOM.
4. **Focus trapping.** When a modal-like element is open (context action bar, search dropdown, canvas toolbar in fullscreen), focus is trapped within it until dismissed.

### Touch targets

- Minimum touch target: 44px × 44px (WCAG 2.5.5 Level AAA)
- Icon buttons (28px visual) extend their hit area with transparent padding to reach 44px
- Tab items are 44px tall
- Ghost buttons inline with text have a 44px tall hit area (achieved through padding)

### Color and contrast

- All text on `paper` background meets WCAG AA contrast (4.5:1 for normal text, 3:1 for large text)
- `ink` on `paper`: 10.2:1 (exceeds AAA)
- `ink-soft` on `paper`: 5.8:1 (exceeds AA)
- `ink-faint` on `paper`: 3.2:1 (meets AA for large text; used only for metadata at 11px+ which is supplementary)
- `ink-ghost` on `paper`: 1.9:1 (does not meet AA; used only for decorative/supplementary elements like placeholders and guide lines, never for essential information)
- `paper` on `ink`: 10.2:1 (for primary buttons and tooltips)
- Color is never the sole indicator of state. Every state change pairs color with at least one of: text, icon, shape, underline, or opacity change.

### Screen reader support

| Element | Requirement |
|---|---|
| Icon buttons (8.4) | `aria-label` describing the action |
| Tab bar (8.6) | `role="tablist"`, each tab `role="tab"`, `aria-selected` |
| Canvas toolbar modes (8.12) | `role="radiogroup"`, each mode `role="radio"`, `aria-checked` |
| Status labels (8.16) | Live text in DOM, not `aria-hidden` |
| Tooltips (8.19) | Content duplicated in `aria-label` on trigger |
| Search input (8.10) | `role="combobox"`, `aria-expanded`, `aria-controls` for results |
| Context action bar (8.18) | `role="toolbar"`, `aria-label="Element actions"` |
| Canvas elements | `aria-label` with element type and content summary |
| Canvas zoom | `aria-live="polite"` region announcing zoom level changes |

### Reduced motion

All transitions and animations on interactive controls respect `prefers-reduced-motion: reduce`:

- State changes become instant (transition duration: 0ms)
- The canvas collapse/expand animation is replaced by instant show/hide
- Drag animations become instant placement
- The context action bar appears instantly without fade/translate
- The search input width change is instant
- The loading rule animation is replaced by a static `rule` that appears and disappears

The **only** animation that persists under reduced motion is the cursor blink (silence marker, 2.6), because it is essential to the metaphor of an open notebook. However, it slows from 1.2s to 3s cycle time.

---

## What this document does not cover

- **The main notebook input zone (7.4).** That is part of the structural primitives, not the interactive controls. It has no border, no container, no placeholder. It is the notebook itself.
- **Gesture interactions on touch devices.** Two-finger tap for sketch mode, swipe-right for scratch notes, pinch-to-zoom in canvas. These are platform-dependent and will be specified per-platform when native implementations begin.
- **AI behaviour triggers.** When the tutor decides to speak, ask a question, or generate a diagram. That is the AI contract (05), not the interaction control layer.
