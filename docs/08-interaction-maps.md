# 08 — Interaction Maps

> Reconciliation of design principles, implemented functionality, and feature capability.
> Each map traces: **Principle → Interaction Pattern → Component → Current State → Gap (if any).**

---

## Map 1: The Student Writes → The Tutor Annotates

**Principle:** I — The Tutor Never Answers First.
**Principle:** V — The Interface is a Notebook, Not a Chat.

```
┌─────────────────────────────────────────────────────────────┐
│                    STUDENT INPUT FLOW                       │
│                                                             │
│  InputZone (7.4)                                            │
│  ├── Textarea (continuous with notebook)                    │
│  ├── Type inference (prose / question / hypothesis / note)  │
│  ├── Slash commands (/visualize)                            │
│  ├── @mention (thinker references)                          │
│  └── Sketch mode toggle                                     │
│                                                             │
│  ──── Enter ────▶ createStudentEntry()                      │
│                     │                                       │
│                     ├──▶ addEntry() → IndexedDB             │
│                     ├──▶ respond() → Tutor pipeline         │
│                     └──▶ checkAndUpdate() → Mastery         │
│                                                             │
│  ──── Tutor responds ────▶                                  │
│                     │                                       │
│                     ├── streaming-text (live tokens)         │
│                     │   └── patchEntryContent (optimistic)   │
│                     │       ├── Local state overlay          │
│                     │       └── Debounced DB write (300ms)   │
│                     │                                       │
│                     └── Final entry replaces streaming-text  │
│                         ├── tutor-marginalia (2.1)           │
│                         ├── tutor-question (2.2)             │
│                         ├── tutor-connection (2.3)           │
│                         ├── concept-diagram (2.4)            │
│                         ├── thinker-card (2.5)               │
│                         ├── tutor-reflection                 │
│                         ├── tutor-directive                  │
│                         ├── visualization                    │
│                         ├── illustration                     │
│                         └── citation                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Status:** Implemented. Streaming path is optimistic (no full DB re-query per token). InputZone shows quiet thinking cursor when tutor is working.

**Known gap:** No compositional grammar enforcement prevents three consecutive tutor entries. The tutor pipeline can produce marginalia + diagram + thinker-card in sequence without a student turn between them. This should be a constraint in the orchestration layer, not the UI.

---

## Map 2: Silence as Interaction

**Principle:** VI — Silence is a Feature.

```
┌──────────────────────────────────────────────────────────┐
│                    SILENCE STATES                        │
│                                                          │
│  After student submits:                                  │
│                                                          │
│  1. InputZone.cursor transitions to "thinking" mode      │
│     ├── Slower blink (2.4s cycle vs 1.2s)                │
│     ├── Ghost opacity (--ink-ghost)                      │
│     └── Hint text hidden ("What are you thinking…" gone) │
│                                                          │
│  2. If streaming available:                              │
│     └── streaming-text entry appears with blinking       │
│         cursor as content arrives                        │
│                                                          │
│  3. If streaming unavailable:                            │
│     └── SilenceMarker (2.6) appears                      │
│         ├── Single blinking cursor (centered)            │
│         ├── Optional text: "considering…"                │
│         └── 48px vertical padding                        │
│                                                          │
│  4. Response arrives → silence resolved                  │
│     └── InputZone returns to normal cursor               │
│                                                          │
│  prefers-reduced-motion:                                 │
│  ├── SilenceMarker: static cursor at 0.3 opacity         │
│  ├── InputZone cursor: static at 0.3 opacity             │
│  └── useRevealSequence: all entries visible instantly     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Status:** Implemented. The streaming-text component acts as both content delivery and thinking indicator. The InputZone `disabled` state shows a quieter cursor.

**Design tension:** Streaming text shows the tutor "thinking aloud" in real time, which partially violates the silence principle. The spec envisions a complete thought arriving at once. Current implementation is a pragmatic choice — streaming reduces perceived latency, and the quiet cursor animation preserves the calm atmosphere.

---

## Map 3: Entry Lifecycle

**Principle:** II — Permanence Over Deletion.

