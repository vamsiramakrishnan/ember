# Ember Aesthetic Audit — Deep Diagnosis

**Date:** 2026-03-28
**Scope:** Full codebase audit against design spec (docs/02-visual-language.md, docs/06-component-inventory.md)
**Method:** Token inspection, CSS analysis, component structure review

---

## SECTION 1: COLOR & WARMTH

### ITEM 1.1: Shell background
**Current state:** Base background is `#F6F1EA` (warm ivory). A radial gradient overlay applies `paper-warm` (`#F9F4ED`) at center-top via `radial-gradient(ellipse 70% 40% at 50% 0%, var(--paper-warm) 0%, transparent 60%)` with `background-attachment: fixed`. An AI-generated ambient texture layer tiles at 512x512px at 4% opacity.
**Assessment:** Beautiful. The radial warmth creates a subtle reading-lamp glow from above. The background is not a flat hex — it breathes. The ambient texture at 4% opacity adds subliminal material quality.
**Gap:** NONE

### ITEM 1.2: Grey undertones
**Current state:** Every grey derives from the warm ink base `#2C2825`:
- `ink-soft`: `#5C5550` (warm brown-grey)
- `ink-faint`: `#9B9590` (warm taupe)
- `ink-ghost`: `#C8C2BA` (warm pale grey)
- `rule`: `#DDD6CC` (warm beige)
- `rule-light`: `#EBE5DC` (warm pale beige)

No cool greys found in the design system tokens or component CSS.
**Assessment:** Excellent. The entire grey scale has consistent warm undertones.
**Gap:** NONE
**Notes:** One deviation: `src/services/viz-components.ts` (embedded visualization iframe) defines alternate ink values using `rgba(44,40,37,0.XX)` opacity variants instead of named hex tokens.

### ITEM 1.3: Text selection color
**Current state:** `::selection { background-color: var(--margin-dim); color: var(--ink); }` — terracotta at 7% opacity.
**Assessment:** Correct direction, but too subtle. At 7% opacity on warm ivory, the selection highlight is barely visible. Users may struggle to see selected text. The color choice is right; the opacity needs to be higher for this functional control.
**Gap:** MEDIUM
**Notes:** Consider `rgba(184, 86, 79, 0.15)` — still warm, still restrained, but visible enough to be functional.

### ITEM 1.4: Accent color application
**Current state:** Accents at correct opacities: margin-dim 7%, sage-dim 10%, indigo-dim 8%, amber-dim 8%. Full-opacity accents only on borders and text labels.
**Assessment:** Well-calibrated. No accent feels too loud.
**Gap:** NONE

### ITEM 1.5: Dark variant
**Current state:** Does not exist. Spec explicitly states: "There is no dark mode. Libraries do not have dark mode."
**Assessment:** Intentionally absent. Philosophically correct.
**Gap:** NONE

---

## SECTION 2: TYPOGRAPHY

### ITEM 2.1: Type rendering
**Current state:** Global CSS: `-webkit-font-smoothing: antialiased`, `-moz-osx-font-smoothing: grayscale`, `text-rendering: optimizeLegibility` on `html`.
**Assessment:** Correct. Greyscale antialiasing makes thin weights (Light 300) render crisply on retina without appearing heavy.
**Gap:** NONE

### ITEM 2.2: Optical tracking
**Current state:** Letter-spacing values:
- `pageTitle` (28px): `-0.3px` — tightens at large size
- `sectionHeader` (20px): `-0.2px` — tightens at medium-large
- `tutorMarginalia` (17.5px): `0` — neutral at body
- `studentText` (18px): `0` — neutral at body
- `sectionLabel` (13px, uppercase): `2px` — very loose for small caps
- `systemMeta` (11px): `1.5px` — loose for small metadata

Additional: `0.005em` in Philosophy body and InputZone textarea (nearly zero, should be `0` per tokens).
**Assessment:** Good overall. Tracking tightens at large sizes, loosens at small sizes.
**Gap:** SMALL
**Notes:** Clean up the `0.005em` values to `0` for purity.

