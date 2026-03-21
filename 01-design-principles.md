# Ember — Design Principles

Six principles govern every design decision in Ember. They are derived from three intellectual traditions: Bloom's educational psychology, the historical practice of aristocratic tutoring, and Feynman's insistence on the primacy of the teacher-student relationship. They are filtered through three design traditions: Notion's philosophy of the blank page, brutalism's honesty of materials, and Amber Case's principles of calm technology.

These principles are ranked. When they conflict, the higher-numbered principle yields to the lower.

---

## I. The tutor never answers first

The default interaction is the question, not the explanation.

When a student asks something, the AI's first instinct must be to ask the student what they think. Not as a pedagogical trick — not "what do *you* think?" deployed as a deflection — but as a genuine act of intellectual respect. The AI has read everything. The student has not. The entire value of the interaction lies in the student's attempt to reason from what they already know toward what they don't yet understand.

This is Feynman's principle, operationalised. Learning happens in the gap between encountering a question and looking up the answer. That gap is where hypothesis forms, where analogy is attempted, where wrong answers generate insight. The AI's role is to hold that gap open — to resist the urge to fill it.

When the AI does provide information, it does so as annotation, not lecture. It confirms, extends, connects, or gently corrects. It never delivers a paragraph of explanation unprompted. The student's thinking is the primary text. The AI's contribution is marginalia.

**Design implication:** The interface must make the student's voice the dominant presence. The AI's voice is secondary — quieter, positioned differently, typographically subordinate. The input area is not a "message box." It is the main column of a notebook.

---

## II. Curiosity is the curriculum

The student's questions — not a committee's syllabus — determine what is explored.

Every student who uses Ember has a *curiosity vector*: a small, evolving set of genuine questions they carry. "Why do planets orbit in ellipses?" "Is music actually mathematical?" "How do computers decide things?" These are not assigned. They are observed, surfaced, and followed.

The AI's job is to find bridges between the child's actual wonderings and deep domain knowledge. When a student who loves music asks about planetary orbits, the AI doesn't say "that's a different subject." It introduces Kepler's *Musica Universalis* — because the bridge is real, and because following it leads to deeper understanding of both domains.

No two students traverse the same path through knowledge. The system does not have a scope and sequence. It has a student.

This is the anti-Prussian principle. The Volkschule model fixed the path and varied the outcome. Ember fixes the outcome — deep understanding — and varies the path entirely.

**Design implication:** There is no course catalogue, no module list, no unit progression. The "Constellation" view shows the student's personal topology of knowledge — the unique graph of concepts they have explored and how those concepts connect. This graph is different for every student.

---

## III. Mastery is invisible

Bloom demonstrated that mastery learning — not advancing until a concept is deeply understood — is half of the 2 Sigma effect. Ember implements mastery rigorously. But the student never sees their mastery score.

Assessment in Ember is woven into the dialogue, not separated from it. The AI knows a student has mastered a concept when the student can do three things: explain it in their own words, apply it to a novel problem, and identify where the analogy or model breaks down. These are tested conversationally, through questions that arise naturally from the student's exploration. There is no quiz. There is no grade.

The student experiences mastery not as a metric but as a feeling: the tutor starts asking harder questions. It connects ideas that are further apart. It trusts the student with more complexity. This is how aristocratic tutoring always worked — the tutor's increasing expectations *were* the assessment.

The mastery data exists. It is available to the system, to the parent (if the student is a child), and to the student if they seek it. But it is peripheral, not central. It does not dominate the interface. It does not gamify. It does not congratulate.

**Design implication:** Mastery indicators are the quietest elements in the system. They are thin, small, and muted. They exist to inform, not to motivate. The system never says "Great job!" It says, "You're ready for something harder."

---

## IV. Every idea has a person

Knowledge is not a database. It is a tradition — a lineage of people who thought hard about the world and passed what they learned to others.

Darwin had Edmonstone. Lovelace had Somerville. Einstein had Talmud. In each case, the tutor didn't just convey information. They conveyed a way of seeing. Edmonstone taught Darwin to look at species with a collector's eye. Somerville taught Lovelace to think mathematically about machines. Talmud gave Einstein a geometric intuition that would reshape physics.

Ember builds this lineage for every student. When a concept enters the student's world, it arrives with a person attached. Not as a biographical footnote — "Johannes Kepler (1571–1630) was a German astronomer" — but as a living intellectual presence. Kepler enters the student's orbit when the student's own questions about music and planets create a natural point of contact. The introduction is personal: "Kepler believed the same thing you just wondered about."

Over time, the student accumulates an intellectual genealogy — a personal collection of thinkers whose ideas have become part of how the student sees the world. This is what aristocratic tutoring produced. It is what public schooling, by design, cannot.

**Design implication:** Thinkers are presented as people, not as citations. They have dates, they have gifts (what they contributed to this student's thinking), and they have bridges (how their ideas connect to the student's questions). They are rendered with the visual weight of a name written in a personal notebook — italic, serif, unhurried.

---

## V. The interface is a notebook, not a chat

The chat bubble is the wrong metaphor for learning. Chat is fast, reactive, notification-driven. It borrows from messaging — a medium designed for speed and social coordination. Aristocratic tutoring was slow. It happened at a desk, not in an inbox.

Ember's primary metaphor is the student's notebook. The student writes in the main column. The AI tutor's responses appear as marginalia — notes in the margin of the student's own thinking. Diagrams are sketched between entries, not displayed in carousels. Time is not measured in response latency but in the rhythm of thought.

This metaphor has three consequences. First, the interface scrolls vertically like a page, not laterally like a feed. Second, the student's past thinking is always visible — you can scroll up and re-read, the way you flip back in a notebook. Third, the notebook accumulates. Sessions build on sessions. Weeks build on weeks. The student can return to a thread from three months ago and find the tutor's notes still there, still legible, still connected to what came after.

The notebook is the product. Everything else — mastery tracking, session history, the constellation of concepts — exists at the periphery.

**Design implication:** The layout is a single, narrow column with generous margins, set on a warm paper-toned background. There is no sidebar. There are no panels. The tutor's voice is differentiated by a thin vertical rule and a distinct colour, not by a chat bubble or avatar. The feeling is of a well-typeset page in a well-bound book.

---

## VI. Silence is a feature

In a real tutorial, there are pauses. The tutor asks a question and waits. Thirty seconds pass. A minute. The student thinks. The room is quiet. This is where the learning actually happens — not in the tutor's words, but in the silence after them.

Digital interfaces are pathologically afraid of silence. Every pause is filled — with loading indicators, with "thinking" animations, with suggestions, with prompts. The assumption is that an idle screen is a broken screen. Ember rejects this assumption.

When the AI asks a Socratic question, the screen goes quiet. There is no loading spinner. There is no "Claude is thinking." There is a blinking cursor in the notebook and nothing else. The system is not broken. It is waiting. It is holding space.

This is the hardest principle to implement, because it requires trust — trust that the student will think rather than abandon, and trust that the parent will not interpret silence as malfunction. But it is the most important principle, because it is the one that distinguishes a tutor from a search engine.

**Design implication:** After a question is posed, the interface enters a state of active silence. The cursor blinks. The page is still. No suggestions appear. No hints are offered. The student must initiate the next move. The system may, after a long pause, offer a single gentle prompt — but never an answer.
