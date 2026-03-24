/**
 * State — the shared collaboration substrate.
 *
 * Four mechanisms that enforce the design principles at the architectural level:
 *
 * 1. SessionState: Shared reactive state between tutor and learner.
 *    The tutor knows what phase the session is in, what the student is
 *    focused on, and what concepts are in play.
 *
 * 2. CompositionGuard: Enforces the compositional grammar. No three
 *    consecutive tutor entries. Echoes spaced. Reflections paced.
 *    The guard is consulted before any tutor entry is emitted.
 *
 * 3. EntryGraph: Relationships between entries. Follow-up chains,
 *    cross-references, branching provenance. Enables deep linking
 *    and the tutor's ability to say "you asked about X earlier."
 *
 * 4. ConstellationProjection: Declarative projection from notebook
 *    entries to constellation data. Every constellation record traces
 *    back to a notebook moment. The constellation is a mirror.
 */

// Session state
export {
  getSessionState,
  subscribeSessionState,
  resetSession,
  restoreSession,
  setSessionIds,
  recordStudentTurn,
  recordTutorTurn,
  setStudentFocus,
  setActiveConcepts,
  setMasterySnapshot,
  setTutorActivity,
  setActivityDetail,
} from './session-state';
export type {
  SessionState,
  SessionPhase,
  InteractionMode,
  StudentFocus,
  ActiveConcept,
  TutorActivityStep,
  TutorActivityDetail,
} from './session-state';

// Composition guard
export {
  checkComposition,
  filterByComposition,
} from './composition-guard';
export type { GuardVerdict } from './composition-guard';

// Entry graph
export {
  addRelation,
  addRelations,
  getPrompters,
  getFollowUps,
  getReferences,
  getOutgoing,
  getIncoming,
  getFollowUpChain,
  getByType,
  subscribeGraph,
  getAllRelations,
  clearGraph,
  setNotebookContext,
  loadFromPersistence,
} from './entry-graph';
export type { EntryRelation, RelationType } from './entry-graph';

// Constellation projection (legacy — use entity-projector for new code)
export {
  projectEntry,
  projectEntries,
} from './constellation-projection';
export type {
  ProjectionResult,
  EncounterProjection,
  MasteryProjection,
  CuriosityProjection,
  LexiconProjection,
} from './constellation-projection';

// Entity projector (new — atomic, command-based projections)
export {
  projectEntry as projectEntityCommands,
  projectEntries as projectEntityCommandsBatch,
} from './entity-projector';
export type {
  ProjectionCommand,
  CreateEntityCommand,
  CreateRelationCommand,
  UpdateEntityCommand,
} from './entity-projector';

// Learning intelligence
export {
  findLearningGaps,
  computeTrajectories,
  suggestExplorations,
  trackThreads,
  findConceptClusters,
} from './learning-intelligence';
export type {
  LearningGap,
  MasteryTrajectory,
  ExplorationSuggestion,
  TrackedThread,
  ConceptCluster,
} from './learning-intelligence';

// Cross-notebook bridges
export { findCrossNotebookBridges } from './cross-notebook-bridge';
export type { CrossNotebookBridge } from './cross-notebook-bridge';

// Bootstrap progress (ephemeral DAG execution status)
export {
  getBootstrapState, subscribeBootstrapState,
  startBootstrapProgress, updateBootstrapNode,
  finishBootstrapProgress, resetBootstrapProgress,
} from './bootstrap-progress';
export type { BootstrapNodeStatus, BootstrapNodeState } from './bootstrap-progress';

// React hooks
export { useSessionState } from './useSessionState';
export { useEntryRelations, useEntryConnections } from './useEntryGraph';
