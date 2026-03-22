/**
 * Orchestrator — the multi-agent brain.
 *
 * Every student entry triggers this pipeline:
 * 1. File Search (always) — find relevant context from ALL indexed content
 * 2. Researcher (when factual depth needed) — Google Search + URL grounding
 * 3. Tutor (always) — Socratic response with enriched context
 * 4. Visualiser (when diagrams/visuals requested) — HTML generation
 * 5. Illustrator (when sketches requested) — image generation
 *
 * File Search is ALWAYS-ON: the tutor always has access to the student's
 * full intellectual history (sessions, lexicon, encounters, library,
 * mastery, curiosities). This enables natural cross-references without
 * the student needing to say "remember when...".
 */
import { TUTOR_AGENT, RESEARCHER_AGENT, ILLUSTRATOR_AGENT } from './agents';
import { runTextAgent, runImageAgent } from './run-agent';
import { generateHtml } from './gemini-html';
import {
  getOrCreateStore,
  searchNotebook,
  searchByType,
  indexSession,
} from './gemini-file-search';
import { isGeminiAvailable, getGeminiClient } from './gemini';
import type { NotebookEntry, LiveEntry } from '@/types/entries';
import type { AgentMessage } from './run-agent';

/** What the orchestrator decides to do. */
export interface OrchestratorPlan {
  tutor: boolean;
  research: boolean;
  visualize: boolean;
  illustrate: boolean;
  deepMemory: boolean;
}

const VISUAL_TRIGGERS = [
  'show me', 'draw', 'diagram', 'visuali', 'picture',
  'map', 'timeline', 'chart', 'graph', 'illustrat',
  'what does it look like', 'how does it connect',
];

const RESEARCH_TRIGGERS = [
  'who was', 'when did', 'what year', 'is it true',
  'what exactly', 'how exactly', 'tell me more about',
  'what\'s the evidence', 'what did', 'where did',
  'the history of', 'in what century',
];

/** Decide what agents to activate beyond the always-on baseline. */
export function planResponse(text: string): OrchestratorPlan {
  const lower = text.toLowerCase();

  return {
    tutor: true,
    research: RESEARCH_TRIGGERS.some((t) => lower.includes(t))
      || text.length > 150
      || (text.match(/\?/g) ?? []).length > 1,
    visualize: VISUAL_TRIGGERS.some((t) => lower.includes(t))
      || lower.includes('compare')
      || lower.includes('difference between'),
    illustrate: lower.includes('sketch') || lower.includes('draw me'),
    // Deep memory: explicitly reference past context or ask about mastery
    deepMemory: lower.includes('what do i know')
      || lower.includes('what have i learned')
      || lower.includes('my vocabulary')
      || lower.includes('which thinkers'),
  };
}

/** Build conversation messages from recent entries. */
function buildMessages(
  entries: LiveEntry[],
  latest: string,
  contextPrefix?: string,
): AgentMessage[] {
  const recent = entries.slice(-12);
  const messages: AgentMessage[] = [];

  for (const le of recent) {
    const e = le.entry;
    const isStudent = ['prose', 'question', 'hypothesis', 'scratch'].includes(e.type);
    const isTutor = e.type.startsWith('tutor-');

    if (isStudent && 'content' in e) {
      messages.push({ role: 'user', parts: [{ text: `[${e.type}]: ${e.content}` }] });
    } else if (isTutor && 'content' in e) {
      messages.push({ role: 'model', parts: [{ text: e.content }] });
    }
  }

  const fullText = contextPrefix ? `${contextPrefix}\n\n${latest}` : latest;
  messages.push({ role: 'user', parts: [{ text: fullText }] });
  return messages;
}

/** Parse tutor JSON response. */
function parseTutorResponse(raw: string): NotebookEntry | null {
  try {
    const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    const type = parsed.type as string;

    if (type === 'tutor-marginalia' && typeof parsed.content === 'string') {
      return { type: 'tutor-marginalia', content: parsed.content };
    }
    if (type === 'tutor-question' && typeof parsed.content === 'string') {
      return { type: 'tutor-question', content: parsed.content };
    }
    if (type === 'tutor-connection' && typeof parsed.content === 'string') {
      return {
        type: 'tutor-connection',
        content: parsed.content,
        emphasisEnd: typeof parsed.emphasisEnd === 'number' ? parsed.emphasisEnd : 0,
      };
    }
    if (type === 'thinker-card' && typeof parsed.thinker === 'object' && parsed.thinker) {
      const t = parsed.thinker as Record<string, unknown>;
      return {
        type: 'thinker-card',
        thinker: {
          name: String(t.name ?? ''), dates: String(t.dates ?? ''),
          gift: String(t.gift ?? ''), bridge: String(t.bridge ?? ''),
        },
      };
    }
    if (type === 'concept-diagram' && Array.isArray(parsed.items)) {
      return {
        type: 'concept-diagram',
        items: (parsed.items as Record<string, unknown>[]).map((item) => ({
          label: String(item.label ?? ''),
          subLabel: item.subLabel ? String(item.subLabel) : undefined,
        })),
      };
    }
    if (typeof parsed.content === 'string') {
      return { type: 'tutor-marginalia', content: parsed.content };
    }
    return null;
  } catch {
    return raw.trim() ? { type: 'tutor-marginalia', content: raw.trim() } : null;
  }
}

