# Ember — Component Inventory

## On the nature of the elements

Every element in Ember is a *block*. Not in the Notion sense of a generic content container, but in the sense of a unit of thought — a thing someone wrote, drew, asked, pinned, or connected. Blocks have two fundamental properties: they are *typed* (each block knows what kind of thought it is) and they are *placeable* (each block can exist on the page, on the canvas, or in the margin).

The inventory below is exhaustive. If an element does not appear here, it does not exist in Ember. New elements are added only when an existing element cannot serve the need, and only after demonstrating that the new element earns its cognitive cost.

The elements are organised into seven families, based on whose voice they carry.

---

## Family 1: The Student's Voice

These are the elements the student creates. They are the primary text. Everything else in the system exists to serve, annotate, or extend them.

---

### 1.1 — Prose Entry

**What it is.** A paragraph of the student's writing. The most common element in the notebook. This is the student thinking in sentences.

**Visual specification.**
- Typeface: Crimson Pro, 18px, Regular (400)
- Colour: `ink`
- Line-height: 1.80
- Left indent: 19px from column edge
- Bottom margin: 20px

**Behaviour.** The student types freely. There is no character limit. A prose entry can be one sentence or ten paragraphs. It becomes permanent in the notebook upon submission. It cannot be deleted by the student — only by an explicit "cross out" action that renders it in `ink-ghost` with a single horizontal strike, preserving it as a visible trace of thinking. Mistakes are part of the record. Notebooks don't have undo.

**Compositional rules.** A prose entry can be followed by any element. It can be preceded by any element. It is the default block — the thing that happens when the student simply starts writing.

---

### 1.2 — Scratch Note

**What it is.** A small, informal fragment of the student's thinking. Not a full sentence. A half-formed idea, a word, a question mark, a "wait..." — the cognitive equivalent of scribbling in the margin of your own notebook.

**Visual specification.**
- Typeface: Crimson Pro Italic, 15px, Light (300)
- Colour: `ink-soft`
- Line-height: 1.60
- Left indent: 19px
- Background: none
- Bottom margin: 12px
- A small `·` glyph in `ink-ghost` precedes the note, set 8px to its left

**Behaviour.** Created when the student prefixes their input with a specific gesture (a double-tap, a swipe-right, or a keyboard shortcut — platform-dependent). The gesture signals "this isn't a full thought yet." Scratch notes are visually lighter than prose entries, signalling tentativeness.

**Compositional rules.** Scratch notes cluster. Multiple scratch notes in sequence form a visual group with reduced spacing (8px between them instead of 12px). This creates the visual impression of a burst of fragmentary thinking — the way someone scribbles several things quickly in the margin of a notebook.

---

### 1.3 — Hypothesis Marker

**What it is.** A special form of prose entry that the student explicitly marks as a guess, a prediction, or a hypothesis. This is the student saying "I think the answer is..." before they know.

**Visual specification.**
- Typeface: Crimson Pro, 18px, Regular (400)
- Colour: `ink`
- Line-height: 1.80
- Left indent: 19px
- Left border: 2px solid `indigo` at 40% opacity
- Left padding: 14px (inside the border)
- Background: `indigo-dim`
- Border-radius: 2px
- Bottom margin: 20px

**Behaviour.** Created when the student uses a hypothesis gesture or prefix (e.g., typing "I think..." triggers a suggestion to mark it as a hypothesis, which the student can accept or ignore). Hypotheses are special because the system remembers them. When the student later arrives at the correct understanding, the tutor can reference the hypothesis: "Three weeks ago, you guessed that the analogy would break down because of gravity. You were closer than you thought."

**Compositional rules.** A hypothesis is often followed by a tutor response (confirmation, Socratic question, or extension). It can also be followed by silence — the tutor deliberately letting the hypothesis sit.

---

### 1.4 — Sketch

**What it is.** A freeform drawing by the student. A diagram, a doodle, an arrow connecting two ideas, a rough graph. This is the student thinking visually.

