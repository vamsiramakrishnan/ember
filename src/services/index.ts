/**
 * Services — Gemini AI integration for Ember.
 * Five specialised agents, each with tailored context, tools, and models.
 */

// Core client
export {
  getGeminiClient,
  isGeminiAvailable,
  generateText,
  generateTextWithHistory,
  MODELS,
} from './gemini';
export type { GeminiTextOptions } from './gemini';

// Agent configs
export {
  AGENTS,
  TUTOR_AGENT,
  RESEARCHER_AGENT,
  VISUALISER_AGENT,
  ILLUSTRATOR_AGENT,
  READER_AGENT,
} from './agents';
export type { AgentConfig, AgentName } from './agents';

// Agent execution
export { runTextAgent, runImageAgent, askAgent } from './run-agent';
export type { AgentMessage, AgentContentPart } from './run-agent';

// Image generation
export { generateImage } from './gemini-image';
export type {
  GeneratedImage,
  ImageGenerationResult,
  ImageGenerationOptions,
} from './gemini-image';

// HTML generation
export { generateHtml, HTML_MODEL } from './gemini-html';
export type { HtmlGenerationOptions } from './gemini-html';

// Multimodal analysis
export { analyseImage, extractTextFromImage } from './gemini-multimodal';
export type { MultimodalAnalysisOptions } from './gemini-multimodal';


// Mastery extraction
export { extractMasterySignals } from './mastery-extractor';
export type { MasterySignal } from './mastery-extractor';

// File Search (managed RAG)
export {
  getOrCreateStore,
  indexSession,
  searchAll,
  searchNotebook,
  searchByType,
  uploadRawFile,
} from './file-search';

// Proxy client (for production Vercel deployment)
export {
  useProxy,
  proxyTextGeneration,
  proxyImageGeneration,
  proxyHtmlGeneration,
  proxyMultimodalAnalysis,
} from './proxy-client';
