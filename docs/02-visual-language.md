# Ember — Visual Language

## The governing metaphor

Every visual decision in Ember derives from a single governing metaphor: *a well-worn notebook on a wooden desk, under a reading lamp, in a quiet library, in the late afternoon*.

This is not decoration. It is a commitment to a specific sensory experience — warmth, weight, continuity, and calm. The metaphor determines every token in the system: the colour of the surface is the colour of aged paper; the colour of the text is the colour of real ink; the accents are the colours you find on the spines of old books; the spacing is the spacing of a well-typeset page.

The metaphor also determines what is absent. There are no gradients. There are no shadows deeper than what paper casts on a desk. There are no saturated blues or greens or purples — these are screen colours, not library colours. There is no dark mode. Libraries do not have dark mode.

---

## Colour

### The paper

The background surface of Ember is not white. White is the colour of a new screen. Ember's surface is the colour of paper that has been read many times — a warm ivory with the faintest yellow warmth, like sunlight trapped in fibre.

| Token | Value | Usage |
|---|---|---|
| `paper` | `#F6F1EA` | Primary background. The page itself. |
| `paper-deep` | `#EDE6DB` | Recessed areas, fold lines, gentle shadows. The colour of paper in the gutter of an open book. |
| `paper-warm` | `#F9F4ED` | Where the light falls directly. Used sparingly for highlighted surfaces. |

### The ink

Real ink on real paper is not black. It is a deep warm charcoal with red in it — the colour you see in a fountain pen's trace, or in the body text of a well-printed book. Ember's text system has four weights of ink, from full to ghostly.

| Token | Value | Usage |
|---|---|---|
| `ink` | `#2C2825` | Primary text. The student's writing. Headlines. |
| `ink-soft` | `#5C5550` | Secondary text. Body paragraphs, descriptions. A pencil rather than a pen. |
| `ink-faint` | `#9B9590` | Tertiary text. Metadata, dates, system information. The faintest pencil. |
| `ink-ghost` | `#C8C2BA` | Guide lines, placeholders, the most peripheral information. Nearly invisible — present only if you look for it. |

### The accents

The accents in Ember are not "brand colours." They are the colours you find in a library: the spines of cloth-bound books, the brass of a reading lamp, the leather of a journal cover. Each accent has a semantic role.

| Token | Value | Role | Physical analogue |
|---|---|---|---|
| `margin` | `#B8564F` | The tutor's voice. Questions, annotations, marginalia. | Terracotta. The red-brown of a margin note in an old book. |
| `margin-dim` | `rgba(184,86,79,0.07)` | Background tint for the tutor's questions. | The faintest blush where a reader has underlined something many times. |
| `sage` | `#6B8F71` | Mastery, growth, fluency. | The green of a cloth-bound book on natural history. |
| `sage-dim` | `rgba(107,143,113,0.10)` | Background for mastery-related information. | |
| `indigo` | `#5B6B8A` | Inquiry, open questions, concepts being explored. | The blue-grey of a linen-bound mathematics text. |
| `indigo-dim` | `rgba(91,107,138,0.08)` | Background for inquiry-related information. | |
| `amber` | `#C49A3C` | Connection, synthesis, the moment two ideas meet. | Brass. The reading lamp. The bookend. |
| `amber-dim` | `rgba(196,154,60,0.08)` | Background for connection moments. | |

### The rules

Ruled lines in Ember function as they do in a notebook — they provide structure without commanding attention. They are thinner and lighter than any text.

| Token | Value | Usage |
|---|---|---|
| `rule` | `#DDD6CC` | Section dividers, borders, horizontal rules. |
| `rule-light` | `#EBE5DC` | The lightest structural lines. Tab underlines, entry separators. |

### What is forbidden

The following are never used in Ember:

- Pure white (`#FFFFFF`) — this is a screen colour, not a paper colour
- Pure black (`#000000`) — this is a pixel colour, not an ink colour
- Any blue above 60% saturation — this is a notification colour
- Any gradient — paper does not gradient
- Any shadow deeper than `0 1px 3px rgba(0,0,0,0.04)` — paper does not float
- Any colour from the standard "tech product" palette: electric blue, vibrant purple, neon green, hot pink

---

## Typography

### The philosophy

A great library does not use trendy fonts. It uses typefaces that have survived centuries because they are *right* — because someone understood the human eye deeply enough to shape letters that could be read for hours without fatigue, and that carried the authority of sustained thought.

Ember uses three typefaces. Each has a specific voice.

### The three voices

**Cormorant Garamond** — the tutor's voice, and the voice of structure.

This is a modern revival of Claude Garamond's sixteenth-century typeface, drawn by Christian Thalmann with high contrast and elegant proportions optimised for display. It is used for the tutor's marginalia, section headers, the student's name, the names of thinkers, and anywhere the system speaks with authority. It is set at slightly larger sizes than the student's text, but in a lighter weight — its presence is felt through elegance, not through mass.

