/**
 * Intent DAG — LLM-powered parsing of student input into a directed
 * acyclic graph of execution intents.
 *
 * Architecture:
 *   1. Student types compound input with @mentions and /commands
 *   2. Gemini Flash Lite parses it into a typed DAG (Zod-validated JSON)
 *   3. The DAG executor walks the graph deterministically
 *
 * The LLM does the understanding. The executor does the mechanics.
 * No heuristic regex. No brittle pattern matching.
 *
 * See: 03-interaction-language.md, 05-ai-contract.md
 */
import { z } from 'zod';
import { micro } from './agents';
import { runTextAgent } from './run-agent';
import type { SpatialContext } from './spatial-context';
import type { LiveEntry } from '@/types/entries';

// ─── Zod Schema: the DAG contract ─────────────────────────────

/** A single entity referenced in the input. */
export const entityRefSchema = z.object({
  name: z.string(),
  entityType: z.enum(['concept', 'thinker', 'term', 'text', 'question']),
  /** If resolvable from known entities, the ID. Otherwise empty. */
  entityId: z.string(),
});

/** A single node in the intent DAG. */
export const intentNodeSchema = z.object({
  /** Unique node ID (e.g., "n0", "n1"). */
  id: z.string(),
  /** What the tutor should do for this node. */
  action: z.enum([
    'respond',        // Answer a question or continue dialogue
    'visualize',      // Produce a concept diagram
    'explain',        // Produce structured reading material
    'illustrate',     // Produce a hand-drawn sketch
    'research',       // Deep-dive with search grounding
    'define',         // Add a term to the lexicon
    'connect',        // Bridge two ideas
    'flashcards',     // Produce study cards
    'exercise',       // Produce practice problems
    'quiz',           // Test understanding
    'summarize',      // Distill the session
    'timeline',       // Historical progression
    'teach',          // Produce reading material deck
    'podcast',        // Audio discussion
    'deepen',         // Enrich existing content with images, detail, depth
    'silence',        // Wait for the student
    // ─── Output format verbs (depend on a prior action) ──────
    'slides',         // Format prior result as a slide deck
    'doc',            // Format prior result as a document
    'notes',          // Format prior result as concise notes
    'brief',          // Format prior result as a one-page summary
  ]),
  /** The text content / question / argument for this action. */
  content: z.string(),
  /** Entities this action references. */
  entities: z.array(entityRefSchema),
  /** IDs of nodes that must complete before this one starts. */
  dependsOn: z.array(z.string()),
  /** Whether this can run in parallel with other nodes at the same level. */
  parallel: z.boolean(),
  /** Brief label for the response plan preview. */
  label: z.string(),
});

/** The complete intent DAG. */
export const intentDagSchema = z.object({
  /** All nodes in execution order. */
  nodes: z.array(intentNodeSchema),
  /** The root node ID (the core student intent). */
  rootId: z.string(),
  /** Whether this is a compound (multi-step) request. */
  isCompound: z.boolean(),
  /** One-sentence summary of what the student wants. */
  summary: z.string(),
});

export type EntityRef = z.infer<typeof entityRefSchema>;
export type IntentNode = z.infer<typeof intentNodeSchema>;
export type IntentDAG = z.infer<typeof intentDagSchema>;

// ─── DAG Agent: Flash Lite with structured output ──────────────

