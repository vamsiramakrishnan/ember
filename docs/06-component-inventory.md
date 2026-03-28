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

**Three layout modes.** The diagram automatically selects its layout based on data shape:

- **Linear flow.** Flat nodes connected left-to-right with arrow connectors. For ≤5 nodes with no nesting. The original treatment — sequential relationships.
- **Tree layout.** Nodes with children, rendered as expandable hierarchies. Each node expands/collapses on click to reveal child nodes and detail text. For structure: Kepler's three laws, the branches of mathematics.
- **Graph layout.** Nodes with typed edges. Edges have six semantic types: `causes`, `enables`, `contrasts`, `extends`, `requires`, `bridges`. Each type has a distinct visual treatment (stroke dash, colour). For cross-domain connections.

**Node enrichment.** Each node can carry:
- `entityId` + `entityKind`: links to the knowledge graph (concept, thinker, term, question)
- `mastery`: rendered as a 2px ghost bar behind the label
- `detail`: extended description revealed on expand
- `children[]`: recursive nesting at any depth
- `accent`: semantic colour — sage (growth), indigo (inquiry), amber (connection), margin (authority)

**Interactivity.** Nodes expand/collapse on click. The chevron rotates 180° on open. Children appear with a 0.3s fade animation.

**Edge specification.** Typed edges rendered as SVG bezier curves (graph layout) or inline text annotations:
- `causes`: solid stroke, margin colour
- `enables`: dashed stroke, sage
- `contrasts`: dotted stroke, amber
- `extends`: solid thin, indigo
- `requires`: solid, ink-faint
- `bridges`: dashed, amber (cross-domain)

**Title.** Optional. IBM Plex Mono 9px, 2px letter-spacing, uppercase, ink-faint.

All layouts maintain the notebook's visual language: warm ink colours, serif typography, no filled shapes or bright colours. The feeling is always "sketched on paper," never "designed in software."

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

---

## Family 9: Extended Content Elements

As Ember has matured, the tutor's repertoire has expanded beyond the original prose-and-diagram vocabulary. The following elements emerged from real tutoring needs: some concepts are best explored through structured practice, some through media, some through code. Each element earns its place by serving a pedagogical function that the original seven families cannot.

These elements obey the same laws as every other block: they are typed, they reference only the token system, they sit inside the 640px column, they never interrupt the student, and they appear only when the tutor's pedagogical judgment calls for them. They are marginalia in a richer hand — not a departure from the notebook metaphor, but an acknowledgment that a tutor's desk has more on it than just a pen.

---

### 9.1 — Inline Response

**What it is.** A targeted tutor annotation on a specific passage the student wrote. Where marginalia (2.1) responds to the student's general thread of thought, the inline response addresses a particular sentence or phrase — the equivalent of a tutor underlining a passage and writing a note in the margin beside it.

**Visual specification.**
- Quoted text: Crimson Pro, 15px, `ink-faint`, 1px left border in `rule`, 16px left padding, `paper-deep` background
- Quote clamp: maximum 4 visible lines, fades if longer
- Intent label: IBM Plex Mono, 9px, `ink-ghost`, uppercase, 2px letter-spacing. Reads "on", "defining", or "connecting" depending on intent
- Response: identical to Marginalia (2.1) — CSS grid with 3px margin rule, Cormorant Garamond 17.5px in `margin`
- Animation: 0.7s ease reveal

**Behaviour.** Inline responses are generated when the tutor identifies a specific claim, definition, or connection in the student's writing that warrants direct engagement. The quoted passage provides context; the response provides annotation. The three intents (explain, define, connect) map to different pedagogical moves but share the same visual treatment.

**Compositional rules.** Inline responses follow student entries. They are never consecutive — at most one per student entry.

---

### 9.2 — Reading Material

**What it is.** A structured sequence of slides the tutor assembles when a concept benefits from sustained, ordered exposition. Not a lecture — a curated reading, like a tutor pulling three pages from three different books and laying them in sequence on the desk.

