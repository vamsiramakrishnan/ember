/**
 * GraphTools — barrel re-export for the graph tool system.
 *
 * The implementation is split across:
 * - graph-tool-declarations.ts  — Gemini function declaration objects
 * - graph-tool-executor.ts      — routing switch + deferred action handling
 * - graph-tool-impls.ts         — traversal, pathfinding, gaps, journey
 * - graph-tool-impls-extended.ts — attachments, bridges, linking, neighborhood
 */
export { GRAPH_TOOL_DECLARATIONS } from '@/services/graph-tool-declarations';
export {
  executeGraphTool,
  extractGraphDeferred,
  executeGraphDeferred,
  type GraphDeferredAction,
  type GraphToolContext,
} from '@/services/graph-tool-executor';