```
┌──────────────────────────────────────────────────────────┐
│                    ENTRY LIFECYCLE                        │
│                                                          │
│  Created                                                 │
│  ├── addEntry() → IndexedDB                              │
│  ├── notify(Store.Entries) → re-query                    │
│  └── Rendered via NotebookEntryRenderer (type dispatch)  │
│                                                          │
│  Interacted                                              │
│  ├── Cross out (student entries only)                    │
│  │   └── Visual strikethrough + 35% opacity              │
│  │   └── Entry remains in notebook (permanence)          │
│  ├── Bookmark (any entry)                                │
│  │   └── Diamond glyph in margin                         │
│  ├── Pin (questions only, max 3)                         │
│  │   └── Appears in PinZone above entry list             │
│  ├── Annotate                                            │
│  │   └── Student margin note attached to entry           │
│  ├── Follow-up (tutor entries only)                      │
│  │   └── Inline question → new tutor response            │
│  ├── Branch (entries with content)                       │
│  │   └── Creates new notebook seeded with entry          │
│  └── Selection actions (link, annotate, highlight, ask)  │
│      └── Text selection toolbar on long-press/select     │
│                                                          │
│  Rendered in list                                        │
│  ├── NotebookEntryWrapper (React.memo)                   │
│  │   ├── Entry renderer (type-dispatched)                │
│  │   ├── Drag handle + type tag (on hover/touch)         │
│  │   ├── Action buttons (on hover/touch)                 │
│  │   ├── SelectionToolbar (on text selection)            │
│  │   ├── FollowUp (on tutor entries)                     │
│  │   └── AnnotationMargin                                │
│  └── Scroll-to-bottom on new entries (rAF-based)         │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Status:** Fully implemented. Permanence enforced — no delete action exists.

---

## Map 4: Three Surfaces

**Principle:** IV-IA — Three Surfaces. Not Five, Not Seven.

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│   Navigation.tsx — Three tabs, quiet typography           │
│   ├── Notebook (Surface 1 — The Desk)                    │
│   ├── Constellation (Surface 2 — The Bookshelf)          │
│   └── Philosophy (Surface 3 — The Star Chart)            │
│                                                          │
│ ─────────────────────────────────────────────────────── │
│                                                          │
│  NOTEBOOK                                                │
│  ├── Linear mode (default)                               │
│  │   ├── Past sessions (collapsed, 55% opacity)          │
│  │   ├── Session header (number, date, topic)            │
│  │   ├── Pin zone (up to 3 pinned questions)             │
│  │   ├── Entry list (aria-live="polite")                 │
│  │   │   └── NotebookEntryWrapper × N                    │
│  │   ├── Marginal reference (right margin, 800px+)       │
│  │   └── InputZone                                       │
│  └── Canvas mode                                         │
│      ├── Concept cards derived from entries               │
│      ├── Bezier connectors between related concepts       │
│      ├── Mouse drag + touch drag (document-level)         │
│      └── Keyboard: arrow keys move focused card           │
│                                                          │
│  CONSTELLATION                                           │
│  ├── Overview (active threads, fluency, thinkers)         │
│  ├── Lexicon (personal vocabulary, mastery levels)        │
│  ├── Encounters (thinker history, session links)          │
│  └── Library (primary texts, reading list)                │
│                                                          │
│  PHILOSOPHY                                               │
│  ├── The framing question                                │
│  └── Six design principles (Roman numerals, prose)        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Status:** All three surfaces implemented. Sub-views in Constellation implemented.

**Known gap:** The spec says Constellation is peripheral ("visited occasionally — perhaps once a week"). The current nav treats all three surfaces with equal visual weight. Consider making the Constellation tab lighter/smaller to signal its peripheral nature.

---

## Map 5: Accessibility Contract

**Principle:** Every element must be usable without a mouse.

```
┌──────────────────────────────────────────────────────────┐
│                  ACCESSIBILITY MAP                       │
│                                                          │
│  Keyboard navigation:                                    │
│  ├── Tab through: nav tabs → entries → actions → input   │
│  ├── Enter: submit text, activate buttons                │
│  ├── Shift+Enter: newline in textarea                    │
│  ├── Escape: clear forced type, close popups             │
│  ├── Arrow keys: move canvas cards (10px step)           │
│  └── Focus-visible: 2px margin-colored outline           │
│                                                          │
│  Screen reader support:                                  │
│  ├── Entry container: aria-live="polite"                 │
│  │   └── New entries announced automatically             │
│  ├── Entry actions: role="group" aria-label              │
│  ├── Canvas cards: role="button" + aria-label            │
│  ├── InputZone: aria-label + aria-busy (thinking)        │
│  ├── Pin zone: role="complementary"                      │
│  └── Mode toggle: aria-current="page"                    │
│                                                          │
│  Motion preferences:                                     │
│  ├── prefers-reduced-motion: reduce                      │
│  │   ├── All CSS animations: none                        │
│  │   ├── useRevealSequence: instant (no stagger)         │
│  │   ├── SilenceMarker cursor: static                    │
│  │   ├── InputZone cursor: static                        │
│  │   └── All transitions: none                           │
│  └── Streaming pulse: slowed to 4s cycle                 │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Status:** Substantially improved. Canvas was previously mouse-only; now has keyboard and ARIA support.