### ITEM 2.3: Typography features
**Current state:** `font-feature-settings: 'kern' 1, 'liga' 1` on `html`. No `onum` (oldstyle numerals) enabled. No `font-variant-numeric: oldstyle-nums`.
**Assessment:** Missing oldstyle numerals. Cormorant Garamond has beautiful oldstyle figures that hang below the baseline. These are not enabled, missing the "well-typeset book" feel.
**Gap:** MEDIUM
**Notes:** Add `'onum' 1` to `font-feature-settings` for body text. Keep lining figures for IBM Plex Mono.

### ITEM 2.4: Line-height at breakpoints
**Current state:** Fixed at `1.80` (studentText) and `1.75` (tutorMarginalia) at all viewports. Spec explicitly says: "Line-height remains 1.75-1.80 at all breakpoints."
**Assessment:** Matches spec.
**Gap:** NONE

### ITEM 2.5: Responsive type sizing
**Current state:** No `clamp()`. Fixed pixel values with media query breakpoints at 480px and 375px. Example: InputZone 18px default, 16px at <=480px.
**Assessment:** Functional but abrupt. The discrete step from 18px to 16px at 480px creates a visible snap.
**Gap:** SMALL
**Notes:** The spec uses discrete breakpoints, so this is technically compliant. `clamp()` would be an enhancement.

### ITEM 2.6: Hanging punctuation and hyphenation
**Current state:** No `hanging-punctuation` or `hyphens` CSS property anywhere.
**Assessment:** Missing both. Quotation marks indent rather than hang. Long words don't hyphenate in the 640px column. Notable omissions for "well-typeset book" quality.
**Gap:** MEDIUM
**Notes:** Add `hanging-punctuation: first last` and `hyphens: auto` with `lang="en"` on prose blocks. CSS-only, no JS needed.

---

## SECTION 3: MOTION & TIMING

### ITEM 3.1: Entry reveal direction and easing
**Current state:** Standard entries: `translateY(8px)` to `translateY(0)`, `0.7s ease`. Stagger: 950ms intervals, 160ms per-entry, 300ms initial delay.
**Assessment:** Correct and well-paced. Content settles into place. Stagger creates pleasant unfolding rhythm.
**Gap:** NONE

### ITEM 3.2: Marginalia reveal vs entry reveal
**Current state:** `useRevealSequence` `margin` variant: `translateX(-6px)` to `translateX(0)`, `0.7s`. Tutor entries slide from left (toward margin rule), student entries rise from below.
**Assessment:** Excellent. Directional differentiation reinforces the spatial metaphor.
**Gap:** NONE

### ITEM 3.3: Transition properties
**Current state:** Only 1 instance of `transition: all` (Landing.module.css, newStudentButton). All other transitions specify explicit properties.
**Assessment:** Nearly perfect.
**Gap:** NONE

### ITEM 3.4: Spring physics
**Current state:** No spring or bounce easing. Custom `cubic-bezier(0.16, 1, 0.3, 1)` (sharp entry, controlled deceleration). No framer-motion/react-spring.
**Assessment:** Perfect. Motion feels like settling, never bouncing.
**Gap:** NONE

### ITEM 3.5: Cursor blink on SilenceMarker
**Current state:** `@keyframes emberCursorBlink`: 0%/100% opacity 0.3, 50% opacity 0. Cycle: 1.2s. Thinking variant: 2.4s, ink-ghost color. Spec's "90s idle" trigger adapted to tutor-thinking state.
**Assessment:** Correct. Opacity range and cycle match spec. Thinking adaptation is practical.
**Gap:** SMALL
**Notes:** Spec's 90s idle trigger replaced by tutor-thinking state. Reasonable adaptation.

### ITEM 3.6: Surface/sub-view transitions
**Current state:** Tab toggles: `color 0.3s ease, border-color 0.3s ease`. Content swap: binary mount/unmount via React state. No crossfade, no blur, no depth transition.
**Assessment:** Functional but flat. Switching surfaces is instant — no sense of spatial transition.
**Gap:** MEDIUM
**Notes:** A subtle crossfade (opacity 0->1, 0.3s) and optional warm blur would add material quality. The difference between "functional" and "cinematic."

