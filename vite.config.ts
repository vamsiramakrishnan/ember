import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'markdown': ['react-markdown', 'remark-gfm', 'remark-math', 'rehype-katex', 'katex'],
          'ai': ['@google/genai'],
          'export': ['docx', 'pptxgenjs', 'file-saver'],
          'crdt': ['yjs', 'y-indexeddb'],
          'observability': ['@sentry/react', '@vercel/analytics'],
        },
      },
    },
    target: 'es2020',
    sourcemap: true,
  },
});
