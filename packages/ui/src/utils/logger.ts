import type { LogLevel } from '@scflash/protocol';

class Logger {
  log(level: LogLevel, message: string): void {
    const ts = new Date().toLocaleTimeString();
    console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](`[${ts}] ${message}`);
  }

  info(msg: string) {
    this.log('info', msg);
  }
  warn(msg: string) {
    this.log('warn', msg);
  }
  error(msg: string) {
    this.log('error', msg);
  }
  debug(msg: string) {
    this.log('debug', msg);
  }
}

export const logger = new Logger();
