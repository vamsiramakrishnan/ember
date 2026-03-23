/**
 * content-drop-helpers — constants and async helpers for file processing
 * in the content drop/paste/upload flow.
 *
 * Extracted from useContentDrop to enforce the 150-line file limit.
 */
import { getOrCreateStore, uploadRawFile } from '@/services/file-search';
import type { NotebookEntry } from '@/types/entries';

/** MIME types recognised as images. */
export const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

/** MIME types recognised as documents (PDF, DOCX, PPTX). */
export const DOC_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

/** Map of file extensions to language identifiers for code cells. */
export const CODE_EXTENSIONS: Record<string, string> = {
  js: 'javascript', ts: 'typescript', py: 'python', rb: 'ruby',
  rs: 'rust', go: 'go', java: 'java', cpp: 'cpp', c: 'c',
  html: 'html', css: 'css', json: 'json', md: 'markdown',
  sql: 'sql', sh: 'bash', yaml: 'yaml', xml: 'xml',
};

/** Pattern matching HTTP(S) URLs. */
export const URL_PATTERN = /^https?:\/\/[^\s]+$/;

/** Convert a Blob to a data URL string. */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** Upload raw file to File Search with rich metadata for discovery. */
export async function rawUpload(
  blob: Blob, name: string, studentId: string, notebookId: string,
): Promise<void> {
  try {
    const store = await getOrCreateStore(studentId);
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    const mime = blob.type || 'application/octet-stream';

    const isImage = mime.startsWith('image/');
    const isPdf = mime === 'application/pdf';
    const isCode = ['py', 'js', 'ts', 'java', 'cpp', 'c', 'rs', 'go', 'rb'].includes(ext);
    const isData = ['csv', 'json', 'xml', 'tsv'].includes(ext);
    const category = isImage ? 'image' : isPdf ? 'document' : isCode ? 'code' : isData ? 'data' : 'file';

    await uploadRawFile(store, blob, name, notebookId, [
      { key: 'fileName', string_value: name },
      { key: 'mimeType', string_value: mime },
      { key: 'fileSize', numeric_value: blob.size },
      { key: 'category', string_value: category },
      { key: 'extension', string_value: ext },
    ]);
  } catch (err) {
    console.error('[Ember] File Search upload error:', err);
  }
}

/** Analyse uploaded image with Reader agent. */
export async function analyseImage(
  dataUrl: string, mimeType: string, addEntry: (e: NotebookEntry) => void,
): Promise<void> {
  try {
    const { runTextAgent } = await import('@/services/run-agent');
    const { READER_AGENT } = await import('@/services/agents');
    const base64 = dataUrl.split(',')[1] ?? '';

    const result = await runTextAgent(READER_AGENT, [{
      role: 'user',
      parts: [
        { inlineData: { mimeType, data: base64 } },
        { text: 'The student uploaded this image. What does it show? How does it connect to what they are learning?' },
      ],
    }]);

    const cleaned = result.text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    try {
      const parsed = JSON.parse(cleaned) as Record<string, unknown>;
      if (typeof parsed.content === 'string') {
        const type = parsed.type === 'tutor-question' ? 'tutor-question' : 'tutor-marginalia';
        addEntry({ type, content: parsed.content } as NotebookEntry);
      }
    } catch {
      if (result.text.trim()) {
        addEntry({ type: 'tutor-marginalia', content: result.text.trim() });
      }
    }
  } catch (err) {
    console.error('[Ember] Image analysis error:', err);
  }
}
