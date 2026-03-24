/** DAG context builder — assembles prior-node context for dispatch. */
import type { IntentNode, IntentDAG } from './intent-dag';
import type { NodeResult } from './dag-executor';
import type { NotebookEntry } from '@/types/entries';

/** Build context string from a node's dependency results and entity refs. */
export function buildContext(
  node: IntentNode,
  dag: IntentDAG,
  priorResults: Map<string, NodeResult>,
): string {
  const parts: string[] = [];
  for (const depId of node.dependsOn) {
    const depResult = priorResults.get(depId);
    const depNode = dag.nodes.find((n) => n.id === depId);
    if (depResult?.success && depNode) {
      const depContent = depResult.entries
        .filter((e): e is NotebookEntry & { content: string } => 'content' in e)
        .map((e) => e.content).join('\n');
      if (depContent) {
        parts.push(`[Prior ${depNode.action}: ${depContent.slice(0, 500)}]`);
      }
    }
  }
  if (node.entities.length > 0) {
    const entityList = node.entities
      .map((e) => `${e.name} (${e.entityType})`).join(', ');
    parts.push(`[Referenced entities: ${entityList}]`);
  }
  return parts.join('\n');
}