**Visual specification.**
- Container: 1px `rule` border, `paper` background, 16px vertical margin
- Cover art (optional): 48×48px, 2px radius, sepia-tinted
- Icon (if no cover): Cormorant Garamond, 20px, `amber`
- Title: Cormorant Garamond, 19px, `ink`, −0.2px letter-spacing
- Subtitle: Crimson Pro, 14px, Light (300), `ink-faint`
- Badge: IBM Plex Mono, 9px, `ink-ghost`, uppercase, 1.5px letter-spacing
- Slide heading: Cormorant Garamond, 20px, `ink`
- Slide body: Crimson Pro, 15px, `ink-soft`, line-height 1.75
- Slide rule accent: 2px top border, semantic colour (`sage`, `indigo`, `amber`, or `margin`)
- Navigation: 1px `rule-light` borders, `ink-faint` arrows, 0.15s transitions

**Three disclosure levels.** Collapsed (title only), expanded inline (paginated slides within the notebook flow), and modal (full-screen reading). The student controls the level. The default is collapsed — the tutor places the reading on the desk; the student decides whether to open it.

**Behaviour.** Reading materials are generated for topics that exceed the scope of a single marginalia entry. They are always preceded by a connection or marginalia explaining their relevance. The tutor never drops a reading without context.

**Compositional rules.** Reading materials are followed by silence or a Socratic question. They are never followed by another tutor element — the student needs time to process.

---

### 9.3 — Flashcard Deck

**What it is.** A set of recall-practice cards the tutor generates when the student has encountered enough new terms or concepts to benefit from spaced retrieval. The flashcard deck is not gamification — it is the oldest study tool in existence, formalised.

**Visual specification.**
- Container: 1px `rule` border, `paper` background, 16px vertical margin
- Header icon: Cormorant Garamond, 18px, `indigo`
- Title: Cormorant Garamond, 17px, `ink`, −0.1px letter-spacing
- Card: maximum 480px wide, minimum 180px tall, `perspective: 800px`
- Front face: `paper` background, 1px `rule` border, 24px padding
- Back face: `paper-warm` background, same border and padding
- Flip animation: `rotateY(180deg)`, 0.5s cubic-bezier(0.16, 1, 0.3, 1)
- Side labels ("question" / "answer"): IBM Plex Mono, 9px, `ink-ghost`, uppercase, 2px letter-spacing
- Front text: Cormorant Garamond, 18px, `ink`, centred, line-height 1.65
- Back text: Crimson Pro, 15px, `ink-soft`, centred, line-height 1.75
- Progress: IBM Plex Mono, 10px, `ink-ghost`

**Behaviour.** Collapsed by default (title + card count). The student opens the deck when ready. Cards flip on click/tap. Navigation arrows move between cards. No scoring, no streaks, no completion percentage — the student uses the deck as they would use physical flashcards. The tutor can reference deck contents in later sessions.

**Compositional rules.** Flashcard decks follow marginalia or a Socratic sequence. They are never the first element in a session.

---

### 9.4 — Exercise Set

**What it is.** A sequence of practice problems the tutor poses when the student needs to test their understanding through application. Not a quiz — there is no score. Each exercise is a thinking prompt with progressive hints.

**Visual specification.**
- Container: 1px `rule` border, `paper` background, 16px vertical margin
- Header icon: Cormorant Garamond, 18px, `sage`
- Title: Cormorant Garamond, 17px, `ink`
- Difficulty badge: IBM Plex Mono, 9px, `sage`, uppercase
- Format label: IBM Plex Mono, 9px, `ink-ghost`, uppercase, 2px letter-spacing
- Prompt: Cormorant Garamond Italic, 18px, `ink`, line-height 1.75
- Concept tag: IBM Plex Mono, 9px, `indigo`, uppercase
- Hint text: Crimson Pro, 14px, `ink-faint`, line-height 1.70
- Hint reveal: "show hint" button, `indigo` text, disappears after reveal

**Behaviour.** Collapsed by default. Exercises are ordered by difficulty within the set. Hints are revealed one at a time — the student must attempt the problem before requesting help. The exercise set does not collect answers; it presents problems. The student responds in the notebook's InputZone, below the exercise set, as they would with any Socratic question.

**Compositional rules.** Exercise sets follow a teaching sequence — marginalia, concept diagram, or reading material. They are never the opening move.

---

### 9.5 — Illustration

**What it is.** A generated or referenced image the tutor places in the notebook when visual explanation exceeds what a concept diagram can convey. Where concept diagrams (2.4) show relationships between labelled nodes, illustrations show the thing itself — a diagram of orbital mechanics, a rendering of a waveform, a reproduction of a historical map.

