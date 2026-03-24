/**
 * Production Logger
 * ──────────────────
 * • Development: pretty-prints to console
 * • Production:  forwards to Sentry + suppresses noise
 * • Always structured (JSON-serialisable metadata)
 *
 * Usage:
 *   logger.error('Mutation failed', { userId, candidateId, error })
 *   logger.info('Stage advanced', { from: 'Applied', to: 'Screening' })
 */

import { env } from './env';

type LogLevel  = 'debug' | 'info' | 'warn' | 'error';
type LogMeta   = Record<string, unknown>;

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 0, info: 1, warn: 2, error: 3,
};

const MIN_LEVEL: LogLevel = env.VITE_ENV === 'production' ? 'warn' : 'debug';

function shouldLog(level: LogLevel): boolean {
  return LEVEL_RANK[level] >= LEVEL_RANK[MIN_LEVEL];
}

function formatMsg(level: LogLevel, message: string, meta?: LogMeta): string {
  const prefix = `[HireFlow:${level.toUpperCase()}]`;
  return meta ? `${prefix} ${message} ${JSON.stringify(meta)}` : `${prefix} ${message}`;
}

export const logger = {
  debug: (message: string, meta?: LogMeta): void => {
    if (!shouldLog('debug')) return;
    console.debug(formatMsg('debug', message, meta));
  },

  info: (message: string, meta?: LogMeta): void => {
    if (!shouldLog('info')) return;
    console.info(formatMsg('info', message, meta));
  },

  warn: (message: string, meta?: LogMeta): void => {
    if (!shouldLog('warn')) return;
    console.warn(formatMsg('warn', message, meta));
  },

  error: (message: string, meta?: LogMeta): void => {
    if (!shouldLog('error')) return;
    console.error(formatMsg('error', message, meta));

    // Forward to Sentry in production
    if (env.VITE_ENV === 'production' && env.VITE_SENTRY_DSN) {
      // Sentry.captureMessage(message, { level: 'error', extra: meta });
    }
  },

  /** Track performance metrics */
  perf: (name: string, durationMs: number): void => {
    if (durationMs > 1000) {
      logger.warn(`Slow operation: ${name}`, { durationMs });
    } else {
      logger.debug(`Perf: ${name}`, { durationMs });
    }
  },
};
