/**
 * useContentDrop — handles drag-drop, paste, and file upload.
 * Processes dropped/pasted content into notebook entries:
 *
 * - Images (png, jpg, gif, webp) → image entry + Reader agent analysis
 * - PDFs / documents → document entry + raw upload to File Search
 * - Code files → code-cell entry
 * - URLs (pasted text) → embed entry
 * - Other files → file-upload entry
 *
 * All files are stored via the blob repository (content-addressed).
 * Documents uploaded directly to File Search — Gemini handles
 * PDF chunking and embedding natively. No text extraction needed.
 *
 * Fixes:
 * - Supports multiple concurrent file uploads (removed single-file guard)
 * - Uses a Set to track in-flight uploads for dedup
 * - Aborts background uploads on unmount
 */
import { useCallback, useRef, useEffect } from 'react';
import { storeBlob } from '@/persistence/repositories/blobs';
import { isGeminiAvailable } from '@/services/gemini';
import { getOrCreateStore, uploadRawFile } from '@/services/file-search';
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
  const activeUploads = useRef(new Set<string>());
  const abortRef = useRef<AbortController>(new AbortController());

  // Abort background tasks on unmount
  useEffect(() => {
    const controller = abortRef.current;
    return () => {
      controller.abort();
    };
  }, []);

  const processFile = useCallback(async (file: File): Promise<void> => {
    // Dedup by file name + size
    const fileKey = `${file.name}:${file.size}`;
    if (activeUploads.current.has(fileKey)) return;
    activeUploads.current.add(fileKey);

    try {
      const blob = new Blob([await file.arrayBuffer()], { type: file.type });
      const hash = await storeBlob(blob, file.name);

      const attachment: FileAttachment = {
        name: file.name,
        mimeType: file.type,
        size: file.size,
        blobHash: hash,
      };

      if (IMAGE_TYPES.includes(file.type)) {
        const dataUrl = await blobToDataUrl(blob);
        addEntry({ type: 'image', dataUrl, alt: file.name });
        if (isGeminiAvailable() && !abortRef.current.signal.aborted) {
          void analyseImage(dataUrl, file.type, addEntry);
        }
        if (student && notebook && !abortRef.current.signal.aborted) {
          void rawUpload(blob, file.name, student.id, notebook.id);
        }
        return;
      }

      if (DOC_TYPES.includes(file.type)) {
        addEntry({ type: 'document', file: attachment });
        if (student && notebook && !abortRef.current.signal.aborted) {
          void rawUpload(blob, file.name, student.id, notebook.id);
        }
        return;
      }

      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      if (CODE_EXTENSIONS[ext]) {
        const text = await file.text();
        addEntry({ type: 'code-cell', language: CODE_EXTENSIONS[ext] ?? 'text', source: text });
        if (student && notebook && !abortRef.current.signal.aborted) {
          void rawUpload(blob, file.name, student.id, notebook.id);
        }
        return;
      }

      if (file.type.startsWith('text/') || file.type === 'application/json') {
        const text = await file.text();
        if (ext === 'md') {
          addEntry({ type: 'prose', content: text });
        } else {
          addEntry({ type: 'code-cell', language: ext || 'text', source: text });
        }
        if (student && notebook && !abortRef.current.signal.aborted) {
          void rawUpload(blob, file.name, student.id, notebook.id);
        }
        return;
      }

      addEntry({ type: 'file-upload', file: attachment });
    } finally {
      activeUploads.current.delete(fileKey);
    }
  }, [addEntry, student, notebook]);

  const processPastedText = useCallback((text: string): boolean => {
    const trimmed = text.trim();
    if (URL_PATTERN.test(trimmed)) {
      addEntry({ type: 'embed', url: trimmed });
      return true;
    }
    return false;
  }, [addEntry]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      for (const file of files) void processFile(file);
      return;
    }
    const text = e.dataTransfer.getData('text/plain');
    if (text) processPastedText(text);
  }, [processFile, processPastedText]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent): boolean => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find((item) => item.type.startsWith('image/'));
    if (imageItem) {
      const file = imageItem.getAsFile();
      if (file) {
        e.preventDefault();
        void processFile(file);
        return true;
      }
    }
    const files = Array.from(e.clipboardData.files);
    if (files.length > 0) {
      e.preventDefault();
      for (const file of files) void processFile(file);
      return true;
    }
    return false;
  }, [processFile]);

  return { processFile, processPastedText, handleDrop, handleDragOver, handlePaste };
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

/** Upload raw file directly to File Search. */
async function rawUpload(
  blob: Blob, name: string, studentId: string, notebookId: string,
): Promise<void> {
  try {
    const store = await getOrCreateStore(studentId);
    await uploadRawFile(store, blob, name, notebookId);
  } catch (err) {
    console.error('[Ember] File Search upload error:', err);
  }
}

/** Analyse uploaded image with Reader agent. */
async function analyseImage(
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