Styles used: Light (300), Regular (400), Medium (500), SemiBold (600), and their italic counterparts.

**Crimson Pro** — the student's voice.

This is Jacques Le Bailly's text-optimised serif, designed for sustained reading at body sizes. It is warmer and more human than Garamond — slightly less formal, slightly more personal. It is the typeface of the notebook itself: the student's writing, body descriptions, the inner voice of the product. Where Cormorant Garamond says "the tutor is speaking," Crimson Pro says "the student is thinking."

Styles used: Light (300), Regular (400), Medium (500), and their italic counterparts.

**IBM Plex Mono** — the voice of the system.

This is the quietest voice in the product. It appears only for metadata: dates, session numbers, mastery percentages, provenance labels, technical annotations. It is set in Light (300) or Regular (400), at small sizes (10–12px), in the faintest ink colours. It is the voice that says "Session 47 · Tuesday, 18 March · Evening" — information that exists for orientation, not for reading.

IBM Plex Mono was chosen over more common monospaced fonts because it has warmth in its letterforms. It does not feel like a terminal. It feels like a typewriter in a study.

### The scale

Typography in Ember follows a scale based on readability and hierarchy, not on modular ratios. The sizes are chosen to feel natural at a reading distance of 40–60cm (a tablet held in the hands, or a laptop on a desk).

| Role | Typeface | Size | Weight | Colour | Letter-spacing |
|---|---|---|---|---|---|
| Page title | Cormorant Garamond | 28px | 300 | `ink` | −0.3px |
| Section header | Cormorant Garamond | 20px | 500 | `ink` | −0.2px |
| Tutor marginalia | Cormorant Garamond | 17.5px | 400 | `margin` | 0 |
| Tutor question | Cormorant Garamond italic | 18px | 400 | `ink` | 0 |
| Student text | Crimson Pro | 18px | 400 | `ink` | 0 |
| Body secondary | Crimson Pro | 15–16px | 400 | `ink-soft` | 0 |
| Thinker name | Cormorant Garamond italic | 22px | 500 | `ink` | 0 |
| Section label | Cormorant Garamond | 13px | 500 | `ink-faint` | 2px |
| System metadata | IBM Plex Mono | 11px | 300 | `ink-ghost` | 1.5px |
| Mastery value | IBM Plex Mono | 11px | 300 | `ink-faint` | 0 |

### Line height

All body text — student writing, tutor marginalia, descriptions — is set with a line-height of 1.75 to 1.80. This is more generous than most digital products and more aligned with how books are typeset. The generous leading creates rhythm, gives each line room to breathe, and makes sustained reading comfortable.

System text (IBM Plex Mono) uses a tighter 1.4 line-height, because it is meant to be glanced at, not read.

### Responsive adjustments

The scale above is the canonical scale at desktop widths (768px and above). On narrower viewports, type sizes adjust to maintain readability at shorter reading distances (a phone held in the hand, approximately 25–35cm). The adjustments are minimal — Ember is not a mobile-first product, and the notebook metaphor assumes a surface large enough to write on — but they prevent text from becoming physically difficult to read on small screens.

| Role | ≥768px (canonical) | 480–767px | <480px |
|---|---|---|---|
| Page title | 28px | 24px | 22px |
| Section header | 20px | 18px | 17px |
| Tutor marginalia | 17.5px | 16.5px | 16px |
| Tutor question | 18px | 17px | 16px |
| Student text | 18px | 17px | 16px |
| Body secondary | 15px | 14px | 14px |
| Thinker name | 22px | 20px | 18px |
| Section label | 13px | 12px | 12px |
| System metadata | 11px | 11px | 10px |

At the smallest breakpoint, the student's input text is set at 16px to prevent iOS auto-zoom on focus. Line-height remains 1.75–1.80 at all breakpoints — the generous leading is essential regardless of screen size.

### Rendered markdown content

The tutor's responses (Marginalia, Socratic Question, Reading Material) and the student's prose entries are rendered as markdown. The following typography applies to rendered elements within those containers:

