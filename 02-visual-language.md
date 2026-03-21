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
