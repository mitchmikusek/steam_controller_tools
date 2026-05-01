import type { FlashProgress } from '@scflash/protocol';

export class ProgressBar {
  readonly el: HTMLElement;
  private label: HTMLElement;
  private fill: HTMLElement;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'card progress-container';

    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = 'Progress';
    this.el.appendChild(title);

    this.label = document.createElement('div');
    this.label.className = 'progress-label';
    this.label.textContent = 'Idle';
    this.el.appendChild(this.label);

    const track = document.createElement('div');
    track.className = 'progress-track';

    this.fill = document.createElement('div');
    this.fill.className = 'progress-fill';

    track.appendChild(this.fill);
    this.el.appendChild(track);
  }

  update(progress: FlashProgress): void {
    this.el.classList.add('active');
    this.label.textContent = `${progress.phase} - ${progress.percent}%`;
    this.fill.style.width = `${progress.percent}%`;
    this.fill.classList.toggle('complete', progress.phase === 'Complete');
  }

  reset(): void {
    this.el.classList.remove('active');
    this.label.textContent = 'Idle';
    this.fill.style.width = '0%';
    this.fill.classList.remove('complete');
  }
}