**Remaining gaps:**
- Focus is not explicitly moved to new tutor responses (announced via `aria-live` but not focused).
- MentionPopup and SlashCommandPopup lack focus traps.

---

## Map 6: Performance Architecture

```
┌──────────────────────────────────────────────────────────┐
│                  RENDER OPTIMIZATION                     │
│                                                          │
│  Entry list rendering:                                   │
│  ├── NotebookEntryWrapper: React.memo                    │
│  │   └── Only re-renders when liveEntry reference or     │
│  │       callback references change                      │
│  ├── NotebookEntryRenderer: pure type dispatch            │
│  │   └── No state, no effects — just JSX mapping         │
│  └── Entry actions: inline sub-component                  │
│      └── Shares memo boundary with wrapper               │
│                                                          │
│  Streaming text:                                         │
│  ├── Optimistic local state (Map<id, entry>)             │
│  │   └── Instant UI updates, no DB round-trip            │
│  ├── Debounced IndexedDB writes (300ms)                  │
│  │   └── Batches rapid streaming tokens                  │
│  └── Patch reconciliation:                               │
│      └── Local patch cleared only when DB content        │
│          matches — prevents flicker during streaming      │
│                                                          │
│  Scroll management:                                      │
│  ├── useEffect on entries.length (not setTimeout)        │
│  ├── requestAnimationFrame before scrollIntoView         │
│  └── Smooth scroll behavior                              │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Map 7: Feature Capability vs. Design Spec

### Implemented and Aligned

| Feature | Spec Section | Implementation |
|---------|-------------|----------------|
| Student voice (5 types) | 06, Family 1 | ProseEntry, ScratchNote, HypothesisMarker, Sketch, QuestionBubble |
| Tutor voice (6 types) | 06, Family 2 | Marginalia, SocraticQuestion, Connection, ConceptDiagram, ThinkerCard, SilenceMarker |
| Spatial tools (6 types) | 06, Family 3 | PinnedThread, Card, Table, Group, Bookmark, Divider |
| Canvas mode | 06, Family 4 | CanvasMode, Connector |
| Peripheral elements | 06, Family 5 | SessionHeader, SessionDivider, MasteryBar, BridgeSuggestion, StudentIdentity |
| Ambient elements | 06, Family 6 | MarginalReference, Echo |
| Primitives | 06, Family 7 | Column, MarginZone, PinZone, InputZone |
| Constellation views | 06, Family 8 | LexiconEntry, EncounterRow, PrimaryTextCard |
| Three surfaces | 04 | Notebook, Constellation, Philosophy |
| Permanence | 01, Principle II | Cross-out instead of delete |
| 640px column | 02 | Column primitive enforces max-width |
| Three typefaces only | 02 | Cormorant Garamond, Crimson Pro, IBM Plex Mono |

### Implemented Beyond Spec (Extensions)

| Feature | Rationale | Risk |
|---------|-----------|------|
| `code-cell` | Computational exploration | Violates notebook metaphor — consider removing |
| `image`, `file-upload`, `document` | Rich media capture | Acceptable if styled as notebook inserts, not app widgets |
| `embed` | Web content reference | Violates "no external resources" |
| `visualization` | AI-generated diagrams | Natural extension of ConceptDiagram (2.4) |
| `illustration` | AI-generated images | Natural extension of Sketch (1.4) |
| `streaming-text` | Real-time response | Pragmatic choice; partially violates Principle VI |
| `tutor-reflection` | Tutor synthesis | Reasonable — extends marginalia with explicit synthesis |
| `tutor-directive` | Exploration guidance | Reasonable — named version of marginalia with action |
| `citation` | Source grounding | Reasonable — quiet academic practice |
| `@mention` / `/slash` commands | Power user features | Acceptable if affordances stay peripheral |
| Notebook branching | Thread exploration | Beautiful extension of the notebook metaphor |

### Spec Features Not Yet Enforced

| Feature | Spec Section | Status |
|---------|-------------|--------|
| Voice alternation (max 3 consecutive tutor) | 07 | No enforcement — tutor pipeline permissive |
| Session rhythm (opening → exploration → deepening) | 03 | No structural enforcement |
| "Question first" constraint | 01, Principle I | No pipeline constraint |
| Thinker introduction timing | 01, Principle IV | No contextual gate |
| Mastery as peripheral | 01, Principle III | Nav weight equal across surfaces |

---

## Map 8: Touch and Mobile Interaction

```
┌──────────────────────────────────────────────────────────┐
│                    TOUCH INTERACTIONS                     │
│                                                          │
│  Entry wrapper:                                          │
│  ├── Touch-hold (200ms) reveals handle + actions         │
│  ├── Drag: native HTML5 drag (desktop)                   │
│  └── Touch release clears touch state                    │
│                                                          │
│  Canvas mode:                                            │
│  ├── Touch start on card: begin drag                     │
│  ├── Touch move: document-level listener                 │
│  │   └── preventDefault only during active drag          │
│  │   └── Drag continues even if finger leaves card       │
│  └── Touch end: document-level cleanup                   │
│                                                          │
│  InputZone:                                              │
│  ├── Full textarea on mobile (no cursor illusion)        │
│  ├── Auto-resize height on content change                │
│  └── Sketch mode: full SketchInput takeover              │
│                                                          │
│  Responsive breakpoints:                                 │
│  ├── < 800px: margin zone hidden                         │
│  ├── < 800px: entry actions inline (row, not column)     │
│  └── < 640px: column fills viewport width                │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Status:** Canvas touch drag now works correctly with document-level listeners. Previously, dragging a card outside its bounds broke the drag.

