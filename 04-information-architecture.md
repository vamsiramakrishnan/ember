# Ember — Information Architecture

## The principle of minimal surfaces

Ember has three surfaces. Not five, not seven, not "a flexible layout system that accommodates future growth." Three. Every additional surface is a tax on the student's attention. Every panel, sidebar, modal, and dropdown is a moment where the student is navigating instead of thinking.

The three surfaces are derived from the physical spaces of aristocratic tutoring: the notebook on the desk, the bookshelf behind the student, and the star chart on the ceiling of the study.

---

## Surface one: The Notebook

**What it is.** The active session. Today's thinking. The student's writing and the tutor's marginalia, unfolding in a single vertical column.

**What it contains:**
- The session header (session number, date, time, topic thread)
- The student's entries, in chronological order
- The tutor's marginalia, interspersed with the student's entries
- Socratic questions in their question-block treatment
- Concept diagrams, sketched between entries
- Silence markers
- The input cursor at the bottom

**What it does not contain:**
- Navigation elements beyond the three-surface tabs
- A sidebar of any kind
- A list of past sessions
- A progress indicator
- A timer
- A "suggested topics" panel
- Any element that is not part of the conversation between student and tutor

**Relationship to the other surfaces.** The Notebook is where the student spends almost all of their time. It is the product. The other two surfaces are peripheral — visited occasionally, glanced at, returned from. The Notebook is the desk. You sit at it.

**Scroll behaviour.** The Notebook scrolls vertically. New entries appear at the bottom. The student can scroll up to re-read earlier parts of the session. When they scroll back down, the input cursor is waiting where they left it.

Past sessions are accessible by scrolling beyond the top of the current session. The transition is marked by a subtle date divider — a thin ruled line with the session date in `ink-ghost` IBM Plex Mono. There is no "load more" button. The notebook is continuous, like a physical notebook. You flip backward.

---

## Surface two: The Constellation

**What it is.** The student's intellectual map. A quiet, peripheral view of the concepts they have explored, how those concepts connect, and the thinkers who inhabit their intellectual world.

**What it contains, in order of visual weight:**

**Active threads.** The student's current curiosity vector — the two to four questions they are actively carrying. These are rendered as italic Crimson Pro text, each with a thin left border in `rule`. They are the most important element on this surface, because they represent the student's authentic intellectual drive.

**Fluency.** The mastery map. Each concept the student has explored is listed with a thin (2px) progress bar and a percentage in `ink-faint` IBM Plex Mono. Concepts are ordered by fluency level, highest first. The bars use semantic colour: `sage` for mastered concepts, `ink` for strong understanding, `indigo` for developing, `ink-ghost` for early exploration.

When a concept reaches fluency, the system offers a bridge — a quiet suggestion, rendered in `sage-dim` background with `sage` text, of where the student's knowledge could extend next. This suggestion is always connected to the student's curiosity threads. It never says "the next unit is..." It says "this connects to your question about..."

**Thinkers in orbit.** The intellectual lineage. Each thinker who has entered the student's world is presented with their name (italic Cormorant Garamond), their dates (IBM Plex Mono), a one-sentence description of their gift to this student's thinking (Crimson Pro), and a bridge notation showing how they connect to the student's questions (IBM Plex Mono).

**What it does not contain:**
- A graph visualisation (nodes and edges on a canvas). The Constellation is a list, not a diagram. Graphs are visually impressive but cognitively expensive — they demand interpretation. The list is for reading, not for parsing.
- Comparative metrics (percentile rankings, class averages, pace indicators)
- Goals or targets
- Gamification elements (streaks, badges, levels, unlockables)

**Relationship to the other surfaces.** The Constellation is the bookshelf. You stand up from the desk, turn around, and look at it. It tells you where you are in the larger landscape of what you know. Then you turn back to the desk and continue.

The student visits the Constellation infrequently — perhaps once a week, or when they feel curious about their own progress. It is not a dashboard to be checked daily. It is a record to be consulted occasionally.

---

## Surface three: The Philosophy

**What it is.** The design principles and intellectual foundation of Ember, written for the adults in the room — the parent, the educator, or the student themselves if they are old enough to care about why their tool works the way it does.

**What it contains:**
- The six design principles, each with a Roman numeral, a title, a prose explanation, and a provenance label (the thinker or tradition the principle draws from)
- The framing question: "What if every child had a tutor who followed their curiosity, knew them deeply, and never moved on until understanding was real?"

**What it does not contain:**
- Settings
- Account management
- Technical documentation
- FAQ or help content

**Relationship to the other surfaces.** The Philosophy is the star chart on the ceiling. You look up at it occasionally. It orients you in the larger purpose of the thing. Then you look back down at the work.

This surface exists because Ember is making a claim about education that is unfamiliar to most people. A parent encountering this product for the first time may wonder: why is there no curriculum? Why doesn't it grade my child? Why is the interface so quiet? The Philosophy surface answers these questions — not defensively, but with the same calm confidence that characterises the tutor's voice.

---

## Navigation

The three surfaces are accessed through three text labels at the top of the page: **Notebook**, **Constellation**, **Philosophy**. These are rendered in Cormorant Garamond at 14px, separated by 24px of horizontal space, sitting on a thin ruled line.

The active surface is indicated by a 1.5px underline in `ink` and a shift from `ink-faint` to `ink` colour. The transition is a 300ms ease on colour and border. There is no background highlight, no pill shape, no icon.

These three labels are the only persistent navigation in the product. There is no hamburger menu. There is no bottom tab bar. There is no breadcrumb trail. The student always knows where they are because there are only three places to be.

---

## What is not a surface

The following elements exist in Ember but do not occupy their own surface:

**The student's identity** is rendered in the header — name, duration, session count — in IBM Plex Mono at `ink-ghost`. It is present on every surface, in the top-right corner, as a quiet reminder of continuity.

**Session history** is accessed by scrolling up within the Notebook, not through a separate archive or timeline view. The notebook is the archive.

**Settings, account management, and parental controls** exist outside the product, in a separate administrative interface. They are never shown to the student. The student's Ember has no settings page, because a notebook does not have a settings page.

---

## The principle of peripheral visibility

Adapted from Amber Case's calm technology framework: every element in Ember exists on a spectrum from centre to periphery. The student's writing and the tutor's questions are at the centre. The mastery data and session metadata are at the periphery. Nothing at the periphery ever moves to the centre unless the student deliberately navigates to it.

The system does not surface mastery milestones as notifications. It does not pop up "You've mastered Number Theory!" It does not interrupt the Notebook with Constellation data. The student discovers their progress when they choose to look at it — and the looking itself is an act of reflection, not a response to a prompt.

This is the deepest structural difference between Ember and conventional educational software. Conventional software puts the system at the centre (dashboards, progress bars, achievement notifications) and the learning at the periphery (somewhere inside a "lesson" that is one of many clickable items). Ember inverts this entirely. The learning is the centre. The system is the periphery.