**Visual specification.**
- Image: maximum height 320px, `object-fit: contain`, 1px `rule` border, 2px radius
- Caption: IBM Plex Mono, 10px, Light (300), `ink-ghost`, uppercase, 1px letter-spacing
- Expand hint: IBM Plex Mono, 9px, uppercase, fades in on hover
- Lightbox: centred modal, maximum height `calc(100vh − 96px)`

**Behaviour.** Illustrations are progressive — thumbnail in the notebook flow, lightbox on click. They are always captioned. They are always preceded by marginalia that provides context. The tutor never places an image without explanation.

**Compositional rules.** Illustrations follow marginalia or connections. They can precede a Socratic question ("Look at this. What do you notice?").

---

### 9.6 — Visualization

**What it is.** An interactive, code-generated visual — a simulation, a dynamic chart, a manipulable diagram. Where illustrations (9.5) are static, visualizations respond to the student. They are the closest Ember comes to the embodied learning that static notebooks cannot provide.

**Visual specification.**
- Container: 1px `rule` border, 2px radius, `paper` background
- Thumbnail mode: clipped to 280px height, gradient fade to `paper` at bottom
- Expand hint: IBM Plex Mono, 9px, `ink-faint`, uppercase, positioned below fade
- Expanded mode: full content height, maximum 1200px
- Caption: IBM Plex Mono, 10px, Light (300), `ink-ghost`, lowercase, 1px letter-spacing
- Loading skeleton: gradient pulse, `paper` → `paper-warm` → `paper`, 1.8s cycle

**Behaviour.** Rendered in a sandboxed iframe (`allow-scripts allow-same-origin`). The iframe reports its content height via `postMessage`. Progressive disclosure: thumbnail → expanded inline → modal lightbox. The student controls the level.

**Compositional rules.** Visualizations follow a teaching sequence. They are never orphaned — always preceded by context and often followed by a Socratic question that asks the student to interact with the visualization and report what they observe.

---

### 9.7 — Podcast

**What it is.** An audio segment the tutor generates or references when a concept benefits from narrative exposition or when the student's learning mode favours listening. Not entertainment — a focused audio explanation, like a tutor talking through an idea while the student listens and takes notes.

**Visual specification.**
- Container: `paper-deep` background, 1px `rule-light` border, 2px radius, 20px padding
- Label: IBM Plex Mono, 9px, `ink-ghost`, uppercase, 2px letter-spacing
- Topic: Cormorant Garamond, 20px, Light (300), `ink`, line-height 1.3
- Play button: 36px circle, 1px `rule` border, `paper` background, `ink-soft` icon
- Waveform: 48px height, canvas-rendered, seekable
- Time: IBM Plex Mono, 10px, Light (300), `ink-faint`
- Transcript toggle: IBM Plex Mono, 10px, Light (300), `ink-faint`
- Transcript: Crimson Pro, 14px, `ink-soft`, pre-wrap, maximum 200px scrollable height

**Behaviour.** Multi-segment support with auto-advance. Transcript is collapsible. Cover art is optional. The waveform is seekable by click/tap. The podcast does not autoplay — the student initiates.

**Compositional rules.** Podcasts are rare — one per session at most. They follow marginalia that explains what the student will hear and why.

---

### 9.8 — Code Cell

**What it is.** An editable code block for subjects where the student is learning through programming — mathematics expressed as computation, data analysis, algorithmic thinking. The code cell is the notebook's concession to the fact that some ideas are best expressed in a formal language.

**Visual specification.**
- Container: 2px `rule` left border, `text-indent` left padding, 12px vertical margin
- Language label: IBM Plex Mono, 9px, `ink-ghost`, uppercase, 2px letter-spacing
- Run button: IBM Plex Mono, 9px, `ink-ghost`, 1px `rule` border, 2px radius
- Source: IBM Plex Mono, 13px, `ink`, `paper-warm` background, 12px 16px padding, 2px radius
- Editor: IBM Plex Mono, 13px, `paper-warm` background, 1px `margin` border, minimum 80px height
- Standard output: IBM Plex Mono, 12px, `ink-soft`, pre-wrap
- Error output: IBM Plex Mono, 12px, `amber`, pre-wrap

**Behaviour.** Click to enter edit mode. Run button executes the cell (if execution is available). Output appears below. The code cell maintains the notebook's permanence principle — executed code becomes part of the record. The student can edit and re-run, but earlier executions are preserved.

