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
export { BOOTSTRAP_AGENT } from './bootstrap';
export { ECHO_AGENT } from './echo';
export { REFLECTION_AGENT } from './reflection';
export { ANNOTATOR_AGENT } from './annotator';
export { CRITIC_AGENT } from './critic';
export { IMAGE_CRITIC_AGENT } from './image-critic';

import { TUTOR_AGENT } from './tutor';
import { RESEARCHER_AGENT } from './researcher';
import { VISUALISER_AGENT } from './visualiser';
import { ILLUSTRATOR_AGENT } from './illustrator';
import { READER_AGENT } from './reader';
import { BOOTSTRAP_AGENT } from './bootstrap';
import { ECHO_AGENT } from './echo';
import { REFLECTION_AGENT } from './reflection';
import { ANNOTATOR_AGENT } from './annotator';
import { CRITIC_AGENT } from './critic';
import { IMAGE_CRITIC_AGENT } from './image-critic';

export const AGENTS = {
  tutor: TUTOR_AGENT,
  researcher: RESEARCHER_AGENT,
  visualiser: VISUALISER_AGENT,
  illustrator: ILLUSTRATOR_AGENT,
  reader: READER_AGENT,
  bootstrap: BOOTSTRAP_AGENT,
  echo: ECHO_AGENT,
  reflection: REFLECTION_AGENT,
  annotator: ANNOTATOR_AGENT,
  critic: CRITIC_AGENT,
  imageCritic: IMAGE_CRITIC_AGENT,
} as const;

export type AgentName = keyof typeof AGENTS;