---

## SECTION 4: DEPTH & SPATIAL EFFECTS

### ITEM 4.1: Paper grain/texture
**Current state:** No SVG feTurbulence. AI-generated raster texture at 4% opacity, topic-dependent. Fallback is flat `#F6F1EA`.
**Assessment:** Creative but inconsistent. When generation fails, background is pure CSS hex.
**Gap:** SMALL
**Notes:** Add a static SVG feTurbulence grain (fractalNoise, baseFrequency ~0.65, opacity ~2-3%) as persistent base layer beneath AI texture.

### ITEM 4.2: Progressive blur on peripheral content
**Current state:** No `backdrop-filter` usage. No blur transitions. Everything at same focal plane.
**Assessment:** Flat. No depth-of-field effect between surfaces.
**Gap:** MEDIUM
**Notes:** The "reading lamp" metaphor implies things at edge of light are slightly out of focus.

### ITEM 4.3: Philosophy surface
**Current state:** Static list of 6 numbered principles in a Column. Well-typeset but no ambient motion, no generative elements, no parallax, no cursor tracking.
**Assessment:** Typographically beautiful, spatially static. Called "The Star Chart" but has no star-chart quality. Feels like a static about-page.
**Gap:** LARGE
**Notes:** Subtle starfield background (SVG dots at very low opacity, drifting with cursor parallax) would differentiate this surface from Notebook and Constellation.

### ITEM 4.4: Canvas mode
**Current state:** Concept cards positioned spatially. No micro-settle animation on drop. CSS transitions only.
**Assessment:** Functional. Cards lack physical quality on placement.
**Gap:** SMALL

### ITEM 4.5: Thinker cards in Constellation
**Current state:** No `backdrop-filter`. Standard borders on flat paper background.
**Assessment:** No glassmorphism. Cards are clean but lack depth.
**Gap:** SMALL

---

## SECTION 5: INTERACTION DETAILS

