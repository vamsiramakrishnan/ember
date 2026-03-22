# Ember — Touch, Gesture & Interaction States

This document specifies the complete interaction state machine for every touchable, hoverable, focusable, and draggable element in Ember. It extends 03-interaction-language.md with the precision needed for implementation.

---

## Governing principle

Every interactive element exists in one of these states: **rest**, **hover**, **focus**, **active**, **dragging**, **disabled**. Transitions between states are smooth (0.15s ease), except in reduced-motion mode where they are instant.

The notebook metaphor means interactions should feel like handling paper — gentle, deliberate, quiet. No bouncing, no snapping, no spring physics. Lift and place.

---

## Block interaction model

Blocks (entries) in the notebook are the fundamental interactive unit. On desktop, they reveal affordances on hover. On touch devices, a single tap reveals the same affordances.

### Rest state
- No visible boundaries between blocks
- Content renders at full opacity
- No drag handle, no type tag, no action buttons visible
- The notebook looks like a continuous page of writing

### Hover state (desktop) / Tap-reveal state (touch)
When the pointer enters a block, or when a touch begins on a block:

1. **Background**: Paper-warm (#FAF6F1) at 50% opacity fills the block bounds
2. **Left handle appears** (0.15s fade): drag grip (⠿) + type tag (PROSE, QUESTION, etc.)
   - Grip: 10px, ink-ghost, letter-spacing -1px
   - Type tag: 9px uppercase, IBM Plex Mono 300, ink-ghost, 1px letter-spacing
   - Position: 48px left of the content column
3. **Right actions appear** (0.15s fade): cross-out, bookmark, pin
   - Position: 36px right of the content column
   - 11px system font, ink-ghost, 2px border-radius
4. **Annotation margin appears** (wide screens only, 960px+)

On touch devices, the tap-reveal state persists until:
- The user taps another block (which reveals that block's affordances)
- The user taps empty space (which dismisses all affordances)
- The user scrolls (which dismisses after 300ms)

### Focus state (keyboard)
- Tab moves focus through blocks sequentially
- Focused block shows a 2px outline in margin colour (#8B7355), offset 1px
- Within a focused block, Tab moves through action buttons (cross-out → bookmark → pin)
- Each action button shows the same 2px margin outline on focus-visible
- Enter activates the focused action
- Escape moves focus back to the block level

### Active state (pressing)
- Button background: paper-warm
- Text colour: ink-faint (not ink-ghost)
- Duration: while pressed

### Dragging state
When the user grabs the drag handle (or long-presses on touch):
- Source block: opacity 0.4, no background tint
- Drag ghost: native browser drag image (translucent copy)
- Drop target: 2px top border in margin colour, margin-top offset -2px to prevent layout shift
- All other blocks: no change (no dimming, no displacement animation)
- Drop completes: blocks swap order values in persistence. No animation — the list re-renders in new order.

### Disabled state
Crossed-out blocks:
- Opacity: 0.35
- Text-decoration: line-through in ink-ghost, 1px thickness
- Actions still accessible (restore via cross-out toggle)

---

## Block type indicators

Every entry has a type tag that appears on hover/touch. These are the canonical labels:

| Entry type | Tag label | Colour |
|-----------|-----------|--------|
| prose | PROSE | ink-ghost |
| scratch | NOTE | ink-ghost |
| hypothesis | HYPOTHESIS | indigo at 40% |
| question | QUESTION | indigo at 40% |
| sketch | SKETCH | ink-ghost |
| code-cell | CODE | ink-ghost |
| tutor-marginalia | TUTOR | margin at 40% |
| tutor-question | PROBE | margin at 40% |
| tutor-connection | CONNECTION | margin at 40% |
| concept-diagram | DIAGRAM | ink-ghost |
| thinker-card | THINKER | ink-ghost |
| silence | ··· | ink-ghost |
| divider | — | ink-ghost |

The type tag serves two purposes:
1. **Structure legibility**: Students can see the shape of their thinking at a glance
2. **Reorder clarity**: When dragging, the type tag on each block helps the student know what they're moving past

---

## Touch gestures

### Tap (single)
- On a block: reveals affordances (handle, actions, annotations)
- On an action button: executes the action
- On the input zone: focuses the textarea
- On a tab: switches surface/view
- On empty space: dismisses all revealed affordances

### Long-press (500ms)
- On a block: enters drag mode (for reorder)
- Haptic feedback if available (navigator.vibrate(10))
- Visual: block lifts (opacity 0.8), drag handle pulses once

### Swipe (horizontal)
- Not used. Horizontal swipe is reserved for browser navigation.

### Pinch (canvas mode only)
- Zoom in/out on the canvas
- Zoom range: 0.5x to 2.0x
- Snaps to 1.0x on double-tap

### Scroll
- Normal vertical scroll
- Dismisses tap-reveal state after 300ms of scrolling
- No pull-to-refresh (notebooks don't refresh)

---

## Input zone interactions

The input zone is the bottom of the notebook page. It is not a chat box.

### Cursor state (unfocused, empty)
- Blinking cursor: 1px wide, 22px tall, ink at 30% opacity
- Animation: opacity oscillates between 0.3 and 0 over 1.2s
- Position: left margin of the content column

### Focused state
- Cursor disappears (replaced by native textarea cursor)
- Textarea is invisible — no border, no background, no outline
- Text appears in Crimson Pro 18px (student's typeface)
- Auto-grows vertically with content

### Type indicator
- When text is present: inferred type appears bottom-right (9px, ink-ghost)
- When forced type is set: type bar appears above text (9px uppercase, margin colour, bottom border)
- Escape clears forced type
- The block inserter (+) sits 32px left of the content column

### Submit (Enter)
- Enter submits the text as a new entry
- Shift+Enter inserts a newline (does not submit)
- The entry immediately appears above the input zone
- The textarea clears
- The tutor begins processing (silence marker appears)
- Scroll to bottom (smooth, 50ms delay)

---

## Responsive behaviour

### 375px (mobile)
- Column: full width, 16px horizontal padding
- Drag handle + type tag: inline before content (not positioned left)
- Action buttons: inline row below content (not positioned right)
- Annotation margin: hidden
- Block inserter: inline (not positioned left)
- Canvas mode: simplified — no connectors, cards stack vertically

### 768px (tablet)
- Column: 640px, centred
- Drag handle: positioned left (-48px)
- Actions: positioned right (-36px)
- Annotation margin: hidden (appears at 960px+)
- Canvas mode: full spatial layout

### 1024px+ (desktop)
- Full layout with all positioned elements
- Annotation margin visible at 960px+
- Margin zone (marginal references) visible at 800px+

---

## Loading and empty states

### Empty notebook (first visit)
- Session header renders with date and time
- No entries — the input zone is immediately visible
- If AI bootstrap is running: silence marker with "Preparing your exploration"
- When bootstrap completes: opening tutor-marginalia appears with staggered reveal

### Thinking state (tutor processing)
- Silence marker appears immediately after student submits
- Blinking cursor inside silence marker (1.2s cycle)
- No loading spinner, no progress bar, no "typing..." indicator
- Duration: until tutor response arrives (typically 2-5 seconds)
- If tutor errors: silence marker remains for 3 seconds, then disappears

### Empty constellation
- Each sub-view shows a single-line message in ink-ghost:
  - Lexicon: "Terms will appear as you explore"
  - Encounters: "Thinkers will appear as you meet them"
  - Library: "Readings will appear as the tutor suggests them"
- No call-to-action buttons, no illustrations, no onboarding flows

---

## Accessibility

### Keyboard navigation order
1. Navigation tabs (Notebook → Constellation → Philosophy)
2. Mode toggle (Linear → Canvas)
3. Pinned threads (if any)
4. Entries (top to bottom)
   - Within each entry: action buttons (cross-out → bookmark → pin)
5. Input zone
6. Footer

### Screen reader announcements
- New entry: "Entry added: [first 50 chars]"
- Tutor response: "Tutor responds: [first 50 chars]"
- Cross-out: "Entry crossed out" / "Entry restored"
- Bookmark: "Bookmarked" / "Bookmark removed"
- Pin: "Pinned to threads" / "Unpinned"
- Tab switch: "[Surface name] selected"

### Reduced motion
Every animated element checks `prefers-reduced-motion: reduce`:
- Cursor blink: static at 30% opacity (no animation)
- Entry reveal: instant (no stagger, no translation)
- Tab transitions: instant colour change (no ease)
- Hover transitions: instant (no 0.15s fade)
- Drag: instant opacity change (no transition)
- Mastery bar: instant width (no smooth fill)

### Colour contrast
All text meets WCAG AA (4.5:1 ratio) against the paper background:
- ink on paper: 11.2:1 ✓
- ink-soft on paper: 7.8:1 ✓
- ink-faint on paper: 4.8:1 ✓
- ink-ghost on paper: 2.3:1 ✗ (decorative only — never used for essential content)
- margin on paper: 4.6:1 ✓

---

## Animation timing reference

| Element | Property | Duration | Easing | Delay |
|---------|----------|----------|--------|-------|
| Block hover background | opacity | 0.15s | ease | 0 |
| Drag handle appear | opacity | 0.15s | ease | 0 |
| Action buttons appear | opacity | 0.15s | ease | 0 |
| Action button hover | color, background | 0.1s | ease | 0 |
| Entry reveal (stagger) | opacity, transform | 0.6s | ease | 160ms × index |
| Silence cursor blink | opacity | 1.2s | ease-in-out | 0 |
| Tab switch | color, border-color | 0.3s | ease | 0 |
| Mastery bar fill | width | 0.8s | cubic-bezier(0.4, 0, 0.2, 1) | 0 |
| Selection toolbar | opacity, transform | 0.15s | ease | 0 |
| Bootstrap dot pulse | opacity | 1.2s | ease-in-out | 0 |
| Notebook card hover | border-color, background | 0.3s | ease | 0 |
