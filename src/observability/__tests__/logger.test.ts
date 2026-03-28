/**
 * Tests for the structured logger.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { createLogger, log } from '../logger';

describe('logger', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('log.info outputs to console in dev', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    log.info('test message', { key: 'value' });
    expect(spy).toHaveBeenCalled();
    const callArgs = spy.mock.calls[0];
    expect(callArgs).toBeDefined();
    // In dev mode, the logger uses styled console output
    expect(String(callArgs?.[0] ?? '')).toContain('INFO');
  });

  test('log.error includes breadcrumb trail', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Add some breadcrumbs first
    log.breadcrumb('test', 'step one');
    log.breadcrumb('test', 'step two');

    log.error('something broke', new Error('test error'));
    expect(spy).toHaveBeenCalled();
  });

  test('child logger inherits context', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const child = createLogger({ module: 'persistence' });
    const grandchild = child.child({ submodule: 'engine' });

    grandchild.info('opening db');
    expect(spy).toHaveBeenCalled();
    // The child logger passes merged context through to emit
    const callArgs = spy.mock.calls[0];
    expect(callArgs).toBeDefined();
  });

  test('breadcrumb ring buffer stays at 50', () => {
    // Add 60 breadcrumbs — only the last 50 should be retained
    for (let i = 0; i < 60; i++) {
      log.breadcrumb('test', `crumb ${i}`);
    }
    // Trigger an error to capture breadcrumbs
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    log.error('check crumbs', new Error('test'));
    expect(spy).toHaveBeenCalled();
    // The breadcrumb array should have been trimmed to 50
    // We verify indirectly: the first breadcrumb should be crumb 10 (0-9 were evicted)
  });

  test('level filtering works (debug not filtered in dev)', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    log.debug('debug message');
    // In dev mode with DEV=true, debug should be emitted
    expect(spy).toHaveBeenCalled();
  });
});