**Visual specification.**
- Canvas area: full column width (max 560px), variable height (minimum 120px, expands with content)
- Background: `paper-warm` (slightly lighter than the page, creating the sense of a cleared space)
- Border: 1px `rule-light`, top and bottom only
- Drawing colour: `ink-soft` (slightly lighter than text, mimicking pencil)
- Stroke weight: 2px default, variable with pressure on supported devices
- Border-radius: 0 (sharp edges — this is a section of the page, not a card)

**Behaviour.** The student enters sketch mode through a gesture (two-finger tap, or a toolbar icon that appears only when the input area is focused). The sketch area is a minimal canvas — no colour picker, no shape tools, no text tool. Just a pencil. The constraint is intentional. Sketches in Ember should feel like sketches in a notebook: quick, rough, expressive.

On devices without touch input (laptops), the sketch element can accept a simple node-and-arrow diagram built from typed labels and directional connectors, using keyboard input. This hybrid mode preserves the spatial thinking without requiring a stylus.

**Compositional rules.** A sketch can exist between any two elements. It often follows a Socratic question (the student draws their thinking instead of writing it) or accompanies a prose entry (the student writes a sentence and draws a diagram beside it — see §Canvas Mode in the Compositional Grammar).

---

### 1.5 — Question Bubble

**What it is.** A question the student asks the tutor. Distinguished from a prose entry by its intent — this is a direct request for the tutor's attention.

**Visual specification.**
- Typeface: Crimson Pro Italic, 17px, Regular (400)
- Colour: `ink`
- Line-height: 1.70
- Left indent: 19px
- A small `?` glyph in `ink-faint` Cormorant Garamond, 14px, positioned 6px to the left of the text

**Behaviour.** Created when the student's input ends with a question mark, or when they explicitly mark it as a question. Question bubbles are indexed in the student model. Over time, the student's questions form a record of their intellectual evolution — visible in the Constellation as the curiosity vector.

**Compositional rules.** A question bubble is almost always followed by a tutor element — marginalia, a Socratic question, or a connection.

---

## Family 2: The Tutor's Voice

These are the elements generated by the AI. They are marginalia — secondary to the student's writing, present to annotate, question, and extend.

---

### 2.1 — Marginalia

**What it is.** The tutor's prose response. An annotation in the margin of the student's notebook. This is the most common tutor element.

**Visual specification.**
- Typeface: Cormorant Garamond, 17.5px, Regular (400)
- Colour: `margin`
- Line-height: 1.75
- Layout: CSS grid — `3px 1fr` with 16px gap
- The 3px column contains a vertical rule in `margin` at 35% opacity, full height of the text
- Bottom margin: 20px

**Behaviour.** Marginalia appears after the student writes or after a silence. It is never the first thing in a session — the tutor waits for the student, or opens with a connection (see 2.3). Marginalia can be brief (a single sentence of confirmation) or extended (a paragraph of explanation). It is never longer than the student's preceding entry. The tutor's voice must not dominate the page.

**Compositional rules.** Marginalia can follow any student element. It is often followed by a Socratic question (2.2) or by silence. It is never followed by another marginalia entry — the tutor does not monologue.

---

### 2.2 — Socratic Question

**What it is.** A question the tutor asks the student. The most important element in the system. This is where Bloom's mastery learning and Feynman's principle converge.