---

## Summary: What Changed in This Pass

### Performance
- NotebookEntryWrapper wrapped in React.memo (prevents N re-renders per entry change)
- Streaming text uses optimistic local state with content-aware patch reconciliation (no flicker)
- Scroll-to-bottom uses rAF + entry count effect instead of setTimeout(50ms)

### Accessibility
- Entry container has `aria-live="polite"` for screen reader announcements
- Canvas cards have `tabIndex`, `role="button"`, `aria-label`, and arrow key navigation
- Entry actions group has `role="group"` instead of unlabeled `div`
- useRevealSequence respects `prefers-reduced-motion` (instant reveal)
- InputZone removes incorrect `role="textbox"` from container div
- InputZone textarea gains `aria-busy` during tutor thinking

### Interaction Quality
- SocraticQuestion hover: border-color transition instead of border-width (no layout shift)
- Canvas touch drag: document-level listeners (drag continues outside card bounds)
- Canvas keyboard: arrow keys move cards by 10px
- InputZone: quieter cursor during tutor thinking state (2.4s cycle, ghost opacity)
- InputZone: slash command regex fixed (works anywhere in text, not just start)
- Drag-over state has transition to prevent visual flicker
- NotebookEntryRenderer has a default case for unknown entry types

---

## Architectural Mechanisms (Durable, Not Patches)

### Mechanism 1: TutorSessionState (`src/state/session-state.ts`)

**Eigen principle traced:** Principles I, III, VI + Interaction Language §3

A shared reactive store between the tutor pipeline and learner UI. Both sides read from and write to the same state, enabling the tutor to make decisions based on what the student is doing *right now*, not just what they typed.