**Compositional rules.** Code cells are interspersed with prose and tutor marginalia. The tutor may create a code cell with a partial implementation and ask the student to complete it — a Socratic probe in formal language.

---

### 9.9 — Directive

**What it is.** An explicit instruction from the tutor — not a question, not a suggestion, but a thing to do. "Read the first chapter of this text." "Draw what you think the orbit looks like." "Explain this concept to someone at dinner tonight." Directives are the tutor's way of assigning work that happens outside the notebook.

**Visual specification.**
- Rule: 24px width, 1px height, `indigo` at 30% opacity (→ `sage` on completion)
- Body: 16px left padding, 2px `indigo` left border (→ `sage` on completion)
- Action label: IBM Plex Mono, 9px, `indigo`, uppercase (→ `sage` on completion)
- Text: Cormorant Garamond, 16px, `ink-soft`, line-height 1.75
- Completion: opacity reduces to 0.55, checkmark glyph in `sage`, 0.4s reveal animation
- Completed label: IBM Plex Mono, 9px, `sage`, Light (300), 1px letter-spacing

**Behaviour.** The student can mark a directive as complete. Completion is recorded with a timestamp. Completed directives remain visible but fade to peripheral visibility. The tutor can reference completed directives in later sessions.

**Compositional rules.** Directives follow a teaching sequence. They are never the first element. They are often the last element before silence — the tutor assigns something and waits.

---

### 9.10 — Reflection

**What it is.** A session-level synthesis placed by the tutor at the natural end of a session's intellectual arc. Not a "what we learned today" summary — a quiet observation about the shape of the student's thinking. The equivalent of a tutor pausing, looking at the notebook, and saying: "Do you see what happened here?"

**Visual specification.**
- Container: 24px vertical padding, 16px vertical margin
- Top rule: 40% width, 1px height, `rule`, centred
- Bottom rule: same
- Text: Cormorant Garamond Italic, 15px, Light (300), `ink-faint`, line-height 1.80, centred, 32px horizontal padding

**Behaviour.** Reflections are rare — at most one per session, and only when the session has produced genuine intellectual movement. They are never congratulatory. They name a pattern, draw a thread, or pose an open question that the student carries away.

**Compositional rules.** Reflections appear at the end of a session, before the session divider. They are never followed by another tutor element.

---

### 9.11 — Streaming Text

**What it is.** Not a content element — a transient state. When the tutor is composing a response, the streaming text element shows the response materialising word by word. It is the digital equivalent of watching someone write in the margin of your notebook.

**Visual specification.**
- Layout: identical to Marginalia (2.1) — CSS grid with margin rule
- Rule: margin rule at 35% opacity, with a slow pulse animation (2s, 0.35 → 0.50 opacity) during streaming
- Text: Cormorant Garamond, 17.5px, `margin`, line-height 1.78, pre-wrap
- Cursor: 1px × 22px, `margin`, `emberCursorBlink` animation, positioned at text end
- Composing label: IBM Plex Mono, 10px, Light (300), `ink-ghost`, 0.5px letter-spacing

**Behaviour.** The streaming text element appears when the tutor begins generating a response. It shows the text arriving in real time via semantic buffering — incomplete code blocks, math expressions, and tables are masked until their delimiters close. When streaming completes, the element is replaced by the final typed element (Marginalia, SocraticQuestion, etc.).

**Compositional rules.** Streaming text occupies the position where the final element will appear. It is always transient.

---

### 9.12 — Media Entries

The notebook accepts media from the student's world — photographs, documents, embedded links. These are not pedagogical tools; they are the student bringing something to the desk. A photo of a whiteboard from school. A PDF chapter their teacher assigned. A link to a video they found interesting.

#### Image Entry

**Visual specification.**
- Container: 12px vertical margin, `text-indent` left padding
- Image: 100% maximum width, 2px radius, 1px `rule` border, lazy-loaded
- Caption: IBM Plex Mono, 11px, Light (300), `ink-faint`, 0.3px letter-spacing, 6px top margin

#### File Upload Entry

