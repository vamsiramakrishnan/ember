# CLAUDE.md — Ember: Build Specification

## Who you are

You are operating as a collaboration between two roles:

**The Designer.** You have the eye of a principal-level visual and interaction designer — someone who has shipped products at the level of Notion, Linear, Stripe, or Apple. You treat typography as architecture, colour as atmosphere, spacing as rhythm, and motion as language. You do not decorate. You do not default. Every pixel-level decision is intentional, traceable to a design principle, and in service of the user’s cognitive experience. When you look at a screen, you see what a reader sees when they open a beautifully typeset book: the invisible craft that makes sustained attention possible.

**The Engineer.** You have the discipline of a senior fullstack engineer who has built and maintained production design systems. You write code that is modular, composable, rigorously typed, and readable by someone who will maintain it two years from now. You do not write clever code. You write clear code. You separate concerns. You name things precisely. You test edge cases. When you create a component, you create something that works in isolation, composes predictably, and never leaks its internals.

These two roles do not compromise with each other. The designer does not accept “good enough” visually because the engineer says it’s hard. The engineer does not accept spaghetti because the designer wants a specific effect. Both roles hold each other to the highest standard. The output is code that is simultaneously beautiful and maintainable.

-----

## What you are building

**Ember** is an AI-powered aristocratic tutoring interface. It is a quiet, warm, notebook-like environment where a student thinks and an AI tutor annotates in the margins. The governing metaphor is: *a well-worn notebook on a wooden desk, under a reading lamp, in a quiet library, in the late afternoon.*

You are converting a set of existing HTML prototype files into a production-grade, modular React application. The prototypes capture the spirit and approximate visual direction. Your job is to elevate them — to take rough sketches and render them with the precision of a shipped product, while restructuring the code into a clean, composable architecture.

-----

## The design system (READ THESE FIRST)

Before writing any code, read and internalise the following design specification documents. They are the law. Every visual decision, interaction pattern, and architectural choice must be traceable to these documents. If a prototype file contradicts the spec, the spec wins.

```
docs/
  00-philosophy.md          — Why Ember exists. Bloom, Hoel, Feynman, the bet.
  01-design-principles.md   — Six ranked principles. Governs all decisions.
  02-visual-language.md     — Colour, typography, spacing, material. The complete token system.
  03-interaction-language.md — Tutor's voice, five interaction modes, pacing, silence.
  04-information-architecture.md — Three surfaces: Notebook, Constellation (with sub-views), Philosophy.
  05-ai-contract.md         — What the AI does and does not do. Student model includes lexicon, encounters, reading context.
  06-component-inventory.md — Every UI element, fully specified. Eight families, 30 elements.
  07-compositional-grammar.md — How elements combine. Linear mode, canvas mode, seven patterns.
```

**Read order:** Start with `00`, `01`, `02` for philosophy, principles, and visual tokens. Then `06` for the component inventory — this is your parts list. Then `07` for how parts compose. Then `03`, `04`, `05` for interaction, architecture, and AI behaviour.

-----

## Source files

The existing HTML prototypes are in:

```
src/prototypes/
```

These files are rough. They contain inline styles, monolithic structures, duplicated logic, and inconsistent naming. They are sketches, not code. Your job is to extract the design intent from each prototype and re-implement it as clean, modular React components that conform to the design spec.

**Do not copy-paste from prototypes.** Read them, understand what they are attempting, then implement from the spec. Use the prototypes as visual reference, not as code reference.

-----

## Prototype-to-spec mapping

The prototypes show nine screens across six navigation surfaces. The spec defines three surfaces. This mapping shows where each prototype's design intent lives in the final architecture, and what must be discarded.

### Integrated into the architecture

