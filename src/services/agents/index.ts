/**
 * Agents — public API. Re-exports all agent configs.
 */
export type { AgentConfig, ThinkingLevel } from './config';
export { TOOLS, EMBER_DESIGN_CONTEXT } from './config';
export { TUTOR_AGENT } from './tutor';
export { RESEARCHER_AGENT } from './researcher';
export { VISUALISER_AGENT } from './visualiser';
export { ILLUSTRATOR_AGENT } from './illustrator';
export { READER_AGENT } from './reader';

import { TUTOR_AGENT } from './tutor';
import { RESEARCHER_AGENT } from './researcher';
import { VISUALISER_AGENT } from './visualiser';
import { ILLUSTRATOR_AGENT } from './illustrator';
import { READER_AGENT } from './reader';

export const AGENTS = {
  tutor: TUTOR_AGENT,
  researcher: RESEARCHER_AGENT,
  visualiser: VISUALISER_AGENT,
  illustrator: ILLUSTRATOR_AGENT,
  reader: READER_AGENT,
} as const;

export type AgentName = keyof typeof AGENTS;
