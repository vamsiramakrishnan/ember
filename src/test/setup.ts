/**
 * Vitest global test setup.
 * Configures DOM matchers, IndexedDB mock, and environment flags.
 */
import '@testing-library/jest-dom';
import { createMockIndexedDB } from './idb-mock';

// Provide a minimal IndexedDB implementation for jsdom
// (jsdom does not include IndexedDB natively)
Object.defineProperty(globalThis, 'indexedDB', {
  value: createMockIndexedDB(),
  writable: true,
  configurable: true,
});

// Provide matchMedia stub (jsdom doesn't include it)
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}

// Ensure structuredClone is available (jsdom may not have it)
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = <T>(val: T): T =>
    JSON.parse(JSON.stringify(val)) as T;
}
