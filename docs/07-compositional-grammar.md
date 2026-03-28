# Ember — Compositional Grammar

## The problem of structured freedom

Every creative tool faces the same tension: too much structure kills expression; too little structure creates chaos. A blank canvas is terrifying. A rigid form is suffocating. The interesting space is between them — where the material has enough structure to hold a shape but enough give to be reshaped by the hand.

Clay is the oldest metaphor for this. Clay has structure — it has mass, cohesion, moisture content, memory. But it yields. You push it and it stays where you push it. It does not snap back to a grid. It does not insist on alignment. It holds the imprint of your thinking.

LEGO is the complementary metaphor. LEGO has discrete units — blocks with fixed geometries that connect in defined ways. But the compositions are infinite. The constraint of the connection system is what makes combinatorial freedom possible. Without the constraints, the blocks would not stack.

Ember's compositional grammar lives in the space between clay and LEGO. Its elements are discrete and typed (they are blocks), but its arrangements are fluid and personal (the page is clay). Structure is present but not imposed. The student discovers structure by using it, not by navigating it.

This document defines how the elements from the Component Inventory combine, what sequences are natural, what arrangements are possible, and what the system does — and does not — enforce.

---

## The two modes of composition

### Linear mode: the stream

The default mode of the notebook is linear — elements flow from top to bottom in chronological order, the way writing flows in a notebook. This is the mode for sustained thinking: the student writes, the tutor responds, the student writes again. The rhythm is conversational, the layout is sequential, and the page reads like a transcript of thought.

In linear mode, elements obey these rules:

