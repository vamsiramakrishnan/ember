/**
 * Notebook Enrichment — async AI tasks that improve notebook metadata.
 *
 * 1. Icon generation: Creates a 64x64 notebook-specific icon using
 *    Gemini's image model. Warm, minimal, ink-on-paper aesthetic.
 *
 * 2. Metadata tagging: Classifies notebook by discipline, generates
 *    tags, and writes a one-line summary after the first few entries.
 *
 * Both run asynchronously — the notebook is usable before they complete.
 */
import { generateImage } from './gemini-image';
import { generateText, isGeminiAvailable } from './gemini';
import { updateNotebook } from '@/persistence/repositories/notebooks';
import { Store, notify } from '@/persistence';
import { EMBER_DESIGN_CONTEXT } from './agents/config';
import { colors } from '@/tokens/colors';

/**
 * Generate a notebook icon — a tiny, warm, typographic symbol
 * that represents the notebook's topic. Like a bookplate.
 */
export async function generateNotebookIcon(
  notebookId: string,
  title: string,
  description: string,
): Promise<string | null> {
  if (!isGeminiAvailable()) return null;

  try {
    const result = await generateImage({
      prompt: `${EMBER_DESIGN_CONTEXT}

Generate a tiny 64x64 pixel icon for a notebook titled "${title}".
${description ? `The guiding question is: "${description}"` : ''}

Style requirements:
- Monochrome ink on warm parchment background (${colors.paper})
- Ink color: ${colors.ink} at 60% opacity
- Single simple symbol or glyph — NOT text, NOT letters
- Think: a mathematical curve, a leaf, a constellation dot pattern, a wave
- Minimal, elegant, like a watermark or bookplate stamp
- No borders, no frames, no decorative elements
- The symbol should evoke the subject matter abstractly`,
      aspectRatio: '1:1',
      imageSize: '256',
    });

    if (result.images.length > 0 && result.images[0]) {
      const img = result.images[0];
      const dataUrl = `data:${img.mimeType};base64,${img.data}`;

      await updateNotebook(notebookId, { iconDataUrl: dataUrl });
      notify(Store.Notebooks);
      return dataUrl;
    }
    return null;
  } catch (err) {
    console.error('[Ember] Icon generation failed:', err);
    return null;
  }
}

interface MetadataResult {
  tags: string[];
  discipline: string;
  summary: string;
}

/**
 * Analyse notebook content and generate metadata tags.
 * Called after the first few entries to classify the notebook.
 */
export async function enrichNotebookMetadata(
  notebookId: string,
  title: string,
  description: string,
  recentEntries: string[],
): Promise<MetadataResult | null> {
  if (!isGeminiAvailable()) return null;

  try {
    const entriesText = recentEntries.slice(0, 10).join('\n---\n');

    const response = await generateText({
      prompt: `Notebook: "${title}"
Guiding question: "${description}"

Recent entries:
${entriesText}

Analyse this notebook and respond with ONLY a JSON object:
{
  "tags": ["tag1", "tag2", "tag3"],
  "discipline": "primary field (e.g. mathematics, philosophy, biology)",
  "summary": "One sentence describing what this exploration is about so far."
}

Tags should be 2-5 specific topic tags (not generic like "learning").
The discipline should be the primary academic field.
The summary should be warm and specific, not generic.`,
      systemInstruction: 'You are a librarian cataloguing a student\'s intellectual explorations. Be precise and specific in your classifications.',
    });

    const parsed = parseMetadata(response);
    if (!parsed) return null;

    await updateNotebook(notebookId, {
      tags: parsed.tags,
      discipline: parsed.discipline,
      summary: parsed.summary,
    });
    notify(Store.Notebooks);

    return parsed;
  } catch (err) {
    console.error('[Ember] Metadata enrichment failed:', err);
    return null;
  }
}

function parseMetadata(text: string): MetadataResult | null {
  try {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/) ??
                  text.match(/(\{[\s\S]*\})/);
    if (!match?.[1]) return null;
    const data = JSON.parse(match[1]) as Record<string, unknown>;
    return {
      tags: Array.isArray(data.tags) ? data.tags.filter((t): t is string => typeof t === 'string') : [],
      discipline: typeof data.discipline === 'string' ? data.discipline : '',
      summary: typeof data.summary === 'string' ? data.summary : '',
    };
  } catch {
    return null;
  }
}