### ITEM 5.1: Focus states
**Current state:** Global `:focus-visible`: `outline: 1.5px solid var(--margin)` (#B8564F), `outline-offset: 3px`, `border-radius: 2px`.
**Assessment:** Excellent. Custom warm focus ring, consistent, accessible.
**Gap:** NONE

### ITEM 5.2: Scrollbar appearance
**Current state:** InputZone: `scrollbar-width: thin; scrollbar-color: var(--rule-light) transparent`. Main Notebook scroll area: OS default.
**Assessment:** Main scrollbar is thick, grey, cold — breaks the warm material illusion.
**Gap:** MEDIUM
**Notes:** Add global thin, warm scrollbar. WebKit: 6px width, `var(--paper-deep)` track, `var(--rule)` thumb.

### ITEM 5.3: Cursor behavior
**Current state:** `text` on InputZone, `pointer` on navigation/buttons, `grab`/`grabbing` on canvas, `crosshair` on sketch, `default` on reading elements.
**Assessment:** Well-considered. Reading elements don't show pointer.
**Gap:** NONE

### ITEM 5.4: InputZone behavior
**Current state:** Auto-height (JS), max 40vh. Affordances fade on focus. afterQuestion echo animation. Hint text in Crimson Pro italic 16px at ink-ghost.
**Assessment:** Mostly excellent. Hint uses Crimson Pro (student voice) instead of Cormorant Garamond (tutor voice). The placeholder represents the tutor's invitation.
**Gap:** SMALL
**Notes:** Change `.hint` font-family from `var(--font-student)` to `var(--font-tutor)`.

### ITEM 5.5: Hover on Lexicon words
**Current state:** CSS hover (border-color change). No 400ms dwell interaction, no inline etymology bloom.
**Assessment:** Missing the Lexicon's signature interaction.
**Gap:** MEDIUM
**Notes:** Requires JS mouseenter timer (400ms dwell) triggering inline height/opacity bloom.

### ITEM 5.6: Entry submission micro-interaction
**Current state:** Input value cleared immediately on submit. Text vanishes and reappears as entry.
**Assessment:** Abrupt. No transitional moment between input and entry.
**Gap:** MEDIUM
**Notes:** 200ms delay with color morph from input to entry styling before clearing.

---

## SECTION 6: VISUAL HIERARCHY & LAYOUT

### ITEM 6.1: Column width
**Current state:** `max-width: 640px`, `margin: 0 auto`, `padding: 0 24px`. At 1440px: exactly 640px. At <480px: 16px padding. At <375px: 12px padding.
**Assessment:** Perfect. The sacred 640px is maintained.
**Gap:** NONE

### ITEM 6.2: Margin zone
**Current state:** Positioned absolutely, `right: -192px`, `width: 160px`, `border-left: 1px solid var(--rule-light)`. Visible at 800px+. No distinct background color.
**Assessment:** Missing background tint. Zone is transparent — doesn't register as a distinct spatial region.
**Gap:** SMALL
**Notes:** Add `background-color: rgba(237, 230, 219, 0.4)` (paper-deep at 40%).

### ITEM 6.3: Scroll rhythm
**Current state:** Entry gap: 20px. Section dividers: 32px. Silence markers: 48px. Session dividers: 48px.
**Assessment:** Well-structured vertical rhythm.
**Gap:** NONE

### ITEM 6.4: Empty state
**Current state:** No explicit empty state. Auto-creates session. Shows header, mode toggle, InputZone with nothing between.
**Assessment:** Missed opportunity. Empty notebook should feel inviting, not blank.
**Gap:** MEDIUM
**Notes:** Add SilenceMarker with gentle marginal text ("The page is yours.") in Cormorant Garamond italic at ink-ghost.

### ITEM 6.5: Border visibility
**Current state:** `rule` (#DDD6CC) ~12-15% darker than paper. `rule-light` (#EBE5DC) subtler. Tutor margin rule: 3px at 35% opacity. Socratic border: 2px at 100%.
**Assessment:** Correct. No borders too visible.
**Gap:** NONE

---

## SECTION 7: THE 30-SECOND LOOK TEST

- **Temperature:** Warm. The `#F6F1EA` paper with radial glow, warm greys, terracotta accents.
- **Weight:** Right. Light 300 and Regular 400 dominate. Nothing heavy.
- **Breathing room:** Generous. 640px column, 1.80 line-height, 48px silence gaps.
- **Material:** Almost paper. Radial gradient and AI texture push beyond flat hex, but without persistent grain, can read as "a very nice CSS color."
- **Motion:** Cursor blink at 0.3 max, 1.2s cycle — a candle flame. Subliminal.
- **Overall:** 85% reading lamp. Typography, color, spacing are clearly "reading lamp." Lack of surface-transition depth, missing grain texture, instant content swaps, and static Philosophy surface pull slightly toward "app."

---

## PRIORITY LIST — 10 Highest-Impact Gaps

Ranked by visual/emotional impact:

| Rank | Item | Section | Gap | Fix Summary |
|------|------|---------|-----|-------------|
| 1 | Philosophy surface is static | 4.3 | LARGE | Add subtle starfield, ambient drift, cursor parallax |
| 2 | Surface transitions are instant | 3.6 | MEDIUM | Add 300ms opacity crossfade with optional warm blur |
| 3 | Main scrollbar is OS default | 5.2 | MEDIUM | Add thin warm custom scrollbar globally |
| 4 | Empty notebook state is blank | 6.4 | MEDIUM | Add SilenceMarker + gentle marginal whisper |
| 5 | Text selection too subtle | 1.3 | MEDIUM | Raise margin-dim from 7% to ~15% for ::selection |
| 6 | No hanging punctuation / hyphenation | 2.6 | MEDIUM | Add hanging-punctuation and hyphens: auto |
| 7 | No oldstyle numerals | 2.3 | MEDIUM | Add onum to font-feature-settings for body text |
| 8 | Lexicon dwell interaction missing | 5.5 | MEDIUM | Add 400ms hover-dwell with inline etymology bloom |
| 9 | Entry submission is abrupt | 5.6 | MEDIUM | Add 200ms color morph transition on submit |
| 10 | InputZone hint uses wrong typeface | 5.4 | SMALL | Change .hint from font-student to font-tutor |