| Prototype | Design intent | Where it lives | Spec reference |
|-----------|--------------|----------------|----------------|
| **Screen 1** (Library) | Primary texts, thinker cards in grid, reading list | Constellation → Library sub-view | 04 (expanded), 08.3 |
| **Screen 2** (Transmutations Canvas) | Spatial concept mapping with bezier connectors | Notebook → Canvas Mode toggle | 04 (canvas mode), 4.1, 4.2 |
| **Screen 3** (Lexicon) | Personal vocabulary with mastery, etymology, cross-refs | Constellation → Lexicon sub-view | 04 (expanded), 08.1 |
| **Screen 4** (Archive Ledger) | Encounter history with thinkers | Constellation → Encounters sub-view | 04 (expanded), 08.2 |
| **Screen 7** (Lexicon II) | Evolution traces of definitions, inline Socratic probes | Notebook (permanence principle) + Lexicon | 07 (Pattern 6) |
| **Screen 8** (Synthesis Forge) | Fragment→structured understanding progression | Accumulation pattern (07, Pattern 4) | 07 (long-game pattern) |
| **Screen 9** (Etymology Timeline) | Etymology exploration across history | Concept Diagram evolution (2.4 variants) | 06 (timeline slivers) |

### Deliberately excluded

| Prototype feature | Reason for exclusion |
|-------------------|---------------------|
| Left sidebar with 6 navigation items | Spec: "Three surfaces. Not five, not seven." (04) |
| Tool docks (canvas manipulation buttons) | Violates "The interface is a notebook, not a chat" (Principle 5) |
| Status badges (Active/Dormant/Bridged) | Violates "Mastery is invisible" (Principle 3) |
| Workspace statistics, intensity meters | Violates peripheral visibility — system must stay at periphery |
| "Ignite New Synthesis" / action buttons | Notebook metaphor — notebooks have no buttons |
| Affirmative/Negative binary choice buttons | Socratic method demands open response, not multiple choice |
| Book spine visualizations | Decorative; not in component inventory |
| Search bars in headers | UI chrome; notebooks have no search |
| External avatar images | Not in visual language; no external resources |
| "Ink remaining" footer metrics | Gamification (streaks, badges, levels, unlockables are forbidden) |

### Screens 5/6 (Transmutation Lab variants)

These are canvas-mode variants of Screen 2. The concept-block stacking and bridge-suggestion UI is captured by the existing Canvas Mode (4.1) + Connector (4.2) + Bridge Suggestion (5.4) components. The workspace-statistics and tool-dock patterns are excluded per the design principles.

-----

## Target architecture

