/**
 * Structured logger with levels, context, and breadcrumbs.
 * Pretty-prints in dev, outputs JSON in production.
 * Forwards errors to Sentry when available.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogContext {
  [key: string]: string | number | boolean | null | undefined;
}

interface Breadcrumb {
  timestamp: number;
  category: string;
  message: string;
  data?: LogContext;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: { name: string; message: string; stack?: string };
  breadcrumbs?: Breadcrumb[];
}

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: Error, context?: LogContext): void;
  fatal(message: string, error?: Error, context?: LogContext): void;
  /** Create a child logger with preset context (e.g., module name). */
  child(context: LogContext): Logger;
  /** Add a breadcrumb for error context trail. */
  breadcrumb(category: string, message: string, data?: LogContext): void;
}

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: 'color: #888',
  info: 'color: #3b82f6',
  warn: 'color: #f59e0b',
  error: 'color: #ef4444',
  fatal: 'color: #ef4444; font-weight: bold',
};

const BREADCRUMB_LIMIT = 50;
const breadcrumbs: Breadcrumb[] = [];

function getMinLevel(): LogLevel {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const envLevel = import.meta.env.VITE_LOG_LEVEL as LogLevel | undefined;
    if (envLevel && envLevel in LEVEL_ORDER) return envLevel;
    return import.meta.env.DEV ? 'debug' : 'warn';
  }
  return 'warn';
}

const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

function addBreadcrumb(crumb: Breadcrumb): void {
  breadcrumbs.push(crumb);
  if (breadcrumbs.length > BREADCRUMB_LIMIT) {
    breadcrumbs.shift();
  }
}

function emit(entry: LogEntry): void {
  if (isDev) {
    const style = LEVEL_COLORS[entry.level];
    const prefix = `[Ember:${entry.level.toUpperCase()}]`;
    const ctx = entry.context ? entry.context : '';
    if (entry.error) {
      console.error(`%c${prefix}`, style, entry.message, entry.error, ctx);
    } else if (entry.level === 'warn') {
      console.warn(`%c${prefix}`, style, entry.message, ctx);
    } else if (entry.level === 'debug') {
      console.debug(`%c${prefix}`, style, entry.message, ctx);
    } else {
      console.log(`%c${prefix}`, style, entry.message, ctx);
    }
  } else {
    const line = JSON.stringify(entry);
    if (LEVEL_ORDER[entry.level] >= LEVEL_ORDER.error) {
      console.error(line);
    } else if (entry.level === 'warn') {
      console.warn(line);
    } else {
      console.log(line);
    }
  }
}

async function forwardToSentry(entry: LogEntry, err?: Error): Promise<void> {
  try {
    const sentry = await import('./sentry');
    if (err) {
      sentry.captureError(err, entry.context as Record<string, unknown>);
    } else {
      const level = entry.level === 'fatal' ? 'error' : entry.level === 'warn' ? 'warning' : 'error';
      sentry.captureMessage(entry.message, level);
    }
  } catch {
    // Sentry not available — graceful degradation
  }
}

/** Create a structured logger, optionally with preset context. */
export function createLogger(baseContext?: LogContext): Logger {
  const minLevel = getMinLevel();

  function shouldLog(level: LogLevel): boolean {
    return LEVEL_ORDER[level] >= LEVEL_ORDER[minLevel];
  }

  function logAt(level: LogLevel, message: string, err?: Error, context?: LogContext): void {
    if (!shouldLog(level)) return;

    const merged = baseContext ? { ...baseContext, ...context } : context;
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(merged && Object.keys(merged).length > 0 ? { context: merged } : {}),
      ...(err ? { error: { name: err.name, message: err.message, stack: err.stack } } : {}),
    };

    if (level === 'error' || level === 'fatal') {
      entry.breadcrumbs = [...breadcrumbs];
      void forwardToSentry(entry, err);
    }

    emit(entry);
  }

  return {
    debug: (msg, ctx) => logAt('debug', msg, undefined, ctx),
    info: (msg, ctx) => logAt('info', msg, undefined, ctx),
    warn: (msg, ctx) => logAt('warn', msg, undefined, ctx),
    error: (msg, err, ctx) => logAt('error', msg, err, ctx),
    fatal: (msg, err, ctx) => logAt('fatal', msg, err, ctx),
    child: (ctx) => createLogger(baseContext ? { ...baseContext, ...ctx } : ctx),
    breadcrumb: (category, message, data) => {
      addBreadcrumb({ timestamp: Date.now(), category, message, data });
    },
  };
}

/** Singleton logger instance. */
export const log: Logger = createLogger();
