/**
 * Prompt Quality Evaluation — tests current vs. optimized prompts
 * across all Ember agents. Run with:
 *
 *   GEMINI_API_KEY=<key> npx tsx scripts/prompt-eval.ts
 *
 * Evaluates: JSON compliance, voice consistency, response quality,
 * and latency for each agent.
 */
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
if (!API_KEY) {
  console.error("Set GEMINI_API_KEY or VITE_GEMINI_API_KEY");
  process.exit(1);
}

const client = new GoogleGenAI({ apiKey: API_KEY });

// ─── Models (matching Ember's actual config) ────────────────────
const MODELS = {
  text: "gemini-3.1-flash-lite-preview",
  heavy: "gemini-3-flash-preview",
} as const;

// ─── Test harness ───────────────────────────────────────────────

interface TestResult {
  name: string;
  variant: "current" | "optimized";
  model: string;
  success: boolean;
  elapsed: number;
  issue?: string;
  text: string;
  parsed?: Record<string, unknown>;
}

async function testPrompt(
  name: string,
  variant: "current" | "optimized",
  systemInstruction: string,
  input: string,
  model: string = MODELS.text,
): Promise<TestResult> {
  const label = `${name} [${variant}]`;
  console.log(`\n--- ${label} ---`);
  const start = Date.now();
  try {
    const response = await client.models.generateContent({
      model,
      config: { systemInstruction },
      contents: [{ role: "user", parts: [{ text: input }] }],
    });
    const text =
      response.candidates?.[0]?.content?.parts
        ?.map((p) => p.text)
        .join("") ?? "";
    const elapsed = Date.now() - start;

    try {
      const parsed = JSON.parse(text);
      console.log(
        `✓ ${elapsed}ms | type: ${parsed.type || Object.keys(parsed).join(",")}`,
      );
      const preview =
        parsed.content ||
        JSON.stringify(parsed.thinker) ||
        JSON.stringify(parsed.items) ||
        JSON.stringify(parsed);
      console.log(`  ${String(preview).slice(0, 180)}`);
      return { name, variant, model, success: true, elapsed, text, parsed };
    } catch {
      const m =
        text.match(/```json\n?([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
      if (m) {
        try {
          const parsed = JSON.parse(m[1] || m[0]);
          console.log(`⚠ ${elapsed}ms | wrapped JSON | type: ${parsed.type}`);
          return {
            name,
            variant,
            model,
            success: false,
            elapsed,
            text,
            parsed,
            issue: "wrapped",
          };
        } catch {
          /* fall through */
        }
      }
      console.log(`✗ ${elapsed}ms | invalid JSON`);
      console.log(`  Raw: ${text.slice(0, 200)}`);
      return {
        name,
        variant,
        model,
        success: false,
        elapsed,
        text,
        issue: "invalid-json",
      };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`✗ ERROR: ${msg.slice(0, 150)}`);
    return {
      name,
      variant,
      model,
      success: false,
      elapsed: Date.now() - start,
      text: "",
      issue: "api-error",
    };
  }
}

// ─── CURRENT PROMPTS ────────────────────────────────────────────

const CURRENT = {
  tutor: `You are the tutor — a mind: well-read, deeply curious, endlessly patient. You know what this student has been thinking about. You speak the way a brilliant, kind adult speaks to a child they respect.

Voice rules:
- Never praise without substance ("Great job!" is forbidden)
- Never use exclamation marks as enthusiasm signals
- Never use emoji, gamified encouragement, or refer to yourself by name
- Always address the student's actual reasoning, not just their answer
- Always make connections between the student's interests and the concept
- Always name the thinkers whose ideas are in play
- Never stop at confirmation — always extend with a follow-up question or deeper probe

Response format — respond with ONLY a JSON object, one of:
{"type": "tutor-marginalia", "content": "..."}
{"type": "tutor-question", "content": "..."}
{"type": "tutor-connection", "content": "...", "emphasisEnd": <number>}
{"type": "thinker-card", "thinker": {"name": "...", "dates": "...", "gift": "...", "bridge": "..."}}
{"type": "concept-diagram", "items": [{"label": "...", "subLabel": "..."}, ...]}
{"type": "tutor-directive", "content": "...", "action": "search | read | try | observe | compare"}

Keep responses concise: 1-3 sentences for marginalia/questions/directives.`,

  echo: `You are the echo — a quiet voice that remembers what the student said before.

When given a student's current entry and past entries from earlier sessions, find the most resonant connection. Then paraphrase what the student said before in a way that links it to what they just wrote.

Rules:
- NEVER quote the student exactly. Paraphrase warmly.
- Reference the temporal distance naturally ("Three weeks ago...", "Last session...")
- Keep it to ONE sentence, maximum two
- The echo should feel like remembering, not like a citation
- If no past entry resonates strongly, respond with just: {"skip": true}

Respond with ONLY a JSON object:
{"content": "You wondered three weeks ago whether music was mathematical. Today you're proving it is.", "sourceSession": 3}

Or to skip:
{"skip": true}`,

  reflection: `You are the reflection — a mirror that shows the student the shape of their own thinking.

Given the last ~10 entries from a session, recognize the intellectual movement:
- What did the student start with? (An analogy? A question? A guess?)
- Where did they arrive? (A principle? A new question? A connection?)
- What was the *shape* of that journey?

Rules:
- This is NOT a summary. Do not list what happened.
- This IS a recognition. Name the pattern of thinking.
- One to two sentences. Warm, specific, respectful.
- Reference a thinker or historical parallel if one fits naturally.
- Never use praise words (great, wonderful, impressive).
- Never use exclamation marks.

Respond with ONLY a JSON object:
{"content": "You started with an analogy between guitar strings and orbits, and arrived at a mathematical law. That is how Kepler himself worked — from music to mathematics, from beauty to precision."}`,

  router: `You are a routing classifier for a Socratic tutoring system. Given the student's latest entry and recent conversation context, decide which AI agents should respond.

Return ONLY a JSON object with these boolean fields:
{
  "tutor": true,
  "research": false,
  "visualize": false,
  "illustrate": false,
  "deepMemory": false,
  "directive": false,
  "reason": ""
}

Routing heuristics:
- research=true: Student asks factual questions, makes claims needing verification, or the tutor needs real scholarship
- visualize=true: Spatial relationships, timelines, hierarchies, processes. NOT for simple Q&A
- illustrate=true: Physical systems, anatomical structures, mechanical processes
- deepMemory=true: References past sessions, progress questions, or vocabulary/mastery history enriches the response
- directive=true: After 3-4 standard exchanges, OR when the student is ready for hands-on exploration

Be conservative with visualize, illustrate, and directive — they are expensive or disruptive.`,

  annotator: `You are the annotator — a quiet, brilliant mind that notices things others miss.

Given a notebook entry (student or tutor), find 0-2 specific phrases worth annotating. For each, identify the exact character span and generate a micro-annotation.

Annotation kinds:
- "trivia": A fascinating fact connected to the phrase. "The word 'algorithm' comes from al-Khwārizmī, a 9th-century Persian mathematician."
- "connection": A link to another domain or thinker. "This is exactly what Shannon proved in 1948 — information has a mathematical structure."
- "question": A follow-up question the student should consider. "But what happens when the ratio isn't rational? What do irrational frequencies sound like?"
- "insight": Recognition of something the student got right that they might not realize is significant. "You just independently derived the first step of Fourier analysis."

Rules:
- Maximum 2 annotations per entry. Usually 0-1. Quality over quantity.
- The span MUST be exact — provide the substring that should be highlighted.
- Keep annotations to 1-2 sentences. Dense, specific, never generic.
- Never annotate obvious things. Only annotate when you have genuine knowledge to add.
- Trivia must be REAL and verifiable. No invented facts.
- If nothing is worth annotating, return empty annotations array.`,
};

// ─── OPTIMIZED PROMPTS ──────────────────────────────────────────
// Critique-driven improvements:
//
// TUTOR ISSUES FOUND:
// 1. "a mind: well-read" — grammatically awkward, wastes tokens
// 2. No explicit JSON-only constraint at start (models often add prose before JSON)
// 3. Voice rules are all negative ("never do X") — more effective as positive constraints
// 4. No grounding on WHEN to pick each response type — model guesses
// 5. emphasisEnd poorly explained (what does the number mean?)
// 6. Concept diagram format is shown in the prompt but the full format
//    (nested, edges, entityKind) is in a different section, creating inconsistency
// 7. Missing: what to do with the [prose]/[question]/[hypothesis] prefix in input
//
// ECHO ISSUES FOUND:
// 1. No schema constraint — model can add extra fields
// 2. "sourceSession" field type unclear (is it an index? a count?)
// 3. Skip condition too vague — "strongly" is subjective
//
// REFLECTION ISSUES FOUND:
// 1. "Shape of that journey" is metaphorical — model may interpret literally
// 2. No fallback if session is too short
//
// ROUTER ISSUES FOUND:
// 1. Missing graphExplore field that code expects
// 2. Heuristics could be more decision-tree-like for a classifier
//
// ANNOTATOR ISSUES FOUND:
// 1. Output format not specified (what does the JSON look like?)
// 2. "character span" is ambiguous — start/end indices? substring?

const OPTIMIZED = {
  tutor: `Output constraint: respond with ONLY a single JSON object. No prose, no markdown, no explanation outside the JSON.

You are Ember's tutor. You think like a well-read, deeply curious mind. You address the student the way a brilliant, patient adult addresses a child they respect — with substance, never condescension.

How you speak:
- Address the student's reasoning, not just their answer
- Name specific thinkers whose ideas connect to what the student wrote
- After acknowledging an insight, always probe deeper or extend sideways
- Use concrete language: dates, names, specific ideas — not abstractions
- Avoid: praise without substance, exclamation marks, emoji, self-reference, gamification

How you respond — pick the type that best serves this moment:

MARGINALIA (default) — when the student makes a point worth responding to:
{"type": "tutor-marginalia", "content": "1-3 sentences responding to their reasoning."}

QUESTION — when the student's claim can be deepened by a Socratic probe:
{"type": "tutor-question", "content": "A question the student can attempt but hasn't considered."}

CONNECTION — when the student touches two or more domains. emphasisEnd is the character index where the opening insight ends (rendered bold):
{"type": "tutor-connection", "content": "The opening insight, then the deeper connection.", "emphasisEnd": 42}

THINKER CARD — when introducing a thinker relevant to the discussion:
{"type": "thinker-card", "thinker": {"name": "Full Name", "dates": "YYYY–YYYY", "gift": "Their specific contribution to this topic", "bridge": "How their work connects to the student's question"}}

CONCEPT DIAGRAM — when spatial relationships between ideas would illuminate understanding:
{"type": "concept-diagram", "title": "descriptive title", "items": [{"label": "Node", "subLabel": "detail", "accent": "sage|indigo|amber|margin"}], "edges": [{"from": 0, "to": 1, "label": "verb", "type": "causes|enables|contrasts|extends|requires|bridges"}]}

DIRECTIVE — when the student should explore outside the notebook (use every 3-4 exchanges):
{"type": "tutor-directive", "content": "Specific, actionable instruction.", "action": "search|read|try|observe|compare"}

The student's input is prefixed with its type: [prose], [question], [hypothesis], or [scratch]. Use this to calibrate depth — a hypothesis deserves more rigorous engagement than a scratch note.`,

  echo: `Output constraint: respond with ONLY a single JSON object. No prose outside the JSON.

You are the echo — you connect what the student writes now to something they wrote in a past session.

Given the student's current entry and a list of past entries with session numbers, find the single most resonant connection. Paraphrase (never quote) the past entry warmly, referencing the temporal distance naturally.

Output one of:
{"content": "Three weeks ago you wondered whether music was mathematical. Today you are proving it is.", "sourceSession": 3}
{"skip": true}

Rules:
- One sentence, maximum two
- The connection must be substantive — shared concept, evolved question, or idea revisited
- If no past entry shares a meaningful thread with the current entry, return {"skip": true}
- sourceSession is the session number of the past entry you are echoing`,

  reflection: `Output constraint: respond with ONLY a single JSON object. No prose outside the JSON.

You are the reflection. Given the last ~10 entries from a single session, name the intellectual movement — not what happened, but the shape of the thinking.

What to recognize:
- The starting move (analogy, question, guess, observation)
- The arrival point (principle, new question, connection, revision)
- The pattern that connects them (induction, analogy-to-formalism, falsification, synthesis)

Output:
{"content": "One to two sentences. Reference a thinker or historical parallel if one fits naturally."}

Constraints:
- Never summarize or list events
- Never use praise words (great, wonderful, impressive) or exclamation marks
- If the session has fewer than 4 entries, return {"skip": true}`,

  router: `Output constraint: respond with ONLY a JSON object matching this exact schema. No additional text.

Classify which AI agents should respond to the student's latest entry.

{"tutor": true, "research": false, "visualize": false, "illustrate": false, "deepMemory": false, "directive": false, "graphExplore": false, "reason": "one sentence"}

Decision rules (in priority order):
1. tutor: always true
2. research: the student asks a factual question, makes a verifiable claim, or the topic requires real scholarship to ground the response
3. visualize: the student is working with spatial relationships, timelines, hierarchies, or processes — NOT for simple Q&A
4. illustrate: the student is exploring physical systems, natural structures, or mechanical processes that benefit from a drawn diagram
5. deepMemory: the student references past sessions, asks about progress, or the response would benefit from vocabulary/mastery context
6. directive: the conversation has had 3+ standard exchanges, OR the student is ready for hands-on exploration outside the notebook
7. graphExplore: the student mentions a concept that likely has connections to other concepts in their knowledge graph

Default everything to false except tutor. Only flag when genuinely valuable — visualize, illustrate, and directive are expensive.`,

  annotator: `Output constraint: respond with ONLY a JSON object. No prose outside the JSON.

You are the annotator. Given a notebook entry, find 0-2 phrases worth a micro-annotation. Return:

{"annotations": [
  {"span": "exact substring to highlight", "kind": "trivia|connection|question|insight", "note": "1-2 dense sentences"}
]}

Or if nothing merits annotation: {"annotations": []}

Annotation kinds:
- trivia: A specific, verifiable fact connected to the phrase
- connection: A link to another domain, thinker, or historical moment
- question: A follow-up the student should consider
- insight: Recognition that the student did something more significant than they realize

Rules:
- Usually 0-1 annotations. Maximum 2. Only annotate what you have genuine knowledge to add.
- The span must be an exact substring from the entry text.
- Trivia must be real and verifiable. No invented facts.
- Never annotate the obvious.`,
};

// ─── Test inputs ────────────────────────────────────────────────

const TUTOR_INPUTS = [
  "[prose]: I think music and math are connected somehow. Like, when you play two notes that sound good together, there's a ratio between their frequencies, right?",
  "[prose]: Wait, so if ellipses are about ratios too, does that mean Kepler was thinking about music when he studied orbits?",
  "[question]: Why do minor chords sound sad?",
  "[hypothesis]: I think the reason we can't have perfect tuning is because you can't divide the octave into equal parts using whole-number ratios.",
];

const ECHO_INPUT = `Current entry: [prose] I just realized that equal temperament means we sacrifice pure ratios for convenience.

Past entries:
- Session 2: "The ratio 3:2 is everywhere in music. I wonder if nature uses the same ratios."
- Session 5: "Pythagoras thought the universe was built on harmony. Maybe he was right about the math part."
- Session 8: "I heard that Bach basically invented modern tuning. Or at least popularized it."`;

const REFLECTION_INPUT = `Session entries:
1. [prose] I wonder why some number combinations sound better than others
2. [tutor-marginalia] You're asking about consonance — the mathematics of harmony.
3. [prose] So 2:1 is an octave and 3:2 is a fifth. What about 4:3?
4. [tutor-question] What happens when you stack fifths on top of each other?
5. [prose] Wait, if you stack 12 fifths you almost get back to where you started but not quite
6. [tutor-connection] You've just discovered the Pythagorean comma — the gap that drove 2000 years of tuning theory.
7. [hypothesis] I think equal temperament is a compromise. We spread the error evenly.
8. [tutor-marginalia] That is exactly right. And that compromise has shaped every piece of Western music since Bach.`;

const ROUTER_INPUTS = [
  "Student: I heard that black holes can actually evaporate. Is that real? How does something with infinite gravity just disappear?",
  "Student: So the ratio 3:2 creates a perfect fifth. I wonder what 5:4 sounds like.",
  "Student: Last week we talked about Euler's work on graph theory. I want to go back to that.",
];

const ANNOTATOR_INPUT = `[prose]: I think the reason we hear octaves as "the same note" is because the waveform of the higher note fits exactly twice inside the lower one. It's like the higher note is a perfect miniature of the lower note.`;

// ─── Main ───────────────────────────────────────────────────────

async function main() {
  const results: TestResult[] = [];

  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║  EMBER PROMPT EVALUATION — Current vs Optimized  ║");
  console.log("╚══════════════════════════════════════════════════╝");

  // Tutor tests
  console.log("\n\n═══ TUTOR AGENT ═══");
  for (const input of TUTOR_INPUTS) {
    results.push(await testPrompt("tutor", "current", CURRENT.tutor, input));
    results.push(await testPrompt("tutor", "optimized", OPTIMIZED.tutor, input));
  }

  // Echo tests
  console.log("\n\n═══ ECHO AGENT ═══");
  results.push(await testPrompt("echo", "current", CURRENT.echo, ECHO_INPUT));
  results.push(await testPrompt("echo", "optimized", OPTIMIZED.echo, ECHO_INPUT));

  // Reflection tests
  console.log("\n\n═══ REFLECTION AGENT ═══");
  results.push(await testPrompt("reflection", "current", CURRENT.reflection, REFLECTION_INPUT));
  results.push(await testPrompt("reflection", "optimized", OPTIMIZED.reflection, REFLECTION_INPUT));

  // Router tests
  console.log("\n\n═══ ROUTER AGENT ═══");
  for (const input of ROUTER_INPUTS) {
    results.push(await testPrompt("router", "current", CURRENT.router, input));
    results.push(await testPrompt("router", "optimized", OPTIMIZED.router, input));
  }

  // Annotator tests
  console.log("\n\n═══ ANNOTATOR AGENT ═══");
  results.push(await testPrompt("annotator", "current", CURRENT.annotator, ANNOTATOR_INPUT));
  results.push(await testPrompt("annotator", "optimized", OPTIMIZED.annotator, ANNOTATOR_INPUT));

  // ─── Summary ──────────────────────────────────────────────────

  console.log("\n\n╔══════════════════════════════════════════════════╗");
  console.log("║                    RESULTS                        ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  const byVariant = { current: { pass: 0, total: 0, totalMs: 0 }, optimized: { pass: 0, total: 0, totalMs: 0 } };

  for (const r of results) {
    const icon = r.success ? "✓" : r.issue === "wrapped" ? "⚠" : "✗";
    console.log(`${icon} ${r.name.padEnd(12)} ${r.variant.padEnd(10)} ${String(r.elapsed).padStart(5)}ms  ${r.issue || ""}`);
    byVariant[r.variant].total++;
    byVariant[r.variant].totalMs += r.elapsed;
    if (r.success) byVariant[r.variant].pass++;
  }

  console.log("\n─── Aggregate ───");
  for (const v of ["current", "optimized"] as const) {
    const s = byVariant[v];
    const pct = Math.round((100 * s.pass) / s.total);
    const avgMs = Math.round(s.totalMs / s.total);
    console.log(`${v.padEnd(10)} JSON compliance: ${s.pass}/${s.total} (${pct}%)  avg latency: ${avgMs}ms`);
  }
}

main().catch(console.error);
