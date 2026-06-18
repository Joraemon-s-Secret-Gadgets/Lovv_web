/**
 * @file logger.ts
 * @description Standardized tag-based console logger for the Lovv frontend.
 * @lastModified 2026-06-18
 *
 * Prints colored, bold tag prefixes to the browser DevTools console via the
 * `%c` CSS formatting feature, so flows are easy to scan and trace.
 *
 * Tags mirror the backend src/shared/logger.py so both sides share one
 * vocabulary: [AUTH] [PREF] [PLAN] [CITY] [DB] [SYSTEM]
 *
 * Usage:
 *   import { log } from '../shared/logger'
 *   log.info('AUTH', 'Session restored', { userId })
 *   log.error('SYSTEM', 'Boundary caught error', err)
 *
 * Logs are enabled in dev and disabled in production builds, except `error`
 * which always prints. Enable verbose logs in production at runtime from the
 * console: `window.__LOVV_DEBUG__ = true`.
 */

export type LogTag = 'AUTH' | 'PREF' | 'PLAN' | 'CITY' | 'DB' | 'SYSTEM'
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

type TagStyle = { bg: string; fg: string }

// Tag -> color. [AUTH] deep red, [PLAN] Lovv orange, [DB] green, etc.
const TAG_STYLES: Record<LogTag, TagStyle> = {
  AUTH: { bg: '#A92B10', fg: '#FFFFFF' }, // deep red
  PREF: { bg: '#7A4DD6', fg: '#FFFFFF' }, // purple
  PLAN: { bg: '#F36B12', fg: '#FFFFFF' }, // Lovv orange
  CITY: { bg: '#0E7490', fg: '#FFFFFF' }, // teal
  DB: { bg: '#2E7D32', fg: '#FFFFFF' }, // green
  SYSTEM: { bg: '#374151', fg: '#FFFFFF' }, // slate
}

const TAG_CSS_BASE =
  'border-radius:4px;padding:2px 6px;font-weight:700;font-family:ui-monospace,Menlo,monospace;'

const CONSOLE_METHOD: Record<LogLevel, (...args: unknown[]) => void> = {
  debug: console.debug.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
}

const isDebugForced = (): boolean =>
  typeof window !== 'undefined' &&
  Boolean((window as Window & { __LOVV_DEBUG__?: boolean }).__LOVV_DEBUG__)

// Vite exposes import.meta.env.{DEV,PROD,MODE}. Enabled everywhere except prod.
const isLoggingEnabled = (): boolean => {
  if (isDebugForced()) {
    return true
  }
  const env = import.meta.env
  return env.DEV === true || env.MODE !== 'production'
}

const tagCss = (tag: LogTag): string => {
  const style = TAG_STYLES[tag] ?? TAG_STYLES.SYSTEM
  return `background:${style.bg};color:${style.fg};${TAG_CSS_BASE}`
}

class Logger {
  private emit(level: LogLevel, tag: LogTag, message: string, ...data: unknown[]): void {
    // Errors always surface, even in production builds.
    if (level !== 'error' && !isLoggingEnabled()) {
      return
    }
    CONSOLE_METHOD[level](`%c${tag}%c ${message}`, tagCss(tag), 'font-weight:400;', ...data)
  }

  debug(tag: LogTag, message: string, ...data: unknown[]): void {
    this.emit('debug', tag, message, ...data)
  }

  info(tag: LogTag, message: string, ...data: unknown[]): void {
    this.emit('info', tag, message, ...data)
  }

  warn(tag: LogTag, message: string, ...data: unknown[]): void {
    this.emit('warn', tag, message, ...data)
  }

  error(tag: LogTag, message: string, ...data: unknown[]): void {
    this.emit('error', tag, message, ...data)
  }
}

export const log = new Logger()
export default log
