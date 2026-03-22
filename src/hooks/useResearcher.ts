/**
 * useResearcher — deep factual grounding via the Researcher agent.
 * Used when the tutor needs verified facts, historical context,
 * or cross-disciplinary bridges grounded in real scholarship.
 */
import { useCallback, useState } from 'react';
import { isGeminiAvailable } from '@/services/gemini';
import { RESEARCHER_AGENT } from '@/services/agents';
import { runTextAgent } from '@/services/run-agent';

export interface ResearchResult {
  text: string;
  timestamp: number;
}

export function useResearcher() {
  const [researching, setResearching] = useState(false);
  const [lastResult, setLastResult] = useState<ResearchResult | null>(null);

  const research = useCallback(async (
    query: string,
    context?: string,
  ): Promise<string | null> => {
    if (!isGeminiAvailable()) return null;

    setResearching(true);
    try {
      const prompt = context
        ? `Student's current exploration: ${context}\n\nResearch query: ${query}`
        : query;

      const result = await runTextAgent(RESEARCHER_AGENT, [{
        role: 'user',
        parts: [{ text: prompt }],
      }]);

      const research: ResearchResult = {
        text: result.text,
        timestamp: Date.now(),
      };
      setLastResult(research);
      return result.text;
    } catch (err) {
      console.error('[Ember] Researcher error:', err);
      return null;
    } finally {
      setResearching(false);
    }
  }, []);

  return { research, researching, lastResult };
}
