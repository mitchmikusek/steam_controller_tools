import type { ControllerInfo } from '@scflash/protocol';
import { showBleHelpModal } from '../components/ble-help-modal';
import { createInfoButton } from '../components/firmware-info-modal';

function fmtRev(ts: number): string {
  if (ts === 0) return 'N/A';
  return `0x${ts.toString(16)} (${new Date(ts * 1000).toLocaleDateString()})`;
}

export class CompletePage {
  readonly el: HTMLElement;
  private logoRing: HTMLElement;
  private iconEl: HTMLElement;
  private titleEl: HTMLElement;
  private detailsEl: HTMLElement;
  private homeBtn: HTMLButtonElement;
  private stepDots: HTMLElement[] = [];

  onHome: () => void = () => {};

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'page';

    // Steps — all done
    const steps = document.createElement('div');
    steps.className = 'steps';
    for (let i = 0; i < 4; i++) {
      const dot = document.createElement('div');
      dot.className = 'step-dot done';
      steps.appendChild(dot);
      this.stepDots.push(dot);
    }
    this.el.appendChild(steps);

    // Center area
    const center = document.createElement('div');
    center.className = 'flash-center';

    this.logoRing = document.createElement('div');
    this.logoRing.className = 'logo-ring complete';
    const arcBg = document.createElement('div');
    arcBg.className = 'arc-bg';
    const arc = document.createElement('div');
    arc.className = 'arc';
    this.iconEl = document.createElement('div');
    this.iconEl.className = 'icon';
    this.iconEl.style.fontSize = '3rem';
    this.iconEl.textContent = '\u2713';
    this.logoRing.appendChild(arcBg);
    this.logoRing.appendChild(arc);
    this.logoRing.appendChild(this.iconEl);
    center.appendChild(this.logoRing);

    this.titleEl = document.createElement('div');
    this.titleEl.className = 'result-title';
    center.appendChild(this.titleEl);

    this.detailsEl = document.createElement('div');
    this.detailsEl.className = 'section';
    this.detailsEl.style.width = '100%';
    center.appendChild(this.detailsEl);

    this.homeBtn = document.createElement('button');
    this.homeBtn.className = 'btn-blue btn-block';
    this.homeBtn.textContent = 'Return Home';
    this.homeBtn.style.marginTop = '16px';
    center.appendChild(this.homeBtn);
    this.homeBtn.addEventListener('click', () => this.onHome());

    this.el.appendChild(center);
  }

  showSuccess(firmwareType: string, info: ControllerInfo | null): void {
    this.logoRing.className = 'logo-ring complete';
    this.iconEl.textContent = '\u2713';
    this.titleEl.textContent = 'Flash Complete';

    this.detailsEl.textContent = '';

    // Firmware type row with info button
    const fwRow = document.createElement('div');
    fwRow.className = 'section-row';
    const fwLabel = document.createElement('div');
    fwLabel.className = 'section-row-label';
    fwLabel.textContent = `${firmwareType} Firmware Installed`;
    fwRow.appendChild(fwLabel);
    if (info) {
      fwRow.appendChild(createInfoButton(info));
    }
    this.detailsEl.appendChild(fwRow);

    if (firmwareType === 'BLE') {
      // BLE modes inline
      const modesRow = document.createElement('div');
      modesRow.className = 'section-row';
      const modesLabel = document.createElement('div');
      modesLabel.className = 'section-row-label';
      modesLabel.textContent = 'Controller Modes';
      const modesBtn = document.createElement('button');
      modesBtn.className = 'btn-ghost btn-sm';
      modesBtn.textContent = 'View BLE Modes';
      modesBtn.addEventListener('click', () => showBleHelpModal());
      modesRow.appendChild(modesLabel);
      modesRow.appendChild(modesBtn);
      this.detailsEl.appendChild(modesRow);
    }
  }

  showError(error: string): void {
    this.logoRing.className = 'logo-ring error';
    this.iconEl.textContent = '\u2717';
    this.titleEl.textContent = 'Flash Failed';

    // Mark last step as error
    this.stepDots.forEach((dot, i) => {
      dot.className = i < 3 ? 'step-dot done' : 'step-dot error';
    });

    this.detailsEl.textContent = '';
    const title = document.createElement('div');
    title.className = 'section-title';
    title.textContent = 'Error';
    this.detailsEl.appendChild(title);

    const msg = document.createElement('div');
    msg.style.cssText = 'font-size:0.7rem;color:var(--red);font-family:Consolas,SF Mono,monospace;word-break:break-all';
    msg.textContent = error;
    this.detailsEl.appendChild(msg);

    const tip = document.createElement('div');
    tip.className = 'result-tip';
    tip.textContent = 'The controller can be recovered by plugging it in while holding the right trigger (bootloader mode).';
    this.detailsEl.appendChild(tip);
  }
}
