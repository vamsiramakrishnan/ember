# Ember — Compound Intent & DAG Execution

## The problem with chat

Most AI tutoring systems are chat systems in disguise. The student types a message, the AI types a response. One input, one output. This forces compound thoughts into a single channel:

> "How does Kepler's second law relate to Newton's gravity? Can you visualize it and also explain it using music?"

In a chat system, this becomes one response — a long monologue trying to answer, visualize, AND explain in a single text block. The student gets a wall of text. The notebook metaphor collapses.

## The notebook is an orchestration surface

Ember treats the notebook as a **workspace**, not a chat window. A single student input can produce multiple artifacts: a marginalia response, a concept diagram, a reading material deck. Each artifact is a separate notebook entry, placed in the flow where it belongs.

The mechanism that enables this is the **Intent DAG** — a directed acyclic graph of execution intents parsed from the student's input.

---

## How it works

### 1. LLM-powered parsing (not regex)

When the student submits input, Gemini Flash Lite parses it into a structured DAG. The LLM understands natural language, @mentions, and /commands. It outputs a Zod-validated JSON structure — no regex, no brittle heuristics.

```
Student: "How does @Kepler's second law relate to @Newton's gravity?
          /visualize the relationship and /explain using music analogies"
```

The LLM produces:

```json
{
  "nodes": [
    { "id": "n0", "action": "respond", "content": "How does Kepler's second law relate to Newton's gravity?",
      "entities": [{"name":"Kepler","entityType":"thinker"},{"name":"Newton","entityType":"thinker"}],
      "dependsOn": [], "parallel": false, "label": "answering" },
    { "id": "n1", "action": "visualize", "content": "relationship between Kepler's second law and Newton's gravity",
      "entities": [...], "dependsOn": ["n0"], "parallel": true, "label": "mapping concepts" },
    { "id": "n2", "action": "explain", "content": "using music analogies",
      "entities": [], "dependsOn": ["n0"], "parallel": true, "label": "preparing material" }
  ],
  "rootId": "n0",
  "isCompound": true,
  "summary": "Kepler-Newton relationship, visualized and explained through music"
}
```

### 2. Deterministic execution

The DAG executor is purely mechanical. No LLM in the execution loop.

1. **Topological sort** — order nodes by dependencies
2. **Wave grouping** — group nodes whose deps are all satisfied
3. **Parallel dispatch** — nodes flagged `parallel: true` in the same wave run concurrently
4. **Result collection** — entries appear in the notebook as each node completes

```
Wave 0: [n0: respond]           ← root, streams to notebook
Wave 1: [n1: visualize, n2: explain]  ← parallel, depend on n0
```

### 3. Response plan preview

While the DAG executes, a quiet plan preview appears in the notebook:

```
  responding          ✓
  mapping concepts    ›
  preparing material  ·
```

This gives the student visibility into what's happening without demanding attention.

---

## Interaction patterns

### Simple input (single node)

```
Student: "I think the analogy breaks down because gravity gets weaker"
```

DAG: single node, `isCompound: false`. Skips the DAG overhead entirely. Routes directly to the existing single-response orchestrator.

### Compound input (multiple nodes)

```
Student: "/research the history of harmonic series and /flashcards for key concepts"
```

DAG: `research` → `flashcards` (sequential, flashcards depend on research).

### Mixed references and commands

```
Student: "How does @Euler's identity connect music to @Kepler's spheres? /connect them and /timeline the discovery"
```

DAG: `respond` → [`connect`, `timeline`] (parallel after root).

---

## Smart chips

@mentions and /commands render as inline chips that flow within sentences. They are not foreign objects — they are slightly warm words in the text.

### @mention chips

- Inherit surrounding font family and size
- `paper-warm` background, `rule-light` border
- Entity-type icon as prefix (◈ thinker, ◇ concept, ≡ term)
- Accent colour by entity type (amber/indigo/sage)
- Hover: border darkens, background warms
- Click: navigates to entity in Constellation

### /command chips

- `indigo-dim` background (inquiry colour)
- IBM Plex Mono font, slightly smaller
- Hover: background deepens
- Rendered inline within the submitted entry so the student can see what they asked for

---

## Design principles

1. **The notebook is not a chat.** One input can produce many outputs. Each output is a first-class notebook entry.
2. **LLM parses, code executes.** The AI understands intent. The executor handles mechanics. Separation of concerns.
3. **Dependencies are explicit.** The DAG makes execution order visible and debuggable.
4. **Parallel when possible.** Independent artifacts are produced concurrently.
5. **Graceful degradation.** If DAG parsing fails, fall back to single-response mode. The student never sees an error.
6. **The plan is visible.** The ResponsePlanPreview gives the student agency — they can see what's happening.

---

## File map

| File | Purpose |
|------|---------|
| `src/services/intent-dag.ts` | LLM-powered DAG parsing with Zod schema |
| `src/services/dag-executor.ts` | Deterministic wave-based execution |
| `src/services/dag-dispatcher.ts` | Routes nodes to agents |
| `src/hooks/useResponseOrchestrator.ts` | React hook coordinating the flow |
| `src/components/tutor/ResponsePlanPreview.tsx` | Quiet execution plan UI |