**Vertical stacking.** Every element sits below the one before it, separated by its specified bottom margin. There is no horizontal arrangement in linear mode (except for the margin zone on wide screens, which is reserved for the tutor's ambient elements).

**Voice alternation.** The natural rhythm of the notebook alternates between the student's voice and the tutor's voice. Compound responses (see 03-interaction-language.md, §Compound responses) permit sequences of tutor elements that form a single pedagogical move — a connection followed by a thinker card followed by a Socratic question. But the two-beat rule constrains these: at most two heavy elements and one light element per compound response. The tutor does not monologue. Conversely, multiple consecutive student elements are always permitted — the student can write as much as they want before the tutor speaks.

**Gravity.** New elements always appear at the bottom of the notebook. The student cannot insert an element between two existing elements in linear mode. This preserves chronological integrity — the notebook is a record of thinking in time.

**Permanence and revision.** The notebook preserves the record of thought. Submitted entries are not deleted. They can be crossed out (rendered in `ink-ghost` with a horizontal strike), which marks them as superseded while preserving them as a visible trace of thinking. Mistakes are part of the record. Notebooks don't have undo.

However, permanence operates at the level of the *intellectual record*, not at the level of keystrokes. The student can correct a typographical error or rephrase for clarity within a recently submitted entry — this is editing in the sense of a writer reviewing their page, not in the sense of rewriting history. The system preserves the entry's original timestamp and marks edited entries with a quiet "(edited)" notation in `ink-ghost` IBM Plex Mono 9px. The tutor sees both the original and revised text in its context window.

The distinction is: *what you thought* is permanent; *how you typed it* is not. A student who writes "I think the answr is gravity" and corrects it to "I think the answer is gravity" is fixing a typo. A student who writes "I think the answer is gravity" and changes it to "I think the answer is magnetism" is revising their thinking — the original should be preserved as a cross-out, not silently replaced. The system enforces this by limiting in-place edits to a brief window after submission (implementation-dependent, but no more than a few minutes) and by requiring cross-out for substantive changes thereafter.

### Spatial mode: the canvas

When the student opens a canvas (element 4.1), the grammar shifts. Elements within the canvas are freed from vertical stacking and can be positioned in two-dimensional space. This is the mode for relational thinking: arranging ideas to see how they connect, grouping related concepts, mapping a territory.

In spatial mode, elements obey these rules:

**Free positioning.** Elements can be placed anywhere within the canvas bounds. There is no grid snapping by default — the student places things where they feel right, like laying cards on a desk. An optional alignment assist (subtle magnetic guides at 24px intervals, matching the dot grid) can be enabled by holding a modifier key while dragging.

**Overlap is permitted.** Elements can overlap. The most recently moved element renders on top. This is deliberate — a desk has layers. A notebook page has things written over other things. The canvas does not enforce separation.

**Connection.** Elements in the canvas can be connected with hand-drawn-feeling bezier lines (element 4.2). Connections are visual and semantic — they express the student's perception of a relationship. The AI can observe connections but never creates them in canvas mode. The spatial arrangement is the student's.

**Porosity.** Elements can be dragged in from the linear notebook and dragged out from the canvas back to linear flow. The canvas is not a separate world — it is a fold-out page within the notebook. When an element leaves the canvas, it re-enters the linear stream at the insertion point (the current bottom of the notebook).

---

## Compositional patterns

Certain sequences of elements recur naturally in Ember sessions. These are not templates — the system never suggests or enforces them. They are observed patterns, documented here to guide the AI's behaviour and the designer's understanding.

### Pattern 1: The Socratic sequence

The most fundamental pattern in the system.

```
Connection (tutor)
  → Marginalia (tutor)
    → Socratic Question (tutor)
      → Silence
        → Hypothesis Marker (student)
          → Marginalia with confirmation/extension (tutor)
            → Socratic Question (tutor, harder)
              → Silence
```

This is the heart of Bloom's mastery learning enacted in real time. The tutor connects, probes, waits, receives, extends, probes deeper. Each cycle raises the difficulty. The sequence can repeat three or four times within a single session before the student reaches their current mastery edge.

### Pattern 2: The bridge

The pattern that makes Ember feel like aristocratic tutoring.

```
Echo (tutor, referencing a past session)
  → Connection (tutor, linking two interests)
    → Thinker Card (tutor, introducing a relevant thinker)
      → Marginalia (tutor, explaining the thinker's relevance)
        → Socratic Question (tutor)
```

This pattern often opens a session. The tutor reaches back in time (the echo), finds a thread that connects two of the student's interests (the connection), introduces a person who saw that connection centuries ago (the thinker card), and then asks the student to think about it (the Socratic question).

### Pattern 3: The canvas breakout

When linear thinking reaches a limit, the student shifts to spatial thinking.

```
Prose Entry (student, exploring a complex idea)
  → Prose Entry (student, struggling to organise)
    → Scratch Note (student: "there are too many parts to this")
      → [Student opens canvas]
        → Card (student, one aspect of the idea)
        → Card (student, another aspect)
        → Card (tutor, offering a third angle)
        → Connector (student, linking two cards)
        → Sketch (student, drawing a relationship)
      → [Student closes canvas]
    → Prose Entry (student, synthesising what they arranged)
```

The canvas is a *thinking tool*, not a *presentation tool*. The student opens it when they need to see the parts of an idea simultaneously. They close it when they've achieved enough clarity to return to prose. The canvas breakout is always temporary — the notebook reasserts its linear flow.

### Pattern 4: The accumulation

Over many sessions, the student builds a body of cards and concepts. This is the long-game pattern.

```
Session 12: Thinker Card (Kepler introduced)
Session 17: Card (student creates: "Kepler's harmonics = orbital ratios")
Session 23: Bridge Suggestion (Constellation: "Kepler connects to Fourier")
Session 24: Connection (tutor references student's Kepler card from Session 17)
Session 31: Canvas breakout (student arranges all music-mathematics cards spatially)
Session 31: Prose Entry (student writes a synthesis of the entire thread)
```

The accumulation pattern is not a single-session event. It unfolds over weeks and months. It is the reason Ember has persistent memory and continuous notebooks. The student's cards, hypotheses, and thinker introductions from early sessions become the building materials for later syntheses.

### Pattern 5: The quiet correction

When the student's hypothesis is wrong, the tutor does not say "incorrect."

```
Socratic Question (tutor)
  → Silence
    → Hypothesis Marker (student, with an incorrect hypothesis)
      → Marginalia (tutor: "That's an interesting idea. Let me ask you this—")
        → Socratic Question (tutor, designed so that pursuing the student's
           hypothesis leads to a contradiction)
          → Silence
            → Prose Entry (student: "Wait, that doesn't work because...")
              → Marginalia (tutor: "Now you see the same thing Kepler saw
                 when he abandoned circular orbits.")
```

The student discovers their own error through the tutor's questioning. The tutor never announces the error. The correction is the student's, and the credit is the student's. This is the most demanding pattern for the AI to execute, because it requires generating a question that will surface a specific logical contradiction without revealing the answer.

### Pattern 6: The definition evolution

Over time, the student's understanding of a concept deepens. Their early definitions are naive; later definitions are precise. The notebook preserves this evolution.

```
Session 8: Prose Entry (student defines "harmony" as "when things sound nice together")
Session 15: Hypothesis Marker (student revises: "harmony is about whole-number ratios")
Session 23: Prose Entry (student synthesises: "harmony is the mathematical structure
   that makes simple ratios perceptually consonant — Kepler saw this in orbits")
```

The evolution is visible in the Constellation's Lexicon view, where the student's current definition sits alongside the trace of earlier attempts (rendered in `ink-ghost` with horizontal strike). This is the permanence principle made pedagogically valuable — the student can see how their thinking has changed.

### Pattern 7: The etymology bridge

A concept's etymology becomes a bridge to deeper understanding. The tutor uses the word's history to illuminate the idea.

```
Marginalia (tutor: "Notice the root 'harmonia' — it means 'to fit together'")
  → Connection (tutor links to the student's own use of the word)
    → Concept Diagram (showing the word's journey: Greek → Latin → modern usage)
      → Socratic Question (tutor: "If harmony means fitting together,
         what does dis-harmony tell us about the structure it disrupts?")
```

This pattern enriches the Lexicon view over time. Each term accumulates etymological depth through the natural flow of sessions, not through a separate "etymology lesson."

### Pattern 8: The structured teaching sequence

When the tutor needs to teach through structured material rather than conversational marginalia.

```
Connection (tutor: "You asked about how computers decide things.
   Let me show you the idea that started it all.")
  → Reading Material (tutor: "Boolean Algebra" — 4 slides,
     from Boole's original insight to modern logic gates)
    → [Student reads at their own pace]
      → Silence
        → Exercise Set (tutor: 3 problems applying Boolean logic
           to decisions the student encounters)
          → Socratic Question (tutor: "Now — what can Boolean logic
             not express? What kinds of decisions break the model?")
```

The structured teaching sequence respects the two-beat rule by separating the teaching moves with student actions. The reading material is one response. The exercise set is a separate response, delivered only after the student has engaged with the reading. The sequence feels like a single teaching arc, but it unfolds across multiple conversational turns.

### Pattern 9: The media response

When the student brings something from outside the notebook.

```
Image Entry (student: photo of a whiteboard from school)
  → Marginalia (tutor: "I can see the diagram your teacher drew.
     The way they've shown the forces is interesting —
     but notice what's missing.")
    → Inline Response (tutor: targeting a specific part of the image,
       intent: 'explain')
      → Socratic Question (tutor: "Your teacher drew gravity as a
         single arrow. What happens when you consider the other body?")
```

Media entries are treated as student contributions — the tutor responds to them with the same intellectual seriousness as prose. The inline response (9.1) allows the tutor to address a specific aspect of the uploaded content rather than responding to the whole.

### Pattern 10: The practice loop

When the student is at the mastery edge and needs repetition to solidify understanding.

```
Socratic Question (tutor)
  → Silence
    → Prose Entry (student: demonstrates understanding)
      → Marginalia (tutor: confirms and extends)
        → Flashcard Deck (tutor: crystallises the key concepts
           from this sequence into recall cards)
          → Directive (tutor: "Try explaining harmonic ratios
             to someone at home tonight. The test of understanding
             is whether you can make someone else see it.")
```

The practice loop uses flashcards and directives as consolidation tools — they appear only after the student has demonstrated understanding through conversation. They are never the opening move. The directive extends learning beyond the notebook, which is important: aristocratic tutoring happened in a life, not in an app.

---

## The grammar of voices

The notebook is a document with two authors. Their voices must be distinct but harmonious — like two instruments in a duet, not two people talking over each other.

### The student's voice: prose, sketch, space

The student's elements occupy the main column. They are set in Crimson Pro — warmer, more personal, the typeface of private thought. The student's ink is `ink` — the darkest colour in the system. This is their notebook. Their voice is loudest.

The student has access to both linear and spatial tools. They can write, sketch, create cards, open canvases, and draw connections. They can structure their thinking as much or as little as they want. Some students will write long prose. Some will work almost entirely in cards and canvases. The system accommodates both without preference.

### The tutor's voice: margin, annotation, question

The tutor's elements are offset from the main column — either by the 3px margin rule (for marginalia), by the tinted background (for Socratic questions), or by the right-margin position (for ambient references). They are set in Cormorant Garamond — more formal, more authoritative, but lighter in weight. The tutor's ink is `margin` — a warm terracotta that sits beside the student's `ink` without competing.

The tutor has access to a larger palette than the original seven families: marginalia, questions, concept diagrams, thinker introductions, ambient references, cards, reading materials, flashcard decks, exercise sets, illustrations, visualizations, podcasts, code cells, directives, reflections, and citations (see Family 9 in the Component Inventory). But a larger palette does not mean a louder voice. The extended elements obey the same rules: they sit in the margin, they are introduced with context, and they never exceed the two-beat compound response rule. A flashcard deck is still marginalia in spirit — the tutor placing something on the desk for the student to pick up when they're ready.

The tutor cannot create canvases, draw connectors, or pin threads. The spatial arrangement is the student's domain.

### The system's voice: metadata, structure, periphery

The system speaks in IBM Plex Mono — the quietest typeface, at the smallest sizes, in the faintest colours. The system tells you the date, the session number, the mastery percentage. It never interrupts. It never suggests. It answers when consulted (by visiting the Constellation) and is otherwise silent.

---

## The grammar of time

### Within a session

Time flows forward. Elements accumulate. The notebook grows downward. The student cannot rearrange the chronological order of entries outside of a canvas. Inside a canvas, spatial arrangement replaces temporal order — the student is thinking about relationships, not about sequence.

### Across sessions

Sessions are separated by session dividers (element 5.2) but exist in a continuous scroll. The student can scroll backward through all previous sessions without leaving the notebook. There is no "session archive" or "history page." The notebook *is* the history.

The tutor references past sessions through echoes (element 6.2) and connections (element 2.3). These references are woven into the conversation naturally, never presented as "recall" or "review." The student experiences continuity, not retrieval.

### Over months and years

The Constellation view (Surface 2) is the long-timescale view. It shows the accumulated result of many sessions: the curiosity vector, the mastery map, the intellectual lineage. It changes slowly — a new thinker enters the orbit every few weeks; a concept reaches fluency over months.

The Constellation is never urgent. There is no "weekly progress report." The student visits it when they feel reflective, and what they find there is a quiet record of how far they've come.

---

## What the grammar forbids

### No nested containers

Elements do not contain other elements (except groups, which are visual associations, not structural containers). There are no "sections within sections" or "tabs within tabs." The notebook is flat. The canvas is the only dimensional expansion, and it exists inline, not as a layer.

### No drag-and-drop in linear mode

The student cannot rearrange elements in the linear notebook by dragging them. Chronological order is sacred in linear mode. If the student wants to rearrange, they open a canvas. This constraint preserves the notebook's integrity as a record of thought.

### No templates

The system never offers a template: "Would you like to start with a compare-and-contrast table?" or "Here's a framework for your analysis." Templates impose structure before thinking has begun. Ember's structure emerges from the student's thinking, not before it.

### No auto-formatting

The system does not auto-correct, auto-capitalise, auto-complete, or auto-suggest. The student's text appears exactly as they type it. If a 10-year-old types in all lowercase with no punctuation, the notebook accepts it. The notebook is honest about who the student is right now.

### No notifications from within

The notebook never interrupts itself. There is no "You've been studying for 30 minutes" prompt. There is no "Your mastery in Number Theory has increased." There is no nudge to return after absence. The notebook is there when the student opens it, exactly as they left it, as patient as a book on a shelf.

---

## The feeling

When all of these rules are enacted together, the compositional grammar produces a specific feeling. It is the feeling of a desk in a quiet room where everything you need is within reach but nothing is in the way. The paper is there. The pen is there. The books are on the shelf behind you. A thoughtful person is sitting across from you, waiting for you to speak.

That is the feeling. Everything in this grammar exists to produce it. Anything that does not contribute to it is removed.