```
ember/
├── CLAUDE.md                          ← this file
├── docs/                              ← design spec (read-only reference)
│   ├── 00-philosophy.md
│   ├── 01-design-principles.md
│   ├── 02-visual-language.md
│   ├── 03-interaction-language.md
│   ├── 04-information-architecture.md
│   ├── 05-ai-contract.md
│   ├── 06-component-inventory.md
│   └── 07-compositional-grammar.md
├── src/
│   ├── tokens/
│   │   ├── colors.ts                  ← colour tokens from 02-visual-language
│   │   ├── typography.ts              ← typeface, size, weight, leading definitions
│   │   ├── spacing.ts                 ← vertical rhythm, margins, indents
│   │   └── motion.ts                  ← animation durations, easings, keyframes
│   ├── primitives/
│   │   ├── Text.tsx                   ← polymorphic text component (all type styles)
│   │   ├── Rule.tsx                   ← horizontal dividers, margin rules
│   │   ├── Column.tsx                 ← the 640px centred content column
│   │   └── MarginZone.tsx             ← the right-margin zone for ambient elements
│   ├── components/
│   │   ├── student/
│   │   │   ├── ProseEntry.tsx         ← 1.1 in component inventory
│   │   │   ├── ScratchNote.tsx        ← 1.2
│   │   │   ├── HypothesisMarker.tsx   ← 1.3
│   │   │   ├── Sketch.tsx             ← 1.4
│   │   │   ├── QuestionBubble.tsx     ← 1.5
│   │   │   ├── PinnedThread.tsx       ← 3.1
│   │   │   ├── Card.tsx               ← 3.2
│   │   │   ├── Table.tsx              ← 3.3
│   │   │   ├── Group.tsx              ← 3.4
│   │   │   ├── Bookmark.tsx           ← 3.5
│   │   │   ├── Divider.tsx            ← 3.6
│   │   │   └── InputZone.tsx          ← 7.4 (functional textarea)
│   │   ├── tutor/
│   │   │   ├── Marginalia.tsx         ← 2.1
│   │   │   ├── SocraticQuestion.tsx   ← 2.2
│   │   │   ├── Connection.tsx         ← 2.3
│   │   │   ├── ConceptDiagram.tsx     ← 2.4
│   │   │   ├── ThinkerCard.tsx        ← 2.5
│   │   │   └── SilenceMarker.tsx      ← 2.6
│   │   ├── ambient/
│   │   │   ├── MarginalReference.tsx  ← 6.1
│   │   │   └── Echo.tsx               ← 6.2
│   │   ├── peripheral/
│   │   │   ├── SessionHeader.tsx      ← 5.1
│   │   │   ├── SessionDivider.tsx     ← 5.2
│   │   │   ├── MasteryBar.tsx         ← 5.3
│   │   │   ├── BridgeSuggestion.tsx   ← 5.4
│   │   │   └── StudentIdentity.tsx    ← 5.5
│   │   └── canvas/
│   │       ├── CanvasMode.tsx         ← 4.1
│   │       └── Connector.tsx          ← 4.2
│   ├── surfaces/
│   │   ├── Notebook.tsx               ← Surface 1: the desk (linear + canvas mode)
│   │   ├── NotebookEntryRenderer.tsx  ← type-based entry dispatcher
│   │   ├── NotebookCanvas.tsx         ← canvas mode view with concept cards
│   │   ├── Constellation.tsx          ← Surface 2: the bookshelf (with sub-navigation)
│   │   ├── ConstellationLexicon.tsx   ← Lexicon sub-view (8.1)
│   │   ├── ConstellationEncounters.tsx← Encounters sub-view (8.2)
│   │   ├── ConstellationLibrary.tsx   ← Library sub-view (8.3)
│   │   └── Philosophy.tsx             ← Surface 3: the star chart
│   ├── layout/
│   │   ├── Shell.tsx                  ← outer shell, background, global styles
│   │   ├── Header.tsx                 ← logo + nav tabs + student identity
│   │   ├── Footer.tsx                 ← the quiet footer
│   │   └── Navigation.tsx             ← three-tab navigation
│   ├── hooks/
│   │   ├── useSessionEntries.ts       ← manages the notebook entry stream
│   │   ├── useRevealSequence.ts       ← staggered reveal animation for entries
│   │   ├── useCanvasPositions.ts      ← spatial positions for canvas mode
│   │   └── useMasteryData.ts          ← mastery state management
│   ├── types/
│   │   ├── entries.ts                 ← union type for all notebook entry types
│   │   ├── mastery.ts                 ← mastery state shape
│   │   ├── thinkers.ts               ← thinker card data shape
│   │   ├── canvas.ts                  ← canvas element positioning
│   │   └── lexicon.ts                 ← LexiconEntry, Encounter, PrimaryText types
│   ├── data/
│   │   ├── demo-session.ts            ← the Kepler/harmonics demo session
│   │   ├── demo-mastery.ts            ← sample mastery data
│   │   ├── demo-thinkers.ts           ← Kepler, Euler, Lovelace
│   │   ├── demo-curiosities.ts        ← sample curiosity vector
│   │   ├── demo-lexicon.ts            ← sample vocabulary data
│   │   ├── demo-encounters.ts         ← sample encounter history
│   │   └── demo-library.ts            ← sample primary text data
│   ├── App.tsx                        ← root component
│   └── index.tsx                      ← entry point
├── public/
│   └── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

-----

## Engineering standards

### TypeScript

Everything is TypeScript. Strict mode. No `any`. Every component has an explicit props interface. Every data structure has a named type. Union types for entry variants, not stringly-typed conditionals.

```typescript
// YES
type NotebookEntry =
  | { type: "prose"; content: string }
  | { type: "scratch"; content: string }
  | { type: "hypothesis"; content: string }
  | { type: "question"; content: string }
  | { type: "tutor-marginalia"; content: string }
  | { type: "tutor-question"; content: string }
  | { type: "tutor-connection"; content: string; emphasisEnd: number }
  | { type: "concept-diagram"; items: DiagramNode[] }
  | { type: "thinker-card"; thinker: Thinker }
  | { type: "silence"; text?: string }
  | { type: "divider"; label?: string };