**Visual specification.**
- Typeface: Cormorant Garamond Italic, 18px, Regular (400)
- Colour: `ink` (not `margin` — the question belongs to the student's space now)
- Line-height: 1.75
- Background: `margin-dim`
- Left border: 2px solid `margin`
- Padding: 20px 24px
- Border-radius: 2px
- Bottom margin: 24px

**Behaviour.** The Socratic question is the one moment where the interface raises its voice. The background tint and left border create a visual container that says "this deserves your full attention." After the question is rendered, the system enters silence mode (see 2.6).

**Compositional rules.** A Socratic question is always preceded by at least one marginalia or connection element. It is always followed by silence. It is never followed by another tutor element — the tutor asks and then waits.

---

### 2.3 — Connection

**What it is.** The tutor drawing a line between two things the student already knows or cares about. This is the opening move of most sessions and the element that makes Ember feel like aristocratic tutoring.

**Visual specification.** Identical to marginalia (2.1), but with a subtle difference: the first sentence is set in Cormorant Garamond Medium (500) rather than Regular, giving it slightly more weight. This signals "pay attention — I'm connecting something." The remaining sentences revert to Regular.

**Behaviour.** Connections always reference the student's own history — a question they asked, an idea they explored, an interest they expressed. The AI cannot make a connection from nothing. It must draw from the student model.

**Compositional rules.** Connections typically open a session or introduce a new thread within a session. They are followed by marginalia, a Socratic question, or a concept diagram.

---

### 2.4 — Concept Diagram

**What it is.** A visual representation of a relationship between ideas. The tutor's version of a whiteboard sketch — quick, clear, focused on the structure of the relationship rather than aesthetic polish.

**Visual specification.**
- Container: full column width, bordered top and bottom with 1px `rule`
- Padding: 20px 0
- Inner layout: flex row, centred, wrapping
- Each node:
  - Label: Cormorant Garamond, 16px, Medium (500), `ink`
  - Sub-label: IBM Plex Mono, 10px, Light (300), `ink-faint`
  - Horizontal padding: 20px
- Connectors between nodes: `→` glyph in Cormorant Garamond, 20px, `ink-ghost`
- Bottom margin: 28px

**Behaviour.** Concept diagrams are generated by the AI in response to the student's exploration. They are always preceded by marginalia that provides context — the diagram never appears without introduction.

**Variants.** As multimodal generation matures, concept diagrams will evolve from typographic node-arrow layouts to:

- **Bridge diagrams.** Two columns showing structural parallels between domains (left: guitar string properties; right: orbital properties; centre: the shared mathematical structure)
- **Flow diagrams.** Vertical sequences showing causal chains or process steps
- **Constellation fragments.** Small portions of the student's concept graph, rendered inline to show how a new idea connects to existing knowledge
- **Timeline slivers.** Horizontal sequences showing when thinkers lived and how ideas passed between them

All variants maintain the notebook's visual language: warm ink colours, serif typography, no filled shapes or bright colours. The feeling is always "sketched on paper," never "designed in software."

---

### 2.5 — Thinker Card

**What it is.** An introduction to a thinker who is entering the student's intellectual orbit. Not a biography — a personal introduction, framed in terms of what this thinker can contribute to this student's thinking.

**Visual specification.**
- Name: Cormorant Garamond Italic, 22px, Medium (500), `ink`
- Dates: IBM Plex Mono, 11px, Light (300), `ink-ghost`, inline after name with 12px gap
- Gift (one sentence): Crimson Pro, 15px, Regular (400), `ink-soft`, line-height 1.70, max-width 480px, top margin 6px
- Bridge: IBM Plex Mono, 11px, Light (300), `ink-faint`, top margin 8px
- Container padding: 20px 0
- Bottom border: 1px `rule-light` (if followed by another thinker card)

**Behaviour.** Thinker cards appear in two contexts: inline in the notebook (when the tutor introduces a thinker during a session) and in the Constellation view (as the persistent lineage record). The inline version is identical in visual treatment to the Constellation version — the thinker looks the same wherever you encounter them.

**Compositional rules.** In the notebook, a thinker card is always preceded by a connection or marginalia that explains why this thinker is relevant. It is never dropped in without context.

---

### 2.6 — Silence Marker

**What it is.** An explicit notation that the system has entered a state of active waiting. The screen is still. The tutor has asked a question and is holding space for the student to think.

**Visual specification.**
- Text: Cormorant Garamond Italic, 15px, `ink-ghost`, letter-spacing 0.5px, centred
- Content: A brief, quiet phrase. "The notebook is open. The room is quiet." Or simply nothing — the marker can be purely structural.
- Below the text: a 1px-wide vertical rule in `rule`, 36px tall, centred horizontally, top margin 16px
- Below the rule: a blinking cursor — 1px wide, 22px tall, `ink` at 30% opacity, 1.2s fade animation
- Total vertical space consumed: approximately 120px
- This is the most spacious element in the system. The silence has room.

**Behaviour.** The silence marker appears after a Socratic question and remains until the student begins typing. The phrase is optional — the tutor may choose to leave the space entirely empty, with only the cursor. After an extended silence (calibrated, but measured in minutes), a single gentle prompt may appear above the cursor in `ink-ghost`: "Take your time." This prompt fades in slowly (2s transition).

**Compositional rules.** Silence always follows a Socratic question. It is always followed by a student element.

---

## Family 3: The Student's Spatial Tools

These are elements that exist on the notebook page but are not linear prose. They allow the student to think spatially, relationally, and structurally — the clay and LEGO blocks that give the notebook its malleable quality.

---

### 3.1 — Pinned Thread

**What it is.** A question or idea that the student wants to keep visible at the top of their working space. A persistent reminder of something they're carrying.

**Visual specification.**
- Typeface: Crimson Pro Italic, 15px, Regular (400)
- Colour: `ink-soft`
- Left border: 1px solid `rule`
- Left padding: 16px
- Container: positioned at the top of the notebook, below the session header, above the first entry
- Multiple pinned threads stack vertically with 8px spacing
- A small `⌃` glyph in `ink-ghost`, 10px, precedes each thread

**Behaviour.** The student pins a thread by selecting any question bubble or prose entry and choosing "pin." The pinned text is an excerpt — the first sentence or a selected portion. Pinned threads persist across sessions until the student unpins them. They are the visible manifestation of the curiosity vector.

**Compositional rules.** Pinned threads live in a reserved zone at the top of the notebook. They do not interrupt the linear flow of entries. Maximum three pinned threads at a time — a constraint that forces the student to decide what they care about most.

---

### 3.2 — Card

**What it is.** A self-contained unit of information that the student (or the tutor) can create, move, and arrange. A card can hold a definition, a formula, a key insight, a quote from a thinker, or a short note. It is the LEGO brick of the system — modular, stackable, rearrangeable.

**Visual specification.**
- Container: `paper-deep` background, 1px `rule` border, 2px border-radius
- Padding: 14px 16px
- Maximum width: 280px (cards are deliberately compact — they are notes, not documents)
- Title (optional): Cormorant Garamond, 14px, Medium (500), `ink`, bottom margin 6px
- Body: Crimson Pro, 14px, Regular (400), `ink-soft`, line-height 1.65
- Source (optional): IBM Plex Mono, 10px, Light (300), `ink-ghost`, top margin 8px
- Bottom margin: 16px

**Behaviour.** Cards can be created by the student (manually) or by the tutor (when it identifies a concept worth crystallising). When the tutor creates a card, it appears in the marginalia position with a subtle slide-in animation (200ms, 8px translation).

In the notebook's linear view, cards appear inline, full-width. In canvas mode (see Family 4), cards can be freely positioned in two-dimensional space.

Cards can be tagged with a colour accent — `margin`, `sage`, `indigo`, or `amber` — rendered as a 2px top border. This is the only colour the student can apply to anything in the system. The colours are semantic (tutor's insight / mastery / inquiry / connection), but the student is not told this. They choose a colour because it feels right.

**Compositional rules.** Cards can exist anywhere in the notebook flow. They can be grouped (see 3.4). They can be referenced from other entries (a tap on a card in the notebook scrolls to or highlights its source context).

---

### 3.3 — Table

**What it is.** A structured comparison or collection. When the student needs to organise information into rows and columns — comparing two thinkers, listing properties of a concept, tracking an experiment.

**Visual specification.**
- Full column width
- Header row: Cormorant Garamond, 13px, Medium (500), `ink`, letter-spacing 1px, uppercase, `paper-deep` background, padding 10px 12px
- Body cells: Crimson Pro, 14px, Regular (400), `ink-soft`, padding 10px 12px
- Cell borders: 1px `rule-light`
- Outer border: 1px `rule`
- Border-radius: 2px on outer container only
- Bottom margin: 24px

**Behaviour.** Tables are created by the student or suggested by the tutor ("It might help to compare these side by side"). The student can add rows and columns freely. Cells accept plain text only — no nested elements, no formatting. This constraint keeps tables honest. They are for structured thinking, not for layout.

Tables can be sorted by any column (a tap on the header toggles ascending/descending). Sorting is indicated by a small `↑` or `↓` glyph in `ink-ghost` beside the header text.

**Compositional rules.** Tables appear inline in the notebook. They cannot be placed in canvas mode — tables are inherently linear/gridded and would conflict with freeform spatial arrangement. If the student needs spatial arrangement, they use cards.

---

### 3.4 — Group

**What it is.** A lightweight container that bundles related elements together. The student selects several cards, scratch notes, or prose entries and groups them. The group has no title, no border, no visual container — it is a spatial relationship, not a box.

**Visual specification.**
- No visible boundary
- Grouped elements receive a shared left margin indicator: a 1px vertical line in `rule-light`, spanning the full height of the group, positioned 8px to the left of the leftmost element
- Spacing between grouped elements is reduced to 8px (from the default 20px)
- Bottom margin after the group: 28px (slightly more than standard, to signal the group's end)

**Behaviour.** The student creates a group by selecting elements and choosing "group" (via gesture or keyboard shortcut). Groups can be collapsed — reduced to a single line showing the first element's opening text, with a count indicator in `ink-ghost` ("+ 3 more"). Groups can be ungrouped at any time.

In canvas mode, grouped elements move as a unit when dragged.

**Compositional rules.** Any combination of student elements can be grouped: prose entries, scratch notes, cards, hypothesis markers. Tutor elements cannot be included in a student's group — the voices remain separate. However, a tutor's card can be grouped with student cards if the student initiates it.

---

### 3.5 — Bookmark

**What it is.** A marker that the student places at a specific point in the notebook to return to later. The equivalent of a folded corner in a physical notebook.

**Visual specification.**
- A small triangular indicator in `amber`, 8px × 8px, positioned at the right edge of the column, vertically aligned with the bookmarked element
- No text, no label. The triangle is the entire visual.
- In the Constellation view, bookmarks appear as a simple list: the first few words of the bookmarked element, with a date, linking back to the notebook position.

**Behaviour.** The student creates a bookmark by tapping/clicking the right margin of any element. The bookmark is instantaneous and silent — no confirmation, no animation beyond the triangle appearing. Bookmarks persist across sessions.

**Compositional rules.** Any element can be bookmarked. Bookmarks have no effect on the layout or flow of the notebook.

---

### 3.6 — Divider

**What it is.** A visual break that the student inserts to separate sections of their thinking. The equivalent of drawing a horizontal line across a notebook page.

**Visual specification.**
- A 1px horizontal rule in `rule`, spanning 60% of the column width, centred
- Vertical margin: 32px above and below
- Optional: the student can type a brief label that appears centred above the rule in IBM Plex Mono, 11px, Light (300), `ink-ghost`, letter-spacing 1.5px, uppercase. Maximum 40 characters.

**Behaviour.** Created by a gesture or by typing three dashes (`---`). The label is optional and added after the divider is created.

**Compositional rules.** Dividers can be placed between any two elements. They do not create a structural container — they are purely visual.

---

## Family 4: The Canvas

The canvas is not a separate surface. It is a *mode* of the notebook page. When the student enters canvas mode, the linear flow of the notebook relaxes into a two-dimensional space. Elements can be positioned freely. The page becomes a desk.

---

### 4.1 — Canvas Mode

**What it is.** A toggle that transforms a section of the notebook from linear flow to spatial arrangement. The student selects a range of elements and chooses "open as canvas."

**Visual specification.**
- The selected range expands into a bordered region: 1px `rule` border on all sides, 2px border-radius, `paper-warm` background
- Minimum height: 300px. Grows with content.
- Elements within the canvas lose their vertical stacking and become freely draggable
- Each element in the canvas retains its original visual treatment (cards look like cards, prose looks like prose, sketches look like sketches)
- A subtle dot grid appears in the background: 1px `rule-light` dots at 24px intervals. This provides spatial reference without imposing structure.
- The canvas header: IBM Plex Mono, 11px, Light (300), `ink-ghost`, positioned at the top-left inside the border. Reads "canvas" by default; the student can rename it.

**Behaviour.** Inside the canvas, elements are positioned by dragging. They can overlap (the most recently moved element renders on top). The canvas supports pinch-to-zoom on touch devices. Elements can be dragged in from outside the canvas (from the linear notebook above or below) and dragged out (returning to linear flow).

The canvas auto-saves spatial positions. When the student returns to this notebook section, the canvas is exactly as they left it.

**Compositional rules.** Canvas mode can contain: cards, scratch notes, sketches, prose entries, concept diagrams, and thinker cards. It cannot contain: tables (which are inherently linear), Socratic questions (which belong to the tutor's flow), or silence markers.

A canvas section is embedded in the linear notebook — content above it and below it flows normally. The canvas is a pocket of spatial thinking within the stream of linear thinking. Like opening a fold-out page in a notebook.

---

### 4.2 — Connector

**What it is.** A line drawn between two elements on the canvas, indicating a relationship. The student's way of saying "these two things are related" without having to articulate how.

**Visual specification.**
- Stroke: 1px `ink-soft`, slightly curved (a gentle bezier, not a straight line — mimicking a hand-drawn connection)
- Optional label: Crimson Pro Italic, 12px, Light (300), `ink-faint`, positioned at the midpoint of the curve
- Arrowhead: optional, a simple `>` glyph at the endpoint, 8px, `ink-soft`

**Behaviour.** The student creates a connector by dragging from one element to another in canvas mode. A label can be added by tapping the midpoint of the connector. Connectors are purely visual — they have no structural meaning to the system. They are the student's thinking made visible.

The tutor can see connectors and may reference them: "You drew a line between wave frequency and orbital speed — that's exactly the connection Kepler saw."

**Compositional rules.** Connectors exist only in canvas mode. They connect any two elements. Multiple connectors can originate from or terminate at a single element.

---

## Family 5: The Peripheral Elements

These elements exist at the edges of the interface — in the header, in the Constellation, in the spaces between sessions. They are the quietest elements in the system.

---

### 5.1 — Session Header

**What it is.** The date and topic notation at the top of each session.

**Visual specification.**
- Line 1: IBM Plex Mono, 11px, Light (300), `ink-faint`, letter-spacing 1.5px, uppercase. Content: "Session [n] · [date] · [time of day]"
- Line 2: Cormorant Garamond, 28px, Light (300), `ink`, letter-spacing −0.3px. Content: the session's topic thread, inferred by the AI from the session's content.
- Top margin: 40px (from navigation). Bottom margin: 40px (to first entry).

### 5.2 — Session Divider

**What it is.** The boundary between two sessions when scrolling through the continuous notebook.

**Visual specification.**
- A horizontal rule in `rule`, full column width
- Vertical margin: 48px above and below
- The next session's header (5.1) follows immediately below

### 5.3 — Mastery Bar

**What it is.** A thin indicator of the student's fluency in a concept. Appears only in the Constellation view.

**Visual specification.**
- Height: 2px
- Background track: `rule-light`
- Fill: semantic colour (`sage` for mastered, `ink` for strong, `indigo` for developing, `ink-ghost` for exploring)
- Fill border-radius: 1px
- Transition: width change over 1.5s, cubic-bezier(0.16, 1, 0.3, 1)
- Percentage label: IBM Plex Mono, 11px, Light (300), `ink-faint`, right-aligned, 12px right of the bar

### 5.4 — Bridge Suggestion

**What it is.** A quiet suggestion from the system that a new intellectual path has opened. Appears in the Constellation when a concept reaches fluency.

**Visual specification.**
- Background: `sage-dim`
- Border-radius: 2px
- Padding: 14px 16px
- Text: Crimson Pro Italic, 14px, Regular (400), `sage`, line-height 1.70

### 5.5 — Student Identity

**What it is.** The student's name, duration, and session count. Present on every surface.

**Visual specification.**
- Position: top-right of the header area
- Typeface: IBM Plex Mono, 11px, Light (300), `ink-ghost`
- Content: "[Name] · [duration] · session [n]"

---

## Family 6: The Tutor's Ambient Elements

These elements are placed by the AI in the margins and periphery of the notebook — uninstructed, unannounced. They create the intellectual atmosphere of a well-curated library: things placed nearby that the student might notice, or might not.

---

### 6.1 — Marginal Reference

**What it is.** A brief, uninstructed note that the tutor places in the margin of the notebook, related to but not directly addressing the student's current thread. The equivalent of a book left open to a relevant page on the desk beside the student's notebook.

**Visual specification.**
- Position: right margin of the column (on wide screens, 640px+ viewport). On narrow screens, appears inline as a very light aside.
- Typeface: Crimson Pro Italic, 13px, Light (300), `ink-ghost`
- Maximum width: 160px
- Line-height: 1.55
- A thin 1px vertical rule in `rule-light` separates it from the main column

**Behaviour.** Marginal references are never explained. They are placed because the AI's student model suggests a connection that is not yet ready to be made explicit. They are the intellectual equivalent of serendipity in a bookshop. The student may notice them or may not. If the student asks about one, it becomes a conversation.

**Compositional rules.** One marginal reference per session, maximum. This constraint prevents the margin from becoming cluttered. The reference must be genuinely related to the student's current exploration — it is not a recommendation engine.

---

### 6.2 — Echo

**What it is.** A brief callback to something the student said or wrote in a previous session. Placed by the tutor to create the feeling of continuity — the notebook remembers.

**Visual specification.**
- Typeface: Crimson Pro, 13px, Light (300), `ink-faint`
- Preceded by a small `↩` glyph in `ink-ghost`, 10px
- Left indent: 19px (aligned with student text)
- Background: none
- Bottom margin: 12px

**Behaviour.** Echoes are rare — one per session at most, and only when the callback is genuinely illuminating. The AI references the student's own words from a previous session, without quotation marks or formal citation. "You wondered three weeks ago whether music was mathematical. Today you proved it is."

**Compositional rules.** Echoes appear in the tutor's flow (between marginalia entries) and are always followed by a connection or extension that builds on the referenced material.

---

## Family 7: Structural Primitives

These are not content elements. They are the invisible architecture that holds everything else.

---

### 7.1 — The Column

The single vertical column that contains all content. Maximum width 640px, centred, with 24px horizontal padding. This is the page of the notebook. It is the most important structural decision in the system. Everything that happens in Ember happens inside this column.

### 7.2 — The Margin Zone

On viewports wider than 800px, a 160px zone to the right of the column becomes available for marginal references (6.1). This zone is never used for navigation, controls, or system elements. It is reserved for the tutor's ambient voice.

### 7.3 — The Pin Zone

The area between the session header and the first entry, reserved for pinned threads (3.1). Maximum height: three pinned threads. If no threads are pinned, this zone collapses to zero height.

### 7.4 — The Input Zone

The area below the last entry, where the student's cursor lives. This zone has no border, no container, no placeholder text. It is continuous with the notebook above it. The cursor blinks at the left margin of the student's column (19px indent). The zone expands as the student types. When focused, the blinking cursor is replaced by a full-width textarea styled identically to a Prose Entry — Crimson Pro 18px, `ink`, line-height 1.80. The student's typing is indistinguishable from the notebook above it. Submission (Enter without Shift) converts the text into a permanent entry.

---

## Family 8: The Constellation's Extended Views

These elements appear only within the Constellation surface (Surface 2). They present the student's intellectual history as a quiet ledger — each view is a different lens on the same underlying intellectual landscape. They follow the same visual vocabulary as the rest of the system.

---

### 8.1 — Lexicon Entry

**What it is.** A single term in the student's personal vocabulary. The student has encountered this term across sessions and defined it in their own words.

**Visual specification.**
- Entry number: IBM Plex Mono, 10px, Light (300), `ink-ghost`, letter-spacing 1px
- Term: Cormorant Garamond Italic, 22px, Medium (500), `ink`
- Pronunciation: IBM Plex Mono, 10px, `ink-ghost`, italic
- Definition: Crimson Pro, 16px, Regular (400), `ink`, line-height 1.75
- Etymology: IBM Plex Mono, 11px, `ink-faint`, line-height 1.5
- Cross-references: IBM Plex Mono, 11px, `margin`, underline in `margin-dim`
- Mastery bar: 2px height, same treatment as Mastery Bar (5.3)
- Vertical separation: Rule (1px `rule-light`) between entries

**Behaviour.** Lexicon entries are derived from the student's session history. When the student defines or explores a term in the notebook, it is recorded in the student model and appears in the Constellation's lexicon view. The student does not manually add entries — the system curates them from the dialogue.

### 8.2 — Encounter Row

**What it is.** A single record in the student's intellectual encounter history. It captures when and where a thinker or idea entered the student's world.

**Visual specification.**
- Grid layout: `48px 120px 1fr 120px 90px` columns
- Reference: IBM Plex Mono, 11px, `ink-ghost`
- Thinker name: Cormorant Garamond, 16px, Medium (500), `ink`
- Tradition: IBM Plex Mono, 9px, `ink-faint`, letter-spacing 1px
- Core idea: Crimson Pro Italic, 14px, `ink-soft`, line-height 1.6
- Session/date: IBM Plex Mono, 10px, `ink-soft` / `ink-ghost`
- Header row: IBM Plex Mono, 9px, `ink-faint`, uppercase, letter-spacing 2px, bottom border 1px `ink`
- Row separator: 1px `rule-light`
- Row hover: `paper-warm` background, 200ms ease transition

**Behaviour.** Encounter rows are a passive record. They cannot be edited or reordered by the student. They exist for reflection — "when did I first meet this thinker? what was I thinking about when I met them?"

### 8.3 — Primary Text Card

**What it is.** A reference to a text the student is currently working through. Not a book catalogue — only the three to five texts that are "on the desk."

**Visual specification.**
- Container: 1px `rule-light` border, 2px border-radius, 20px padding
- Current focus indicator: 3px left border in `margin` (replaces the 1px left border)
- Current label: IBM Plex Mono, 9px, `margin`, uppercase, letter-spacing 2px
- Title: Cormorant Garamond Italic, 20px, Medium (500), `ink`
- Author: IBM Plex Mono, 11px, `ink-faint`, letter-spacing 1px
- Quote: Crimson Pro Italic, 14px, `ink-soft`, line-height 1.7
- Annotations: IBM Plex Mono, 10px, `ink-ghost`, border-bottom 1px `rule-light`
- Hover: `paper-warm` background, 200ms ease transition

**Behaviour.** Primary text cards represent the student's current reading, inferred from session content. The AI introduces texts through connections and marginalia. When a text is referenced enough to become part of the student's intellectual landscape, it appears here.
