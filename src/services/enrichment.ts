/**
 * Enrichment Pipeline — generates rich content (visualizations,
 * illustrations) when the router decides they're warranted.
 *
 * Visualizations now go through an iterative critique→refine loop
 * using the artifact-refiner, which verifies factual accuracy via
 * Google Search and applies targeted SEARCH/REPLACE patches.
 *
 * Separated from the orchestrator for single responsibility.
 */
import { ILLUSTRATOR_AGENT } from './agents';
import { runImageAgent } from './run-agent';
import { generateHtml } from './gemini-html';
import { EMBER_VIZ_KIT } from './viz-components';
import { refineArtifact } from './artifact-refiner';
import type { NotebookEntry, LiveEntry } from '@/types/entries';

/** Generate an HTML visualization for a concept, with iterative refinement. */
export async function generateVisualization(
  prompt: string,
  entries: LiveEntry[],
): Promise<NotebookEntry | null> {
  try {
    const recentContext = entries.slice(-5)
      .map((le) => 'content' in le.entry ? le.entry.content : '')
      .filter(Boolean)
      .join('\n');

    const rawHtml = await generateHtml({
      prompt,
      context: recentContext,
      useSearch: true,
    });

    if (!rawHtml.trim()) return null;

    // Run critique→refine loop for factual accuracy
    const refined = await refineArtifact(rawHtml, prompt, recentContext);

    const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${EMBER_VIZ_KIT}</head><body>${refined.html}</body></html>`;
    return {
      type: 'visualization',
      html: fullHtml,
      caption: `concept map: ${prompt.slice(0, 60)}`,
    };
  } catch {
    // Visualization failed — not critical
  }
  return null;
}

/** Generate a hand-drawn illustration for a concept. */
export async function generateIllustration(
  prompt: string,
): Promise<NotebookEntry | null> {
  try {
    const result = await runImageAgent(ILLUSTRATOR_AGENT, [{
      role: 'user',
      parts: [{
        text: `Draw a hand-sketched concept illustration for: ${prompt}. Style: warm sepia paper, fountain pen ink, minimal colour.`,
      }],
    }]);

    if (result.images.length > 0) {
      const img = result.images[0];
      if (img) {
        return {
          type: 'illustration',
          dataUrl: `data:${img.mimeType};base64,${img.data}`,
          caption: result.text || undefined,
        };
      }
    }
  } catch {
    // Illustration failed — not critical
  }
  return null;
}
