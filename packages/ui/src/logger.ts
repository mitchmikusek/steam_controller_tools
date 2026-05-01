import type { LogLevel } from '@scflash/protocol';

export type LogListener = (level: LogLevel, timestamp: string, message: string) => void;

class Logger {
  private listeners: LogListener[] = [];

  addListener(fn: LogListener): void {
    this.listeners.push(fn);
  }

  log(level: LogLevel, message: string): void {
    const ts = new Date().toLocaleTimeString();
    console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
      `[${ts}] ${message}`,
    );
    for (const fn of this.listeners) {
      fn(level, ts, message);
    }
  }

  info(msg: string) { this.log('info', msg); }
  warn(msg: string) { this.log('warn', msg); }
  error(msg: string) { this.log('error', msg); }
  debug(msg: string) { this.log('debug', msg); }
}

export const logger = new Logger();