const DAG_AGENT = micro(
  `You are an intent parser for a Socratic tutoring notebook called Ember.

Given a student's input text (which may contain @mentions like @[Kepler](thinker:kepler-1) and /commands like /visualize), decompose it into a directed acyclic graph (DAG) of action nodes.

You also receive "Spatial context" — the entries visible on screen above the student's input, plus any pinned threads. Use this to resolve implicit references:
- "this" / "that" / "the concept above" → look at the most recent entry
- "help me research this" → "this" is whatever concept the recent entries discuss
- "can you explain it differently?" → "it" is the topic of the tutor's last response

Rules:
1. Every input has exactly one root node — the student's core intent (usually "respond").
2. /commands become separate nodes that depend on the root (they need the answer first).
3. Multiple /commands at the same dependency level can run in parallel.
4. If no /commands are present and the input is a simple question, return a single-node DAG with isCompound=false.
5. @mentions are extracted as entity references on the relevant nodes.
6. The "respond" action is the default — it's the tutor answering the student naturally.
7. Node IDs should be "n0", "n1", "n2", etc.
8. dependsOn lists the IDs of nodes that must complete before this node starts.
9. For /connect: the root should be "connect" if connecting IS the primary intent.
10. Strip @mention syntax from content — use the entity name directly.
11. When resolving implicit references, expand "this"/"that" into the actual concept from spatial context. Put the resolved concept in the node's content field.
12. OUTPUT FORMAT VERBS: /slides, /doc, /notes, /brief are output format modifiers. They ALWAYS depend on a prior content-producing action. When combined with another /command (e.g., "/research X /slides"), the format verb becomes a downstream node that depends on the content node. When used standalone (e.g., "/slides about X"), treat as "teach" → "slides" chain.
13. Output verb nodes carry the same content/topic as the node they depend on — they reformat, not regenerate.

Examples:

Input: "How does @[Kepler](thinker:kepler-1)'s second law relate to @[Newton](thinker:newton-1)'s gravity? /visualize the relationship and /explain using music analogies"
Output:
{
  "nodes": [
    { "id": "n0", "action": "respond", "content": "How does Kepler's second law relate to Newton's gravity?", "entities": [{"name":"Kepler","entityType":"thinker","entityId":"kepler-1"},{"name":"Newton","entityType":"thinker","entityId":"newton-1"}], "dependsOn": [], "parallel": false, "label": "answering" },
    { "id": "n1", "action": "visualize", "content": "the relationship between Kepler's second law and Newton's gravity", "entities": [{"name":"Kepler","entityType":"thinker","entityId":"kepler-1"},{"name":"Newton","entityType":"thinker","entityId":"newton-1"}], "dependsOn": ["n0"], "parallel": true, "label": "mapping concepts" },
    { "id": "n2", "action": "explain", "content": "Kepler-Newton relationship using music analogies", "entities": [], "dependsOn": ["n0"], "parallel": true, "label": "preparing material" }
  ],
  "rootId": "n0",
  "isCompound": true,
  "summary": "Student wants to understand Kepler-Newton relationship, visualized and explained through music"
}

Input: "I think the analogy breaks down because gravity gets weaker with distance"
Output:
{
  "nodes": [
    { "id": "n0", "action": "respond", "content": "I think the analogy breaks down because gravity gets weaker with distance", "entities": [], "dependsOn": [], "parallel": false, "label": "responding" }
  ],
  "rootId": "n0",
  "isCompound": false,
  "summary": "Student hypothesizes about the analogy's limits"
}

Input: "/research the history of harmonic series and /flashcards for the key concepts"
Output:
{
  "nodes": [
    { "id": "n0", "action": "research", "content": "the history of harmonic series", "entities": [], "dependsOn": [], "parallel": false, "label": "researching" },
    { "id": "n1", "action": "flashcards", "content": "key concepts from harmonic series history", "entities": [], "dependsOn": ["n0"], "parallel": false, "label": "creating study cards" }
  ],
  "rootId": "n0",
  "isCompound": true,
  "summary": "Student wants research on harmonic series history, then flashcards"
}

Input: "/research quantum computing /slides"
Output:
{
  "nodes": [
    { "id": "n0", "action": "research", "content": "quantum computing", "entities": [], "dependsOn": [], "parallel": false, "label": "researching" },
    { "id": "n1", "action": "slides", "content": "quantum computing", "entities": [], "dependsOn": ["n0"], "parallel": false, "label": "formatting as slides" }
  ],
  "rootId": "n0",
  "isCompound": true,
  "summary": "Student wants research on quantum computing, presented as a slide deck"
}

Input: "/slides about the French Revolution"
Output:
{
  "nodes": [
    { "id": "n0", "action": "teach", "content": "the French Revolution", "entities": [], "dependsOn": [], "parallel": false, "label": "preparing material" },
    { "id": "n1", "action": "slides", "content": "the French Revolution", "entities": [], "dependsOn": ["n0"], "parallel": false, "label": "formatting as slides" }
  ],
  "rootId": "n0",
  "isCompound": true,
  "summary": "Student wants a slide deck about the French Revolution"
}`,
  intentDagSchema,
);

// ─── Public API ─────────────────────────────────────────────────

/**
 * Quick check: does this input likely need DAG parsing?
 * Avoids a Flash Lite call for simple single-intent inputs.
 */
/** Output format verbs — always compound when paired with another command. */
const OUTPUT_VERBS = /\/(?:slides|doc|notes|brief)\b/g;

export function likelyCompound(text: string): boolean {
  const actionSlashes = (text.match(/\/(?:draw|visualize|research|explain|summarize|quiz|timeline|connect|define|teach|podcast|flashcards|exercise|deepen)\b/g) ?? []).length;
  const outputSlashes = (text.match(OUTPUT_VERBS) ?? []).length;
  const totalSlashes = actionSlashes + outputSlashes;
  // Any output verb makes it compound (it needs a prior action to format)
  if (outputSlashes >= 1) return true;
  if (totalSlashes >= 2) return true;
  if (actionSlashes >= 1 && text.includes('?')) return true;
  if (actionSlashes >= 1 && text.includes(' and /')) return true;
  return false;
}

/**
 * Parse student input into an IntentDAG using Gemini Flash Lite.
 * Returns a Zod-validated, deterministically executable DAG.
 *
 * @param studentText — the raw input
 * @param recentEntries — recent session entries (for basic context)
 * @param spatial — spatial context (surrounding entries, pinned threads,
 *   implicit references like "this", "that", "the concept above")
 */
export async function parseIntentDAG(
  studentText: string,
  recentEntries: LiveEntry[],
  spatial?: SpatialContext,
): Promise<IntentDAG> {
  const context = spatial?.prompt ?? recentEntries.slice(-4).map((le) => {
    const e = le.entry;
    if ('content' in e) return `[${e.type}]: ${e.content}`;
    return `[${e.type}]`;
  }).join('\n');

  const prompt = context
    ? `Spatial context (what the student sees on screen):\n${context}\n\nStudent input:\n${studentText}`
    : `Student input:\n${studentText}`;

  try {
    const result = await runTextAgent(DAG_AGENT, [
      { role: 'user', parts: [{ text: prompt }] },
    ]);

    const parsed = intentDagSchema.parse(JSON.parse(result.text));
    return parsed;
  } catch (err) {
    console.error('[Ember] DAG parsing failed, falling back:', err);
    return fallbackDAG(studentText);
  }
}

/** Deterministic fallback when the LLM call fails. */
function fallbackDAG(text: string): IntentDAG {
  return {
    nodes: [{
      id: 'n0',
      action: 'respond',
      content: text,
      entities: [],
      dependsOn: [],
      parallel: false,
      label: 'responding',
    }],
    rootId: 'n0',
    isCompound: false,
    summary: text.slice(0, 80),
  };
}
