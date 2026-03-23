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
    'silence',        // Wait for the student
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
}`,
  intentDagSchema,
);

// ─── Public API ─────────────────────────────────────────────────

/**
 * Parse student input into an IntentDAG using Gemini Flash Lite.
 * Returns a Zod-validated, deterministically executable DAG.
 */
export async function parseIntentDAG(
  studentText: string,
  recentEntries: LiveEntry[],
): Promise<IntentDAG> {
  const context = recentEntries.slice(-4).map((le) => {
    const e = le.entry;
    if ('content' in e) return `[${e.type}]: ${e.content}`;
    return `[${e.type}]`;
  }).join('\n');

  const prompt = context
    ? `Recent context:\n${context}\n\nStudent input:\n${studentText}`
    : `Student input:\n${studentText}`;

  try {
    const result = await runTextAgent(DAG_AGENT, [
      { role: 'user', parts: [{ text: prompt }] },
    ]);

    const cleaned = result.text
      .replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = intentDagSchema.parse(JSON.parse(cleaned));
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