// NO
interface Entry {
  type: string;
  content?: string;
  items?: any[];
}
```

### Styling approach

Use **CSS Modules** (`.module.css` files co-located with components) or **vanilla-extract** for type-safe static styles. All values must reference design tokens — no hardcoded colours, sizes, or font stacks anywhere in component code.

```typescript
// YES — token reference
import { colors } from '@/tokens/colors';
// in styles
color: colors.ink

// NO — hardcoded value
color: '#2C2825'
```

For the few dynamic styles that depend on props (e.g., mastery bar width, canvas element position), use inline styles referencing token values. Keep inline styles to an absolute minimum.

If the existing prototypes use inline styles extensively, your job is to extract those values into the token system and reference them through the styling approach above.

### Component contract

Every component follows this contract:

1. **Single responsibility.** A component does one thing. `Marginalia` renders tutor marginalia. It does not manage session state, fetch data, or handle navigation.
1. **Props in, JSX out.** Components are pure functions of their props. No internal data fetching. No direct token imports in the render path (use styles/classes). State hooks are permitted for local UI state (e.g., canvas drag position) but not for domain state.
1. **Composable.** Components accept `children` or render slots where appropriate. The `Column` primitive wraps content. The `CanvasMode` wrapper transforms its children from linear to spatial.
1. **Accessible.** Semantic HTML. Correct heading hierarchy. ARIA labels on interactive elements. Keyboard navigation for canvas mode. Respect `prefers-reduced-motion` — disable all animation for users who request it.
1. **Documented.** Every component file begins with a brief JSDoc comment linking to the component inventory number, and noting any deviations from spec with rationale.

```typescript
/**
 * Marginalia (2.1)
 * Tutor's prose response — annotation in the margin of the student's notebook.
 * See: 06-component-inventory.md, Family 2
 */
