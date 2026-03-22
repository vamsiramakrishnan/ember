/**
 * useSketchAnalysis — analyses student sketches using the Reader agent.
 * When a student submits a sketch, the Reader extracts meaning
 * and the Tutor responds to the intellectual content.
 */
import { useCallback, useState } from 'react';
import { isGeminiAvailable } from '@/services/gemini';
import { READER_AGENT } from '@/services/agents';
import { runTextAgent } from '@/services/run-agent';
import type { NotebookEntry } from '@/types/entries';

function parseReaderResponse(raw: string): NotebookEntry | null {
  try {
    const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    if (typeof parsed.content === 'string') {
      const type = parsed.type === 'tutor-question' ? 'tutor-question' : 'tutor-marginalia';
      return { type, content: parsed.content };
    }
    return null;
  } catch {
    if (raw.trim().length > 0) {
      return { type: 'tutor-marginalia', content: raw.trim() };
    }
    return null;
  }
}

export function useSketchAnalysis(
  addEntry: (entry: NotebookEntry) => void,
) {
  const [analysing, setAnalysing] = useState(false);

  const analyseSketch = useCallback(async (dataUrl: string) => {
    if (!isGeminiAvailable()) return;

    const [header, data] = dataUrl.split(',');
    if (!header || !data) return;

    const mimeMatch = header.match(/data:([^;]+)/);
    const mimeType = mimeMatch?.[1] ?? 'image/png';

    setAnalysing(true);
    try {
      const result = await runTextAgent(READER_AGENT, [{
        role: 'user',
        parts: [
          { inlineData: { mimeType, data } },
          { text: 'The student drew this sketch during our session. What are they thinking about? Respond with a JSON object.' },
        ],
      }]);

      const entry = parseReaderResponse(result.text);
      if (entry) addEntry(entry);
    } catch (err) {
      console.error('[Ember] Sketch analysis error:', err);
    } finally {
      setAnalysing(false);
    }
  }, [addEntry]);

  return { analyseSketch, analysing };
}