export interface OrchestratorResult {
  entries: NotebookEntry[];
}

/**
 * Execute the full orchestration pipeline.
 * File Search is ALWAYS consulted for context enrichment.
 */
export async function orchestrate(
  studentText: string,
  entries: LiveEntry[],
  studentId: string,
  notebookId: string,
): Promise<OrchestratorResult> {
  if (!isGeminiAvailable()) {
    return { entries: [] };
  }

  const plan = planResponse(studentText);
  const results: NotebookEntry[] = [];

  // Step 1: Always query File Search for relevant context
  let memoryContext: string | undefined;
  if (getGeminiClient()) {
    try {
      const storeName = await getOrCreateStore(studentId);

      // Query across all content in this notebook
      const search = await searchNotebook(
        storeName,
        `The student just wrote: "${studentText}"\n\nFind relevant context from their past sessions, vocabulary, thinker encounters, and mastery data that would help the tutor respond.`,
        notebookId,
        'You are retrieving context for a Socratic tutor. Return relevant facts, past discussions, vocabulary the student has learned, and thinker connections. Be concise.',
      );

      if (search.text.trim()) {
        memoryContext = `[Student's intellectual history — from File Search]:\n${search.text}`;
        if (search.citations.length > 0) {
          memoryContext += `\n[Sources: ${search.citations.join(', ')}]`;
        }
      }

      // Deep memory: also query specific content types
      if (plan.deepMemory) {
        const [masteryResult, lexiconResult] = await Promise.allSettled([
          searchByType(storeName, studentText, 'mastery', notebookId),
          searchByType(storeName, studentText, 'lexicon', notebookId),
        ]);

        const parts: string[] = [];
        if (masteryResult.status === 'fulfilled' && masteryResult.value.text) {
          parts.push(`[Mastery data]: ${masteryResult.value.text}`);
        }
        if (lexiconResult.status === 'fulfilled' && lexiconResult.value.text) {
          parts.push(`[Vocabulary data]: ${lexiconResult.value.text}`);
        }
        if (parts.length > 0) {
          memoryContext = (memoryContext ?? '') + '\n' + parts.join('\n');
        }
      }
    } catch {
      // File search failed — continue without memory
    }
  }

  // Step 2: Research for factual grounding (if needed)
  let researchContext: string | undefined;
  if (plan.research) {
    try {
      const result = await runTextAgent(RESEARCHER_AGENT, [{
        role: 'user',
        parts: [{
          text: `The student asked: "${studentText}"\n\nProvide factual grounding, historical context, and relevant thinker connections. Be specific with names, dates, and ideas.`,
        }],
      }]);
      if (result.text.trim()) {
        researchContext = `[Research — verified facts]:\n${result.text}`;
      }
    } catch {
      // Research failed — tutor responds without it
    }
  }

  // Step 3: Tutor response (always — enriched with all available context)
  const contextParts = [memoryContext, researchContext].filter(Boolean);
  const contextPrefix = contextParts.length > 0
    ? contextParts.join('\n\n')
    : undefined;

  const messages = buildMessages(entries, studentText, contextPrefix);
  try {
    const result = await runTextAgent(TUTOR_AGENT, messages);
    const entry = parseTutorResponse(result.text);
    if (entry) results.push(entry);
  } catch (err) {
    console.error('[Ember] Tutor response error:', err);
  }

  // Step 4: Visualization (if requested)
  if (plan.visualize) {
    try {
      const html = await generateHtml({
        prompt: studentText,
        context: entries.slice(-5).map((le) =>
          'content' in le.entry ? le.entry.content : '',
        ).filter(Boolean).join('\n'),
        useSearch: true,
      });
      if (html.trim()) {
        results.push({
          type: 'visualization',
          html,
          caption: `concept map: ${studentText.slice(0, 60)}`,
        });
      }
    } catch {
      // Visualization failed — not critical
    }
  }

  // Step 5: Illustration (if requested)
  if (plan.illustrate) {
    try {
      const imageResult = await runImageAgent(ILLUSTRATOR_AGENT, [{
        role: 'user',
        parts: [{
          text: `Draw a hand-sketched concept illustration for: ${studentText}. Style: warm sepia paper, fountain pen ink, minimal colour.`,
        }],
      }]);
      if (imageResult.images.length > 0) {
        const img = imageResult.images[0];
        if (img) {
          results.push({
            type: 'illustration',
            dataUrl: `data:${img.mimeType};base64,${img.data}`,
            caption: imageResult.text || undefined,
          });
        }
      }
    } catch {
      // Illustration failed — not critical
    }
  }

  return { entries: results };
}

/**
 * Index the current session for future File Search retrieval.
 */
export async function indexCurrentSession(
  studentId: string,
  notebookId: string,
  session: { number: number; date: string; topic: string },
  sessionEntries: LiveEntry[],
): Promise<void> {
  if (!getGeminiClient()) return;

  try {
    const storeName = await getOrCreateStore(studentId);
    await indexSession(storeName, notebookId, {
      ...session,
      entries: sessionEntries.map((le) => ({
        type: le.entry.type,
        content: 'content' in le.entry ? le.entry.content : undefined,
      })),
    });
  } catch (err) {
    console.error('[Ember] Session indexing error:', err);
  }
}
