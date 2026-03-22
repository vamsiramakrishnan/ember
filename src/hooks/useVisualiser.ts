/**
 * useVisualiser — generates HTML concept diagrams using the Visualiser agent.
 * Called when the tutor decides a concept needs spatial/visual representation.
 * Returns HTML that can be rendered in a sandboxed iframe.
 */
import { useCallback, useState } from 'react';
import { isGeminiAvailable } from '@/services/gemini';
import { VISUALISER_AGENT } from '@/services/agents';
import { runTextAgent } from '@/services/run-agent';

export function useVisualiser() {
  const [generating, setGenerating] = useState(false);
  const [html, setHtml] = useState<string | null>(null);

  const generateVisual = useCallback(async (
    concept: string,
    context?: string,
  ) => {
    if (!isGeminiAvailable()) return null;

    setGenerating(true);
    try {
      const prompt = context
        ? `Student context: ${context}\n\nConcept to visualise: ${concept}`
        : `Concept to visualise: ${concept}`;

      const result = await runTextAgent(VISUALISER_AGENT, [{
        role: 'user',
        parts: [{ text: prompt }],
      }]);

      let generated = result.text;
      generated = generated
        .replace(/^```html\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();

      setHtml(generated);
      return generated;
    } catch (err) {
      console.error('[Ember] Visualiser error:', err);
      return null;
    } finally {
      setGenerating(false);
    }
  }, []);

  const clearVisual = useCallback(() => setHtml(null), []);

  return { generateVisual, clearVisual, html, generating };
}
