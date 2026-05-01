import { JINGLES, type ControllerDevice } from '@scflash/protocol';
import { logger } from '../logger';

export class ExtrasPanel {
  readonly el: HTMLElement;
  private content: HTMLElement;
  private controller: ControllerDevice | null = null;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'card';
    this.el.style.display = 'none';

    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = 'Extras';
    this.el.appendChild(title);

    this.content = document.createElement('div');

    // Haptics section
    const hapticLabel = document.createElement('div');
    hapticLabel.style.fontSize = '0.8rem';
    hapticLabel.style.color = 'var(--text-dim)';
    hapticLabel.style.marginBottom = '6px';
    hapticLabel.textContent = 'Haptics';
    this.content.appendChild(hapticLabel);

    const hapticGrid = document.createElement('div');
    hapticGrid.className = 'extras-grid';

    for (const side of ['left', 'right'] as const) {
      const btn = document.createElement('button');
      btn.className = 'btn-secondary btn-small';
      btn.textContent = `Buzz ${side}`;
      btn.addEventListener('click', () => this.buzz(side));
      hapticGrid.appendChild(btn);
    }
    this.content.appendChild(hapticGrid);

    // Brightness slider
    const brightnessGroup = document.createElement('div');
    brightnessGroup.className = 'slider-group';

    const brightnessLabel = document.createElement('label');
    brightnessLabel.textContent = 'LED Brightness';

    const brightnessSlider = document.createElement('input');
    brightnessSlider.type = 'range';
    brightnessSlider.min = '0';
    brightnessSlider.max = '100';
    brightnessSlider.value = '100';
    brightnessSlider.addEventListener('change', () => {
      this.setBrightness(parseInt(brightnessSlider.value));
    });

    brightnessGroup.appendChild(brightnessLabel);
    brightnessGroup.appendChild(brightnessSlider);
    this.content.appendChild(brightnessGroup);

    // Jingles section
    const jingleLabel = document.createElement('div');
    jingleLabel.style.fontSize = '0.8rem';
    jingleLabel.style.color = 'var(--text-dim)';
    jingleLabel.style.marginTop = '12px';
    jingleLabel.style.marginBottom = '4px';
    jingleLabel.textContent = 'Jingles';
    this.content.appendChild(jingleLabel);

    const jingleGrid = document.createElement('div');
    jingleGrid.className = 'jingle-grid';

    for (let i = 0; i < JINGLES.length; i++) {
      const btn = document.createElement('button');
      btn.className = 'btn-secondary btn-small';
      btn.textContent = JINGLES[i];
      btn.addEventListener('click', () => this.playJingle(i));
      jingleGrid.appendChild(btn);
    }
    this.content.appendChild(jingleGrid);

    // Utility buttons
    const utilLabel = document.createElement('div');
    utilLabel.style.fontSize = '0.8rem';
    utilLabel.style.color = 'var(--text-dim)';
    utilLabel.style.marginTop = '12px';
    utilLabel.style.marginBottom = '6px';
    utilLabel.textContent = 'Utilities';
    this.content.appendChild(utilLabel);

    const utilGrid = document.createElement('div');
    utilGrid.className = 'extras-grid';

    const resetBtn = document.createElement('button');
    resetBtn.className = 'btn-secondary btn-small';
    resetBtn.textContent = 'Reset Settings';
    resetBtn.addEventListener('click', () => this.resetSettings());

    const offBtn = document.createElement('button');
    offBtn.className = 'btn-danger btn-small';
    offBtn.textContent = 'Turn Off';
    offBtn.addEventListener('click', () => this.turnOff());

    utilGrid.appendChild(resetBtn);
    utilGrid.appendChild(offBtn);
    this.content.appendChild(utilGrid);

    this.el.appendChild(this.content);
  }

  setController(ctrl: ControllerDevice | null): void {
    this.controller = ctrl;
    this.el.style.display = ctrl ? '' : 'none';
  }

  private async buzz(side: 'left' | 'right'): Promise<void> {
    if (!this.controller) return;
    try {
      await this.controller.hapticPulse(side, 65535, 65535, 2);
      logger.info(`Haptic pulse: ${side}`);
    } catch (e) {
      logger.error(`Haptic failed: ${e}`);
    }
  }

  private async setBrightness(value: number): Promise<void> {
    if (!this.controller) return;
    try {
      await this.controller.setBrightness(value);
      logger.info(`Brightness set to ${value}%`);
    } catch (e) {
      logger.error(`Brightness failed: ${e}`);
    }
  }

  private async playJingle(index: number): Promise<void> {
    if (!this.controller) return;
    try {
      await this.controller.playJingle(index);
      logger.info(`Playing: ${JINGLES[index]}`);
    } catch (e) {
      logger.error(`Jingle failed: ${e}`);
    }
  }

  private async resetSettings(): Promise<void> {
    if (!this.controller) return;
    try {
      await this.controller.resetSettings();
      logger.info('Settings reset to defaults');
    } catch (e) {
      logger.error(`Reset failed: ${e}`);
    }
  }

  private async turnOff(): Promise<void> {
    if (!this.controller) return;
    try {
      await this.controller.turnOff();
      logger.info('Controller turned off');
    } catch (e) {
      logger.error(`Turn off failed: ${e}`);
    }
  }
}