**Visual specification.**
- Container: 12px vertical margin, `text-indent` left padding
- File card: flex row, 12px gap, 12px 16px padding, 1px `rule` border, 2px radius
- Icon: IBM Plex Mono, 16px, `ink-faint` (mimetype-based: ◻ image, ▤ document, ≡ text, { } code, ◇ other)
- Name: Crimson Pro, 15px, `ink`, text-overflow ellipsis
- Size: IBM Plex Mono, 10px, `ink-ghost`, 0.5px letter-spacing
- AI summary (optional): Cormorant Garamond Italic, 15px, `ink-soft`, line-height 1.70, 36px left padding

#### Document Entry

**Visual specification.**
- Container: 12px vertical margin, `text-indent` left padding
- PDF preview (if applicable): 100% width, 360px height (240px mobile), 1px `rule` border, 2px radius
- Document card: flex row, `paper-warm` background, 1px `rule` border, 2px radius, 16px padding
- Icon: 24px, `ink-faint`
- Name: Crimson Pro, 16px, `ink`
- Metadata: IBM Plex Mono, 10px, `ink-faint`, 0.5px letter-spacing
- Extracted text: 16px left padding, 1px `rule` left border, Crimson Pro 14px `ink-soft`, line-height 1.70, maximum 200px scrollable

#### Embed Entry

**Visual specification.**
- Bookmark card: flex row, 12px gap, 14px 16px padding, 1px `rule` border, 2px radius
- Hover: `ink-ghost` border, `paper-warm` background, 0.2s transition
- Favicon: 16×16px, 2px radius
- Title: Crimson Pro, 15px, `ink`, line-height 1.3
- Description: Crimson Pro, 13px, `ink-faint`, line-height 1.5, 2-line clamp
- Domain: IBM Plex Mono, 10px, `ink-faint`, 0.5px letter-spacing
- Video (YouTube/Vimeo): 16:9 aspect ratio, 1px `rule` border, 2px radius
- PDF: 100% width, 400px height (280px mobile), 1px `rule` border

**Behaviour.** Media entries are created by the student through paste, drag-and-drop, or file selection. The tutor can see media entries and respond to them — "I see you've uploaded a diagram. Tell me what you notice about the symmetry." Media entries are permanent per the notebook's rules.

**Compositional rules.** Media entries follow the student's flow. They can appear between any two student elements. The tutor's response to a media entry uses standard marginalia.

---

### 9.13 — Citation

**What it is.** A source attribution block appended to tutor responses when the tutor's knowledge is grounded in specific retrievable sources. Not a bibliography — a quiet acknowledgment that the tutor's claims are traceable.

**Visual specification.**
- Container: 8px vertical margin, `text-indent` left padding
- Label: IBM Plex Mono, 9px, `ink-faint`, uppercase, 1.5px letter-spacing
- Source pills: inline-flex, 3px 8px padding, 1px `rule-light` border, 2px radius
- Source hover: `ink-ghost` border
- Domain: IBM Plex Mono, 10px, `ink-faint`, 0.3px letter-spacing
- Title: Crimson Pro, 11px, `ink-faint`, maximum 200px, text-overflow ellipsis

**Behaviour.** Citations appear below the tutor element they reference. They are visually peripheral — small, faint, ignorable. The student can click a citation to open the source. Citations are never annotated or explained; they exist as a quiet provenance trail.

**Compositional rules.** Citations are attached to the tutor element they cite. They are never standalone.

---

### 9.14 — Carousel

**What it is.** A horizontal arrangement for elements that benefit from side-by-side comparison — a set of thinker cards, a sequence of concept diagrams, a row of related illustrations. The carousel is not a slideshow; it is a shelf.

**Visual specification.**
- Container: 16px vertical margin, `text-indent` left padding
- Label (optional): IBM Plex Mono, 9px, `ink-faint`, uppercase, 1.5px letter-spacing
- Track: horizontal scroll-snap (mandatory, start-aligned), hidden scrollbar, 16px gap
- Child items: 240–300px width, `scroll-snap-align: start`
- Dot indicators: 5px circles, `ink-ghost` default, `margin` active, 6px gap, 0.2s transitions

**Behaviour.** Children scroll horizontally with snap. Dot indicators show position (only rendered if more than one item). The carousel does not autoplay, does not loop, and does not animate between items. It scrolls as a physical shelf scrolls — by the student's hand.

**Compositional rules.** Carousels contain cards, thinker cards, or illustrations. They do not contain prose, questions, or interactive elements. Maximum one carousel per tutor response.
