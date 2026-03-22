/**
 * Orchestrator — the multi-agent brain.
 *
 * When a student writes something, the orchestrator decides:
 * 1. Should the tutor respond? (almost always yes)
 * 2. Should we search past sessions for context? (File Search)
 * 3. Should we generate a visualization? (Visualiser)
 * 4. Should we generate an illustration? (Illustrator)
 * 5. Should we do deep research? (Researcher → Tutor)
 *
 * Decision is based on entry content analysis, not a separate LLM call.
 * Fast pattern matching keeps latency low.
 */
import { TUTOR_AGENT, RESEARCHER_AGENT, ILLUSTRATOR_AGENT } from './agents';
import { runTextAgent, runImageAgent } from './run-agent';
import { generateHtml } from './gemini-html';
import { getOrCreateStore, searchNotebooks, indexSession } from './gemini-file-search';
import { isGeminiAvailable, getGeminiClient } from './gemini';
import type { NotebookEntry, LiveEntry } from '@/types/entries';
import type { AgentMessage } from './run-agent';

/** What the orchestrator decides to do. */
export interface OrchestratorPlan {
  tutor: boolean;
  research: boolean;
  visualize: boolean;
  illustrate: boolean;
  fileSearch: boolean;
}

/** Signals extracted from student input for routing decisions. */
interface ContentSignals {
  isQuestion: boolean;
  isComplex: boolean;
  requestsVisual: boolean;
  requestsDiagram: boolean;
  mentionsPastSession: boolean;
  mentionsComparison: boolean;
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

const MEMORY_TRIGGERS = [
  'last time', 'before', 'earlier', 'remember when',
  'we talked about', 'you said', 'i wrote', 'my earlier',
  'previous session', 'last session', 'went back to',
];

/** Analyse student input to determine routing. */
function analyseContent(text: string): ContentSignals {
  const lower = text.toLowerCase();
  return {
    isQuestion: text.trim().endsWith('?'),
    isComplex: text.length > 150 || (text.match(/\?/g) ?? []).length > 1,
    requestsVisual: VISUAL_TRIGGERS.some((t) => lower.includes(t)),
    requestsDiagram: lower.includes('diagram') || lower.includes('map') || lower.includes('timeline'),
    mentionsPastSession: MEMORY_TRIGGERS.some((t) => lower.includes(t)),
    mentionsComparison: lower.includes('compare') || lower.includes('difference between') || lower.includes('vs'),
  };
}

/** Decide what agents to activate. */
export function planResponse(
  text: string,
  entryCount: number,
): OrchestratorPlan {
  const signals = analyseContent(text);

  return {
    tutor: true, // Always respond
    research: signals.isComplex || RESEARCH_TRIGGERS.some((t) => text.toLowerCase().includes(t)),
    visualize: signals.requestsVisual || signals.requestsDiagram || signals.mentionsComparison,
    illustrate: text.toLowerCase().includes('sketch') || text.toLowerCase().includes('draw'),
    fileSearch: signals.mentionsPastSession && entryCount > 5,
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
 * Returns entries to add to the notebook (in order).
 */
export async function orchestrate(
  studentText: string,
  entries: LiveEntry[],
  studentId: string,
): Promise<OrchestratorResult> {
  if (!isGeminiAvailable()) {
    return { entries: [] };
  }

  const plan = planResponse(studentText, entries.length);
  const results: NotebookEntry[] = [];

  // Step 1: File Search for cross-session memory (if needed)
  let memoryContext: string | undefined;
  if (plan.fileSearch && getGeminiClient()) {
    try {
      const storeName = await getOrCreateStore(studentId);
      const search = await searchNotebooks(
        storeName,
        studentText,
        'Find relevant context from the student\'s past sessions.',
      );
      if (search.text.trim()) {
        memoryContext = `[Context from past sessions]: ${search.text}`;
      }
    } catch {
      // File search failed — continue without memory
    }
  }

  // Step 2: Research for factual grounding (if needed)
  let researchContext: string | undefined;
  if (plan.research) {
    try {
      const researchResult = await runTextAgent(RESEARCHER_AGENT, [{
        role: 'user',
        parts: [{
          text: `The student asked: "${studentText}"\n\nProvide factual grounding, historical context, and relevant thinker connections. Be specific with names, dates, and ideas.`,
        }],
      }]);
      if (researchResult.text.trim()) {
        researchContext = `[Research context]: ${researchResult.text}`;
      }
    } catch {
      // Research failed — tutor responds without it
    }
  }

  // Step 3: Tutor response (always — with enriched context)
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

  // Step 4: Visualization (parallel with tutor, if requested)
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
 * Call this when a session ends or periodically.
 */
export async function indexCurrentSession(
  studentId: string,
  session: { number: number; date: string; topic: string },
  sessionEntries: LiveEntry[],
): Promise<void> {
  if (!getGeminiClient()) return;

  try {
    const storeName = await getOrCreateStore(studentId);
    await indexSession(storeName, {
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
