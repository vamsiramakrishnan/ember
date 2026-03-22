/**
 * Enrichment Pipeline — generates rich content (visualizations,
 * illustrations) when the router decides they're warranted.
 * Separated from the orchestrator for single responsibility.
 */
import { ILLUSTRATOR_AGENT } from './agents';
import { runImageAgent } from './run-agent';
import { generateHtml } from './gemini-html';
import type { NotebookEntry, LiveEntry } from '@/types/entries';

/** Generate an HTML visualization for a concept. */
export async function generateVisualization(
  prompt: string,
  entries: LiveEntry[],
): Promise<NotebookEntry | null> {
  try {
    const recentContext = entries.slice(-5)
      .map((le) => 'content' in le.entry ? le.entry.content : '')
      .filter(Boolean)
      .join('\n');

    const html = await generateHtml({
      prompt,
      context: recentContext,
      useSearch: true,
    });

    if (html.trim()) {
      return {
        type: 'visualization',
        html,
        caption: `concept map: ${prompt.slice(0, 60)}`,
      };
    }
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
