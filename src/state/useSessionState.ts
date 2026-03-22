/**
 * useSessionState — React hook for the shared tutor-learner state.
 * Uses useSyncExternalStore for tear-free reads.
 */
import { useSyncExternalStore } from 'react';
import {
  getSessionState,
  subscribeSessionState,
  type SessionState,
} from './session-state';

/** Subscribe to the full session state. */
export function useSessionState(): SessionState {
  return useSyncExternalStore(subscribeSessionState, getSessionState);
}
