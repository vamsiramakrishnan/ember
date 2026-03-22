/**
 * useContentDrop — handles drag-drop, paste, and file upload.
 * Processes dropped/pasted content into notebook entries:
 *
 * - Images (png, jpg, gif, webp) → image entry + Reader agent analysis
 * - PDFs / documents → document entry + text extraction + File Search indexing
 * - Code files → code-cell entry
 * - URLs (pasted text) → embed entry with metadata fetch
 * - Other files → file-upload entry + AI summary
 *
 * All files are stored via the blob repository (content-addressed).
 * Documents are indexed into File Search for the tutor to reference.
 */
import { useCallback, useRef } from 'react';
import { storeBlob } from '@/persistence/repositories/blobs';
import { isGeminiAvailable } from '@/services/gemini';
import { extractTextFromImage } from '@/services/gemini-multimodal';
import { getOrCreateStore, indexSession } from '@/services/gemini-file-search';
import { useStudent } from '@/contexts/StudentContext';
import type { NotebookEntry, FileAttachment } from '@/types/entries';

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

const DOC_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

const CODE_EXTENSIONS: Record<string, string> = {
  js: 'javascript', ts: 'typescript', py: 'python', rb: 'ruby',
  rs: 'rust', go: 'go', java: 'java', cpp: 'cpp', c: 'c',
  html: 'html', css: 'css', json: 'json', md: 'markdown',
  sql: 'sql', sh: 'bash', yaml: 'yaml', xml: 'xml',
};

const URL_PATTERN = /^https?:\/\/[^\s]+$/;

interface UseContentDropOptions {
  addEntry: (entry: NotebookEntry) => void;
}

export function useContentDrop({ addEntry }: UseContentDropOptions) {
  const { student, notebook } = useStudent();
  const processingRef = useRef(false);

  /** Process a single file into a notebook entry. */
  const processFile = useCallback(async (file: File): Promise<void> => {
    if (processingRef.current) return;
    processingRef.current = true;

    try {
      const blob = new Blob([await file.arrayBuffer()], { type: file.type });
      const hash = await storeBlob(blob, file.name);

      const attachment: FileAttachment = {
        name: file.name,
        mimeType: file.type,
        size: file.size,
        blobHash: hash,
      };

      // Image → image entry
      if (IMAGE_TYPES.includes(file.type)) {
        const dataUrl = await blobToDataUrl(blob);
        addEntry({ type: 'image', dataUrl, alt: file.name });

        // Analyse with Reader agent if available
        if (isGeminiAvailable()) {
          analyseUploadedImage(dataUrl, file.type, addEntry);
        }
        return;
      }

      // Document (PDF, DOCX) → document entry
      if (DOC_TYPES.includes(file.type)) {
        let extractedText: string | undefined;

        // Try text extraction via multimodal
        if (isGeminiAvailable() && file.type === 'application/pdf') {
          try {
            const base64 = await blobToBase64(blob);
            extractedText = await extractTextFromImage(base64, file.type);
          } catch {
            // Extraction failed — show file without extract
          }
        }

        addEntry({
          type: 'document',
          file: attachment,
          extractedText,
        });

        // Index document content into File Search
        if (extractedText && student && notebook) {
          indexDocumentContent(student.id, notebook.id, file.name, extractedText);
        }
        return;
      }

      // Code file → code-cell
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      if (CODE_EXTENSIONS[ext]) {
        const text = await file.text();
        addEntry({
          type: 'code-cell',
          language: CODE_EXTENSIONS[ext] ?? 'text',
          source: text,
        });
        return;
      }

      // Text files → prose entry
      if (file.type.startsWith('text/') || file.type === 'application/json') {
        const text = await file.text();
        if (ext === 'md') {
          addEntry({ type: 'prose', content: text });
        } else {
          addEntry({
            type: 'code-cell',
            language: ext || 'text',
            source: text,
          });
        }
        return;
      }

      // Everything else → generic file upload
      addEntry({ type: 'file-upload', file: attachment });
    } finally {
      processingRef.current = false;
    }
  }, [addEntry, student, notebook]);

  /** Process pasted text — detect URLs and create embed entries. */
  const processPastedText = useCallback((text: string): boolean => {
    const trimmed = text.trim();
    if (URL_PATTERN.test(trimmed)) {
      addEntry({
        type: 'embed',
        url: trimmed,
        title: undefined,
        description: undefined,
      });
      return true; // Handled
    }
    return false; // Let InputZone handle as normal text
  }, [addEntry]);

  /** Handle drag-drop events. */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      for (const file of files) {
        void processFile(file);
      }
      return;
    }

    // Check for dropped text (URL)
    const text = e.dataTransfer.getData('text/plain');
    if (text) {
      processPastedText(text);
    }
  }, [processFile, processPastedText]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  /** Handle clipboard paste (images). */
  const handlePaste = useCallback((e: React.ClipboardEvent): boolean => {
    const items = Array.from(e.clipboardData.items);

    // Check for pasted images
    const imageItem = items.find((item) => item.type.startsWith('image/'));
    if (imageItem) {
      const file = imageItem.getAsFile();
      if (file) {
        e.preventDefault();
        void processFile(file);
        return true;
      }
    }

    // Check for pasted files
    const files = Array.from(e.clipboardData.files);
    if (files.length > 0) {
      e.preventDefault();
      for (const file of files) {
        void processFile(file);
      }
      return true;
    }

    return false; // Not handled — let default paste occur
  }, [processFile]);

  return {
    processFile,
    processPastedText,
    handleDrop,
    handleDragOver,
    handlePaste,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** Fire-and-forget: analyse an uploaded image with the Reader agent. */
function analyseUploadedImage(
  dataUrl: string,
  mimeType: string,
  addEntry: (entry: NotebookEntry) => void,
): void {
  import('@/services/run-agent').then(async ({ runTextAgent }) => {
    const { READER_AGENT } = await import('@/services/agents');
    const base64 = dataUrl.split(',')[1] ?? '';

    try {
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
          addEntry({
            type: parsed.type === 'tutor-question' ? 'tutor-question' : 'tutor-marginalia',
            content: parsed.content,
          } as NotebookEntry);
        }
      } catch {
        if (result.text.trim()) {
          addEntry({ type: 'tutor-marginalia', content: result.text.trim() });
        }
      }
    } catch (err) {
      console.error('[Ember] Image analysis error:', err);
    }
  });
}

/** Fire-and-forget: index document content into File Search. */
function indexDocumentContent(
  studentId: string,
  notebookId: string,
  fileName: string,
  text: string,
): void {
  getOrCreateStore(studentId).then((storeName) => {
    indexSession(storeName, notebookId, {
      number: 0,
      date: new Date().toLocaleDateString(),
      topic: `Uploaded document: ${fileName}`,
      entries: [{ type: 'document', content: text }],
    });
  }).catch((err) => {
    console.error('[Ember] Document indexing error:', err);
  });
}
