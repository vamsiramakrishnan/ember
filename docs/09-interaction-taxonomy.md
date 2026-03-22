# Ember — Interaction Taxonomy

## The Five Dimensions of Tutoring

Every tutoring interaction in Ember operates along five dimensions. Each dimension has a purpose, a trigger, and a cost model. When designing new features, map them to this taxonomy.

---

### Dimension 1: Response (What the tutor says)

The tutor's voice takes seven forms, ranked by cognitive weight:

| Form | Entry Type | Weight | When | Cost |
|------|-----------|--------|------|------|
| **Silence** | `silence` | Lightest | After a question. Trust the student to think. | 0 tokens |
| **Marginalia** | `tutor-marginalia` | Light | Default response. Addresses reasoning. | MINIMAL |
| **Question** | `tutor-question` | Medium | Socratic probe. Provokes reasoning. | MINIMAL |
| **Connection** | `tutor-connection` | Medium | Cross-domain bridge. Two ideas meet. | MINIMAL |
| **Directive** | `tutor-directive` | Medium-Heavy | Send student outside the notebook. | MINIMAL + search |
| **Thinker Card** | `thinker-card` | Heavy | Introduce a mind. Name, dates, gift. | MINIMAL + search |
| **Concept Diagram** | `concept-diagram` | Heaviest | Spatial layout of ideas. | MINIMAL |

**Design principle**: The tutor uses the lightest form that serves the moment. Silence before marginalia. Marginalia before questions. Questions before connections.

---

### Dimension 2: Annotation (What the tutor notices)

Annotations are **span-targeted observations** on specific phrases in student or tutor text. They are the Easter eggs of intellectual attention.

| Kind | Purpose | Visual | Frequency |
|------|---------|--------|-----------|
| **Insight** | "You just derived Fourier's first step" | Subtle highlight, warm note | Rare (1 per 5-8 entries) |
| **Trivia** | "'Algorithm' comes from al-Khwārizmī" | Dotted underline, tooltip | Occasional (1 per 3-5 entries) |
| **Connection** | "Shannon proved this in 1948" | Link icon, reference | Occasional |
| **Question** | "But what about irrational frequencies?" | Question mark, follow-up | Common (1 per 2-3 entries) |
| **Correction** | "Close, but the ratio is 3:2, not 2:3" | Gentle correction, no shame | Only when wrong |

**Design principle**: Annotations are discoveries, not corrections. The student should feel like they're finding hidden notes in a library book — someone brilliant was here before them.

---

### Dimension 3: Temporal Awareness (When the tutor remembers)

Four temporal layers, each looking in a different direction:

| Layer | Direction | Entry Type | Trigger | Frequency |
|-------|-----------|-----------|---------|-----------|
| **Echo** | Backward | `echo` | Past student entry resonates | 1 per 5 entries |
| **Connection** | Sideways | `tutor-connection` | Student touches 2+ domains | Per-entry (when warranted) |
| **Bridge** | Forward | `bridge-suggestion` | Mastery ≥ 40% + unexplored edges | 1 per session |
| **Reflection** | Inward | `tutor-reflection` | Every ~10 entries | Periodic |

**Design principle**: A tutor who only responds to the present is a chatbot. A tutor who weaves backward, sideways, forward, and inward is an aristocratic mind.

---

### Dimension 4: Constellation (What the system learns)

Every interaction updates the student's intellectual map. Updates are driven by a background task assessor.

| Record | Created When | Source | Updated When |
|--------|-------------|--------|-------------|
| **Encounter** | Thinker mentioned | Thinker extractor | Status changes (active → bridged) |
| **Lexicon** | New term used | Vocab extractor | Mastery level increases |
| **Mastery** | Concept explored | Mastery updater | Understanding demonstrated |
| **Curiosity** | Question emerges | Bridge generator | Question explored or answered |
| **Library** | Text referenced | Bootstrap + tutor | Annotation count increases |

**Cross-links**: Every constellation record carries `sourceEntryId` — the notebook entry that created it. Clicking a thinker in Constellation navigates to the entry that introduced them.

**Design principle**: The constellation is not a dashboard. It's a mirror — it shows the student the shape of their own intellectual growth.

---

### Dimension 5: Agency (What the student can do)

The student's actions, ranked by intellectual commitment:

| Action | Mechanism | Entry Type | Commitment |
|--------|-----------|-----------|-----------|
| **Write** | Type + Enter | prose/question/hypothesis/scratch | High |
| **Sketch** | Drawing canvas | sketch | High |
| **Branch** | ⑂ button on any entry | Creates new notebook | High — commits to a rabbit hole |
| **Pin** | ⌃ button on questions | Pinned thread | Medium — marks for return |
| **Bookmark** | ◇ button | Bookmark marker | Low — save for later |
| **Annotate** | Margin note | Student annotation | Medium |
| **Mention** | @entity | Reference in text | Low — acknowledges connection |
| **Command** | /action | Slash command | Medium — requests specific help |
| **Select** | Highlight text | Selection toolbar | Low — prepares for action |
| **Cross out** | — button | Strikethrough | Low — retract without delete |

**Design principle**: The student's actions are always additive. Nothing is deleted. Crossed out, not erased. Branched, not abandoned. The notebook accumulates.

---

## Context Tiers

Every AI call uses precisely scoped context. No waste.

| Tier | Tokens | Used By | Principle |
|------|--------|---------|-----------|
| **MINIMAL** | ~50 | Assessor, extractors, annotator | "Is X present? Extract X." Binary classification. |
| **FOCUSED** | ~200 | Mastery updater, annotation agent | "Given existing state, what changed?" Needs records. |
| **STANDARD** | ~500 | Echo, reflection, bridge agents | "Synthesize across recent entries." Needs window. |
| **FULL** | ~800 | Tutor, researcher agents | "Respond thoughtfully." Needs everything. |

**Design principle**: A directed task needs only its target. Assessment needs context. Synthesis needs history. Conversation needs everything. Match context to cognitive requirement.

---

## Branching: The Rabbit Hole

When a student encounters an idea worth pursuing, they can **branch** — fork a new notebook from any entry. The branch:

1. Creates a new notebook titled from the entry content
2. Seeds it with an echo of the branching entry
3. Inherits active thinkers, developing+ vocabulary, and developing+ mastery
4. Starts a fresh session with the branching idea as context
5. The parent notebook continues undisturbed

Branching is Ember's answer to "I want to go deeper." It's not a link — it's a commitment. A new notebook is a new thread of inquiry, with its own constellation, its own thinkers, its own mastery map.

**Visual**: The ⑂ (branch) glyph appears in the entry action bar alongside cross-out, bookmark, and pin.

---

## The Information Architecture of Attention

```
                    NOTEBOOK (the desk)
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    Write/Sketch    Read/React      Branch/Fork
         │               │               │
         ▼               ▼               ▼
    ENTRY CREATED   ANNOTATION      NEW NOTEBOOK
         │          CREATED              │
         │               │               │
         ▼               ▼               ▼
    CONSTELLATION    KNOWLEDGE       INHERITED
    UPDATED          GRAPH           CONTEXT
         │          ENRICHED             │
         ▼               │               ▼
    THINKERS,       EDGES,          FRESH
    VOCABULARY,     NODES,          SESSION
    MASTERY         SPANS
```

Every student action flows through this architecture. Nothing is isolated. Every entry enriches the constellation. Every annotation enriches the knowledge graph. Every branch inherits and extends.
