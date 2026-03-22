/**
 * Orchestrator — the multi-agent brain, v2.
 *
 * Pipeline:
 * 1. Router Agent classifies the entry (flash-lite, ~100ms)
 * 2. Context Assembler builds a layered context window
 * 3. File Search retrieves relevant history (always-on)
 * 4. Researcher grounds facts (if router says so)
 * 5. Tutor responds with full context (always)
 * 6. Visualiser / Illustrator produce rich content (if router says so)
 *
 * Key changes from v1:
 * - Router Agent replaces keyword pattern matching
 * - Context Assembler provides structured, layered context
 * - File Search is always-on with targeted type queries
 * - Debounce and cooldown prevent over-triggering expensive agents
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
import { classifyImmediate } from './router-agent';
import {
  assembleContext,
  type StudentProfile,
  type NotebookContext,
  type SemanticMemory,
  type ResearchContext,
} from './context-assembler';
import { isGeminiAvailable, getGeminiClient } from './gemini';
import type { NotebookEntry, LiveEntry } from '@/types/entries';

export interface OrchestratorResult {
  entries: NotebookEntry[];
}

/**
 * Execute the full orchestration pipeline.
 * Router Agent classifies → Context assembled → Agents invoked.
 */
export async function orchestrate(
  studentText: string,
  entries: LiveEntry[],
  studentId: string,
  notebookId: string,
  profile?: StudentProfile | null,
  notebookCtx?: NotebookContext | null,
): Promise<OrchestratorResult> {
  if (!isGeminiAvailable()) {
    return { entries: [] };
  }

  // Step 1: Router Agent classifies the entry
  const routing = await classifyImmediate(studentText, entries);

  const results: NotebookEntry[] = [];

  // Step 2: File Search — always-on context retrieval
  let memory: SemanticMemory | null = null;
  if (getGeminiClient()) {
    try {
      const storeName = await getOrCreateStore(studentId);

      // Always: search this notebook for relevant context
      const mainSearch = await searchNotebook(
        storeName,
        buildSearchQuery(studentText, routing),
        notebookId,
        'You are retrieving context for a Socratic tutor. Return relevant past discussions, vocabulary, thinker connections, and mastery data. Be concise — only include what is directly relevant.',
      );

      memory = {
        relevantHistory: mainSearch.text.trim() || null,
        relevantVocabulary: null,
        relevantThinkers: null,
        citations: mainSearch.citations,
      };

      // Deep memory: targeted type queries
      if (routing.deepMemory) {
        const [masteryResult, lexiconResult, encounterResult] = await Promise.allSettled([
          searchByType(storeName, studentText, 'mastery', notebookId),
          searchByType(storeName, studentText, 'lexicon', notebookId),
          searchByType(storeName, studentText, 'encounter', notebookId),
        ]);

        if (masteryResult.status === 'fulfilled' && masteryResult.value.text) {
          memory.relevantHistory = (memory.relevantHistory ?? '') +
            `\n\n[Mastery data]: ${masteryResult.value.text}`;
        }
        if (lexiconResult.status === 'fulfilled' && lexiconResult.value.text) {
          memory.relevantVocabulary = lexiconResult.value.text;
        }
        if (encounterResult.status === 'fulfilled' && encounterResult.value.text) {
          memory.relevantThinkers = encounterResult.value.text;
        }
      }
    } catch {
      // File search failed — continue without memory
    }
  }

  // Step 3: Researcher (if router says so)
  let research: ResearchContext | null = null;
  if (routing.research) {
    try {
      const result = await runTextAgent(RESEARCHER_AGENT, [{
        role: 'user',
        parts: [{
          text: `The student asked: "${studentText}"\n\nProvide factual grounding, historical context, and relevant thinker connections. Be specific with names, dates, and ideas. Concise — max 200 words.`,
        }],
      }]);
      if (result.text.trim()) {
        research = { facts: result.text };
      }
    } catch {
      // Research failed — tutor responds without it
    }
  }

  // Step 4: Assemble context and call tutor
  const ctx = assembleContext({
    studentText,
    entries,
    profile: profile ?? null,
    notebook: notebookCtx ?? null,
    memory,
    research,
  });

  try {
    const result = await runTextAgent(TUTOR_AGENT, ctx.messages);
    const entry = parseTutorResponse(result.text);
    if (entry) results.push(entry);
  } catch (err) {
    console.error('[Ember] Tutor response error:', err);
  }

  // Step 5: Visualization (if router says so)
  if (routing.visualize) {
    try {
      const recentContext = entries.slice(-5).map((le) =>
        'content' in le.entry ? le.entry.content : '',
      ).filter(Boolean).join('\n');

      const html = await generateHtml({
        prompt: studentText,
        context: recentContext,
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

  // Step 6: Illustration (if router says so)
  if (routing.illustrate) {
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
 * Build a smarter search query based on what the router decided.
 * Instead of just forwarding the student's text, we compose a
 * query that tells File Search what to look for.
 */
function buildSearchQuery(
  studentText: string,
  routing: { research: boolean; deepMemory: boolean },
): string {
  const parts = [`Student wrote: "${studentText}"`];

  if (routing.research) {
    parts.push('Find past discussions of this topic, relevant vocabulary, and thinker connections.');
  }
  if (routing.deepMemory) {
    parts.push('Include mastery data, vocabulary progress, and curiosity threads.');
  }

  parts.push('Return only directly relevant context.');
  return parts.join(' ');
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

/** Index the current session for future File Search retrieval. */
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