| Rendered element | Typeface | Size | Weight | Colour | Notes |
|---|---|---|---|---|---|
| Paragraph | Inherits container | — | — | — | Matches the enclosing element's type style |
| Bold (`**text**`) | Inherits | — | 500 | — | Medium weight, never heavier |
| Italic (`*text*`) | Inherits | — | — | — | Italic variant of container face |
| Inline code (`` `code` ``) | IBM Plex Mono | 0.88em | 400 | `ink-soft` | `paper-deep` background, 2px 5px padding, 2px radius |
| Code block (``` ``` ```) | IBM Plex Mono | 13px | 400 | `ink` | `paper-warm` background, 12px 16px padding, 2px radius |
| Blockquote | Inherits | — | — | `ink-faint` | 1px `rule` left border, 16px left padding |
| Table header | Cormorant Garamond | 13px | 500 | `ink` | Uppercase, 1px letter-spacing, `paper-deep` background |
| Table cell | Crimson Pro | 14px | 400 | `ink-soft` | 10px 12px padding, 1px `rule-light` borders |
| List item | Inherits | — | — | — | Bullet: `·` in `ink-ghost`, 8px left of text |
| Link | Inherits | — | — | `margin` | Underline in `margin-dim`, no colour change on hover |
| Math (KaTeX) | KaTeX default | 1.0em | — | `ink` | Centred for display, inline otherwise, `paper-warm` background on display |
| Horizontal rule | — | — | — | `rule` | 1px, 60% column width, centred, 24px vertical margin |

When markdown renders inside a tutor container (Marginalia, Socratic Question), all typefaces inherit the tutor's voice (Cormorant Garamond). When it renders inside a student container (Prose Entry), all typefaces inherit the student's voice (Crimson Pro). The rendered elements never introduce a third voice — the markdown is transparent to the voice system.

---

## Spacing

### The philosophy

The most expensive thing in a well-typeset book is the paper you do not print on — the margins. Ember's spacing is deliberately generous. White space is not "wasted space." It is the space where the student's mind wanders between sentences. It is the visual equivalent of the silence that follows a question.

### The column

All content sits in a single column, centred, with a maximum width of 640px. This is the width of a comfortable line of text in the body typeface at the specified size — approximately 65–75 characters per line, which is the range that typographic research identifies as optimal for sustained reading.

On narrower screens, the column fills the available width with 24px horizontal padding. The content never breaks into multiple columns or grid layouts.

### Vertical rhythm

Vertical spacing follows the rhythm of a notebook page:

| Element | Spacing |
|---|---|
| Between the header and the first content | 36px |
| Between a section label and its content | 16–20px |
| Between notebook entries (student/tutor) | 20px |
| Between sections (separated by a rule) | 32px |
| Before and after a diagram | 28px |
| Before and after a silence marker | 48px |
| Between design principle blocks | 28px (with a 1px rule) |

### Horizontal indentation

The student's text is indented 19px from the left margin. This positions it comfortably inside the main column and creates space for the tutor's margin rule.

The tutor's marginalia uses a 3px-wide vertical rule in `margin` colour at 35% opacity, with 16px of space between the rule and the text. This creates the visual impression of writing in the margin of a notebook.

Design principles and body content beneath a heading are indented 38px from the left — creating a visual subordination to the heading that says "this belongs to the idea above."

---

## Material qualities

### Texture

Ember's surfaces are flat. There are no box shadows, no elevation layers, no card-like surfaces floating above backgrounds. The metaphor is a page on a desk — a single plane. The only depth comes from the contrast between ink and paper.

If a surface must be distinguished (the question block, the mastery suggestion), it is done through a background tint so subtle it barely registers consciously. The tint values are 7–10% opacity of the accent colour. This creates the sense of a faint watercolour wash, not of a coloured card.

### Ambient texture

The notebook's background carries a faint, generative texture layer — a visual atmosphere derived from the session's topic. A session exploring orbital mechanics may carry the ghost of star charts; a session on language may carry the ghost of manuscript pages. The texture is rendered at 4% opacity over the `paper` background, tiling at 512×512px. It is perceptible only at the threshold of consciousness — the student never notices it, but would notice its absence.

The ambient texture is not decoration. It serves the governing metaphor: a desk in a library accumulates the atmosphere of the books that have been open on it. The texture is that atmosphere — a residue of subject matter, not an illustration of it.

Constraints:
- Maximum opacity: 4%. Higher values compete with ink.
- Colour range: monochromatic, derived from `ink-ghost`. No colour that would register as an accent.
- Subject matter: abstract, textural, suggestive. Never representational (no planets, no portraits, no equations). The texture should feel like a watermark, not a wallpaper.
- Fallback: if texture generation fails or is unavailable, the background is plain `paper`. The texture is always optional.

### Borders and rules

Borders in Ember are always 1px, in `rule` or `rule-light` colour. They exist to separate, not to contain. Nothing has a visible box drawn around it.

The tutor's margin rule is 3px wide and 35% opacity — thicker than a border, because it is a semantic marker (this is the tutor's voice), not a structural element.

The tutor's question block has a 2px left border in full `margin` colour. This is the only moment in the interface where a border demands attention.

### Radius

Corner radius is 2px throughout. This is the radius of a very slightly softened edge — not rounded (which suggests a button or a card), but not sharp (which suggests a spreadsheet). It is the radius of a piece of paper that has been handled many times.

### Motion

Animation in Ember is slow and restrained. Entries appear with a vertical translation of 6–8px and a 0.6–0.8s ease transition. The purpose is to create the feeling of words appearing on a page — not of elements flying in from offscreen.

The blinking cursor uses a 1.2s ease cycle, fading between 30% and 0% opacity. It is gentler than a standard text cursor — more like a candle flame than a cursor.

Nothing bounces. Nothing overshoots. Nothing draws attention to itself. Motion in Ember is the motion of a page being turned, not of an interface being animated.
