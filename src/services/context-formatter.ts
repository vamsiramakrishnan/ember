/**
 * Context Formatter — templates knowledge graph data into prompt-ready
 * text in multiple formats: narrative, bulleted, or semi-structured.
 *
 * The raw KG data (concepts, gaps, threads, thinkers) is the same
 * regardless of who consumes it. What changes is the *shape* of the
 * text: a sketch prompt needs a short narrative; a flashcard generator
 * needs a bulleted list of weak concepts; the DAG dispatcher needs
 * a compact semi-structured block.
 *
 * No component in the app should serialize KG data ad-hoc.
 * All KG → text goes through this formatter.
 */
import type { GraphContextLayer } from './graph-context';

export type ContextFormat = 'narrative' | 'bulleted' | 'structured';

// ─── Shared data shape ──────────────────────────────────────

export interface FormattableContext {
  /** What the student is working on right now. */
  activeConcepts: GraphContextLayer['activeConcepts'];
  /** Nearby weak spots in the student's knowledge. */
  nearbyGaps: GraphContextLayer['nearbyGaps'];
  /** Open questions the student hasn't resolved. */
  openThreads: string[];
  /** Thinkers whose ideas connect but haven't been bridged. */
  unbridgedThinkers: GraphContextLayer['unbridgedThinkers'];
  /** Compressed session summary (working memory). */
  sessionSummary?: string;
  /** Mastery snapshot for quick reference. */
  mastery?: Array<{ concept: string; level: string; percentage: number }>;
}

// ─── Format: Narrative ──────────────────────────────────────
// Natural language paragraph. Best for image prompts, podcast
// scripts, or any context that feeds into a creative agent.

function formatNarrative(ctx: FormattableContext): string {
  const parts: string[] = [];

  if (ctx.sessionSummary) {
    parts.push(ctx.sessionSummary);
  }

  if (ctx.activeConcepts.length > 0) {
    const names = ctx.activeConcepts.map((c) => c.concept).join(', ');
    parts.push(`The student is currently exploring ${names}.`);
  }

  if (ctx.nearbyGaps.length > 0) {
    const gaps = ctx.nearbyGaps
      .map((g) => `${g.concept} (${g.percentage}%)`)
      .join(', ');
    parts.push(`Areas that need deepening: ${gaps}.`);
  }

  if (ctx.openThreads.length > 0) {
    parts.push(
      `Unresolved questions: ${ctx.openThreads.map((q) => `"${q}"`).join('; ')}.`,
    );
  }

  if (ctx.unbridgedThinkers.length > 0) {
    const thinkers = ctx.unbridgedThinkers
      .map((t) => `${t.name} (${t.coreIdea})`)
      .join(', ');
    parts.push(`Thinkers with relevant but unexplored ideas: ${thinkers}.`);
  }

  return parts.join(' ');
}

// ─── Format: Bulleted ───────────────────────────────────────
// Markdown-style bullets. Best for structured generators
// (flashcards, exercises, reading material) that need to
// enumerate what to focus on.

function formatBulleted(ctx: FormattableContext): string {
  const sections: string[] = [];

  if (ctx.sessionSummary) {
    sections.push(`**Session context:** ${ctx.sessionSummary}`);
  }

  if (ctx.activeConcepts.length > 0) {
    sections.push('**Active concepts:**');
    for (const c of ctx.activeConcepts) {
      sections.push(
        `- ${c.concept} — ${c.level} (${c.percentage}%), ${c.connections} connections`,
      );
    }
  }

  if (ctx.mastery && ctx.mastery.length > 0) {
    sections.push('**Student mastery:**');
    for (const m of ctx.mastery) {
      sections.push(`- ${m.concept}: ${m.level} (${m.percentage}%)`);
    }
  }

  if (ctx.nearbyGaps.length > 0) {
    sections.push('**Learning gaps (focus here):**');
    for (const g of ctx.nearbyGaps) {
      sections.push(`- ${g.concept} (${g.percentage}%): ${g.reason}`);
    }
  }

  if (ctx.openThreads.length > 0) {
    sections.push('**Open questions:**');
    for (const q of ctx.openThreads) {
      sections.push(`- "${q}"`);
    }
  }

  if (ctx.unbridgedThinkers.length > 0) {
    sections.push('**Unbridged thinkers:**');
    for (const t of ctx.unbridgedThinkers) {
      sections.push(`- ${t.name}: "${t.coreIdea}"`);
    }
  }

  return sections.join('\n');
}

// ─── Format: Structured ─────────────────────────────────────
// Tagged blocks with compact key-value pairs. Best for agents
// that parse structured context (DAG dispatcher, tutor).
// Matches the existing [KNOWLEDGE GRAPH] block format.

function formatStructured(ctx: FormattableContext): string {
  const lines: string[] = ['[KNOWLEDGE GRAPH — active context]'];

  if (ctx.sessionSummary) {
    lines.push(`Session: ${ctx.sessionSummary}`);
  }

  if (ctx.activeConcepts.length > 0) {
    lines.push('Active concepts:');
    for (const c of ctx.activeConcepts) {
      lines.push(
        `  ${c.concept}: ${c.level} (${c.percentage}%) — ${c.connections} connections`,
      );
    }
  }

  if (ctx.nearbyGaps.length > 0) {
    lines.push('Learning gaps:');
    for (const g of ctx.nearbyGaps) {
      lines.push(`  ${g.concept} (${g.percentage}%): ${g.reason}`);
    }
  }

  if (ctx.openThreads.length > 0) {
    lines.push('Open questions:');
    for (const q of ctx.openThreads) {
      lines.push(`  "${q}"`);
    }
  }

  if (ctx.unbridgedThinkers.length > 0) {
    lines.push('Unbridged thinkers:');
    for (const t of ctx.unbridgedThinkers) {
      lines.push(`  ${t.name}: "${t.coreIdea}"`);
    }
  }

  return lines.join('\n');
}

// ─── Public API ─────────────────────────────────────────────

/**
 * Format knowledge graph context for injection into an agent prompt.
 *
 * @param ctx — the assembled context data
 * @param format — how to shape the output:
 *   - `'narrative'` — flowing prose (for creative agents: /draw, /podcast)
 *   - `'bulleted'` — markdown bullets (for structured agents: /flashcards, /teach, /exercise)
 *   - `'structured'` — tagged blocks (for reasoning agents: tutor, DAG, /research)
 */
export function formatContext(
  ctx: FormattableContext,
  format: ContextFormat,
): string {
  switch (format) {
    case 'narrative': return formatNarrative(ctx);
    case 'bulleted': return formatBulleted(ctx);
    case 'structured': return formatStructured(ctx);
  }
}
