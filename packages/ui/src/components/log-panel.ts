import type { LogLevel } from '@scflash/protocol';

export class LogPanel {
  readonly el: HTMLElement;
  private output: HTMLElement;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'card';

    const header = document.createElement('div');
    header.className = 'log-header';

    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = 'Log';
    title.style.marginBottom = '0';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'btn-secondary btn-small';
    copyBtn.textContent = 'Copy';
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(this.output.textContent ?? '');
    });

    header.appendChild(title);
    header.appendChild(copyBtn);
    this.el.appendChild(header);

    this.output = document.createElement('div');
    this.output.className = 'log-output';
    this.el.appendChild(this.output);
  }

  appendLine(level: LogLevel, timestamp: string, message: string): void {
    const line = document.createElement('div');
    line.className = `log-line ${level}`;
    line.textContent = `[${timestamp}] ${message}`;
    this.output.appendChild(line);
    this.output.scrollTop = this.output.scrollHeight;
  }

  clear(): void {
    this.output.textContent = '';
  }
}
