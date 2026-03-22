/**
 * useGeminiTutor — AI-powered tutor responses using Gemini agents.
 * Uses the TUTOR_AGENT config for Socratic dialogue and can
 * delegate to RESEARCHER_AGENT for deep factual grounding.
 * Falls back gracefully when no API key is configured.
 */
import { useCallback, useRef, useState } from 'react';
import { isGeminiAvailable } from '@/services/gemini';
import { TUTOR_AGENT } from '@/services/agents';
import { runTextAgent } from '@/services/run-agent';
import type { NotebookEntry, LiveEntry } from '@/types/entries';

/** Build conversation history from recent notebook entries. */
function buildConversation(
  entries: LiveEntry[],
  latestContent: string,
): Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> {
  const recent = entries.slice(-12);
  const messages: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  for (const le of recent) {
    const e = le.entry;
    const isStudent = ['prose', 'question', 'hypothesis', 'scratch'].includes(e.type);
    const isTutor = e.type.startsWith('tutor-');

    if (isStudent && 'content' in e) {
      messages.push({
        role: 'user',
        parts: [{ text: `[${e.type}]: ${e.content}` }],
      });
    } else if (isTutor && 'content' in e) {
      messages.push({
        role: 'model',
        parts: [{ text: e.content }],
      });
    }
  }

  // Add the latest student entry
  messages.push({
    role: 'user',
    parts: [{ text: latestContent }],
  });

  return messages;
}

/** Parse the tutor's JSON response into a NotebookEntry. */
function parseTutorResponse(raw: string): NotebookEntry | null {
  try {
    const cleaned = raw
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();
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
        emphasisEnd:
          typeof parsed.emphasisEnd === 'number' ? parsed.emphasisEnd : 0,
      };
    }
    if (type === 'thinker-card' && typeof parsed.thinker === 'object' && parsed.thinker) {
      const t = parsed.thinker as Record<string, unknown>;
      return {
        type: 'thinker-card',
        thinker: {
          name: String(t.name ?? ''),
          dates: String(t.dates ?? ''),
          gift: String(t.gift ?? ''),
          bridge: String(t.bridge ?? ''),
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
    if (raw.trim().length > 0) {
      return { type: 'tutor-marginalia', content: raw.trim() };
    }
    return null;
  }
}

interface UseGeminiTutorOptions {
  addEntry: (entry: NotebookEntry) => void;
  entries: LiveEntry[];
}

export function useGeminiTutor({ addEntry, entries }: UseGeminiTutorOptions) {
  const [isThinking, setIsThinking] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const respond = useCallback(
    async (studentEntry: NotebookEntry) => {
      if (!isGeminiAvailable()) return;
      if (!('content' in studentEntry)) return;

      const silence: NotebookEntry = { type: 'silence' };
      addEntry(silence);
      setIsThinking(true);

      try {
        abortRef.current = new AbortController();
        const messages = buildConversation(entries, studentEntry.content);

        const result = await runTextAgent(TUTOR_AGENT, messages);
        const entry = parseTutorResponse(result.text);
        if (entry) {
          addEntry(entry);
        }
      } catch (err) {
        console.error('[Ember] Gemini tutor error:', err);
      } finally {
        setIsThinking(false);
        abortRef.current = null;
      }
    },
    [addEntry, entries],
  );

  return { respond, isThinking };
}