```
┌──────────────────────────────────────────────────────────┐
│                  SESSION STATE SHAPE                     │
│                                                          │
│  Session rhythm:                                         │
│  ├── phase: opening | exploration | deepening | leaving  │
│  ├── studentTurnCount / tutorTurnCount                   │
│  ├── consecutiveTutorEntries (for voice alternation)     │
│  └── lastTutorMode (connection | socratic | etc.)        │
│                                                          │
│  Student awareness:                                      │
│  ├── focus: writing | reading(id) | idle(since) | canvas │
│  ├── activeConcepts: [{term, sourceEntryId, activatedAt}]│
│  └── recentStudentTypes: last 3 entry types              │
│                                                          │
│  Tutor state:                                            │
│  ├── isThinking / isStreaming                             │
│  ├── coveredTopics (avoid repetition)                    │
│  └── introducedThinkers (no duplicate intros)            │
│                                                          │
│  Mastery context:                                        │
│  └── masterySnapshot: [{concept, level, percentage}]     │
│                                                          │
│  Subscriptions: useSyncExternalStore (zero-overhead)     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Writers:** `recordStudentTurn()` from Notebook.tsx, `recordTutorTurn()` from useGeminiTutor, `setTutorActivity()` from tutor pipeline.

**Readers:** Any component via `useSessionState()`. The tutor pipeline reads directly via `getSessionState()`.

---

### Mechanism 2: CompositionGuard (`src/state/composition-guard.ts`)

**Eigen principle traced:** 07-compositional-grammar.md + Principle I + Principle VI

Enforces the spec's grammar rules *before* tutor entries are emitted. Consulted by the tutor pipeline after orchestration returns entries.

```
Rules enforced:
1. Max 2 consecutive tutor entries (3rd deferred until student speaks)
2. No duplicate thinker introductions in same session
3. Echoes spaced: ≥5 entries since last echo
4. Reflections spaced: ≥10 entries since last reflection
5. Bridge suggestions: max one per session
6. Opening phase: max 3 tutor entries total
```

**Verdicts:** `emit` (go ahead), `defer` (wait for student), `suppress` (drop silently).

**Integration:** `filterByComposition(proposedEntries, currentEntries)` called in `useGeminiTutor.ts` after `streamOrchestrate()` returns.

---

### Mechanism 3: EntryGraph (`src/state/entry-graph.ts`)

**Eigen principle traced:** Principle II (Permanence) + Pattern 4 (Accumulation) + Pattern 6 (Definition Evolution)

An in-memory relationship graph between entries. Every relationship has a type, a source, a target, and optional metadata. Enables deep linking, follow-up chains, and cross-referencing.

```
Relationship types:
├── prompted-by    Student entry prompted this tutor response
├── follow-up      This entry follows up on another
├── references     This entry references a concept from another
├── branches-from  This entry branched into a new notebook
├── echoes         Echo entry references original student thought
├── extends        Tutor extends a prior response
├── contradicts    Student hypothesis contradicts prior entry
└── confirms       Tutor confirms student hypothesis

API:
├── addRelation(rel)          Add a relationship
├── getFollowUpChain(id)      Get the full chain from an entry
├── getOutgoing(id)           All relations FROM an entry
├── getIncoming(id)           All relations TO an entry
└── useEntryConnections(id)   React hook for a specific entry
```

**Writers:** `addRelation()` from Notebook.tsx (follow-ups, branches) and useGeminiTutor (prompted-by).

**Readers:** Any component via `useEntryConnections(entryId)`. Future: canvas view shows entry relationships visually.

---

### Mechanism 4: ConstellationProjection (`src/state/constellation-projection.ts`)

**Eigen principle traced:** Principle III (Mastery is Invisible) + §04 (Three Surfaces)

Pure projection functions that map entry types to constellation records. The constellation is a *mirror* of notebook activity, not an independent data store.

```
Entry type          → Constellation record
────────────────────────────────────────────
thinker-card        → Encounter (active)
concept-diagram     → Mastery (exploring, 15%)
bridge-suggestion   → Curiosity thread
question (>20 chars)→ Curiosity thread
tutor-connection    → Mastery (exploring, 10%)
hypothesis          → Mastery (developing, 35%)
```

**Integration:** `projectEntry(liveEntry)` returns a `ProjectionResult` with encounters, mastery, curiosities, and lexicon arrays. `useConstellationSync` applies these projections to IndexedDB.

**Key property:** Pure functions, no side effects, easily testable. The sync hook handles deduplication and persistence.

---

### How the Mechanisms Compose

```
Student types → Enter
    │
    ├── recordStudentTurn()          → SessionState
    ├── setStudentFocus('writing')   → SessionState
    ├── addEntry()                   → IndexedDB
    ├── respond()                    → Tutor pipeline
    │       │
    │       ├── streamOrchestrate()  → [proposed entries]
    │       ├── filterByComposition()→ [filtered entries]  ← CompositionGuard
    │       ├── recordTutorTurn()    → SessionState
    │       ├── addRelation()        → EntryGraph
    │       └── addEntry()           → IndexedDB
    │
    └── useConstellationSync         → Watches entries
            │
            ├── projectEntry()       → ProjectionResult  ← ConstellationProjection
            └── apply to IndexedDB   → Encounters, Mastery, Curiosities
```

Every arrow traces back to a design principle. Every mechanism is independent, composable, and testable in isolation. No mechanism knows about the others — they communicate through the shared entry list and the session state store.

### Design Principle Alignment
- Principle VI (Silence): InputZone reflects thinking state with a quieter cursor
- Principle V (Notebook): no additional chrome added; existing chrome made more subtle
- Motion: all animated surfaces now have prefers-reduced-motion support