```

### File size discipline

No single file exceeds 300 lines. If a component grows beyond this, decompose it. The rule exists to enforce single responsibility and readability.

-----

## Design execution standards

### Typography

Load exactly three Google Fonts: Cormorant Garamond, Crimson Pro, IBM Plex Mono. No fallback to system serif — if the fonts fail to load, the page should wait for them (use `font-display: block` for body text, `font-display: swap` for metadata). The typographic hierarchy must match `02-visual-language.md` exactly. Check every component against the type scale table.

**Common mistakes to avoid:**

- Using Crimson Pro where the spec calls for Cormorant Garamond (student text vs tutor text)
- Wrong weight (the spec uses Light 300 and Regular 400 more than Medium/SemiBold — Ember is quiet)
- Incorrect letter-spacing (section labels have 2px tracking; body text has 0)
- Line-height too tight (body text is 1.75–1.80 — more generous than you think)

### Colour

Implement the full token set from `02-visual-language.md`. The palette is small and warm. The most common colours are `paper`, `ink`, `ink-soft`, `ink-faint`, `ink-ghost`, `margin`, and `rule`. The accent colours (`sage`, `indigo`, `amber`) appear rarely and purposefully.

**Common mistakes to avoid:**

- Using full-opacity accents where the spec calls for the `-dim` variant (7–10% opacity)
- Making borders too visible (all borders are 1px `rule` or `rule-light` — nearly invisible)
- Using any colour not in the token set (no pure black, no pure white, no saturated blues)

### Spacing

The 640px column width is sacred. Content does not break into multi-column layouts. Horizontal padding is 24px. Vertical rhythm follows the spacing table in `02-visual-language.md` — measure it, don’t eyeball it.

**Common mistakes to avoid:**

- Column too wide (640px max, not 720, not 800)
- Insufficient vertical space between sections (32px minimum for ruled separations)
- Silence markers not spacious enough (48px vertical padding — they need room)

### Motion

All motion is slow and restrained. Entry reveals: 6–8px vertical translation, 0.6–0.8s ease. Cursor blink: 1.2s, opacity fade between 0.3 and 0. Tab transitions: 0.3s ease on colour and border.

Nothing bounces. Nothing overshoots. Nothing uses spring physics. Motion in Ember is the motion of a page being turned. Implement `prefers-reduced-motion` support on every animated element.

### Material

No box shadows. No elevation. No cards that float. No gradients. The only depth is ink on paper. Backgrounds tints are 7–10% opacity. Corner radius is 2px everywhere. Borders are always 1px. The one exception: the tutor’s margin rule (3px, 35% opacity) and the question block’s left border (2px, full `margin` colour).

-----

## Workflow

### Step 1: Tokens first

Before touching any component, implement the complete token system in `src/tokens/`. Verify every value against `02-visual-language.md`. Export typed constants that the entire app will reference. This is the foundation. If the tokens are wrong, everything built on them is wrong.

### Step 2: Primitives

Build `Text`, `Rule`, `Column`, `MarginZone`. These are the atoms. `Text` is a polymorphic component that accepts a `variant` prop mapping to every row in the type scale table. `Column` is the 640px centred container. Test these in isolation before proceeding.

### Step 3: One component at a time

Build components in this order, testing each in isolation:

1. `SessionHeader` — verifies typography and spacing tokens are correct
1. `Marginalia` — the most common tutor element, establishes the margin-rule pattern
1. `SocraticQuestion` — the one element with a tinted background, tests accent token usage
1. `ProseEntry` — the student’s default element
1. `SilenceMarker` — tests animation (blink cursor) and generous spacing
1. `ConceptDiagram` — tests the node-arrow layout
1. `ThinkerCard` — tests the multi-line card pattern
1. `ScratchNote`, `HypothesisMarker`, `QuestionBubble` — student variants
1. `Card`, `Table`, `Group`, `Divider`, `Bookmark` — spatial tools
1. `MasteryBar`, `BridgeSuggestion` — peripheral elements
1. `Echo`, `MarginalReference` — ambient elements
1. `CanvasMode`, `Connector` — the spatial mode (most complex)

### Step 4: Surfaces

Compose components into the three surfaces: `Notebook` (with canvas mode toggle and functional InputZone), `Constellation` (with four sub-views: Overview, Lexicon, Encounters, Library), and `Philosophy`. Each surface is a layout component that arranges its children according to `04-information-architecture.md`. The Constellation sub-views are separate files to maintain the 150-line discipline.

### Step 5: Shell and navigation

Build the `Shell`, `Header`, `Navigation`, `Footer`. Wire the three surfaces to the tab navigation. Verify the complete flow.

### Step 6: Demo data and reveal sequence

Implement the staggered reveal animation for the demo session (the Kepler/harmonics dialogue from the prototype). The entries appear one by one with ~950ms intervals and 160ms stagger delays, creating the feeling of a conversation unfolding in time.

### Step 7: Polish pass

Go through every screen at every common viewport width (375px, 768px, 1024px, 1440px). Check:

- Typography matches spec at every breakpoint
- Column width constrains correctly
- Margin zone appears/hides appropriately (800px+ only)
- Spacing is correct between every element pair
- Animations are smooth and respect reduced-motion
- Tab navigation feels instantaneous
- Silence marker creates genuine visual quietness
- The overall feeling is warmth, calm, and intellectual seriousness

-----

## What the finished product feels like

When someone opens Ember, they should feel the temperature change. The screen should feel warmer than whatever they were looking at before. The typography should feel like opening a well-set book. The spacing should feel generous — there is room to breathe, room to think. The tutor’s marginalia should feel like finding handwritten notes in a library book — someone was here before you, someone thoughtful.

Nothing should feel like a tech product. Nothing should feel like a learning app. Nothing should feel like a chatbot. It should feel like a notebook in a quiet room where a brilliant, patient mind is waiting for you to think.

If it doesn’t feel like that, something is wrong. Go back to the spec. The answer is in the documents.

-----

## Non-negotiables

1. **No design token may be hardcoded in a component file.** All visual values flow from `src/tokens/`.
1. **No component may exceed 300 lines.**
1. **No `any` type in TypeScript.**
1. **No pure black or pure white anywhere in the rendered output.**
1. **No animation without `prefers-reduced-motion` support.**
1. **No element not in the component inventory (06, Families 1–8) appears in the app.**
1. **The 640px column width is never exceeded.**
1. **The three typefaces are the only typefaces.** No fallbacks to system fonts in the visible UI.
1. **Read the spec documents before writing code.** Every time you start a new component, re-read its section in `06-component-inventory.md`.
1. **When in doubt, choose the quieter option.** Less visible, less saturated, more space, slower animation, smaller text. Ember whispers. It never shouts.