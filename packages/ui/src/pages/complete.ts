import type { ControllerInfo } from '@scflash/protocol';
import { createBleHelpContent } from '../components/ble-help-modal';

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

    this.el.appendChild(center);

    this.detailsEl = document.createElement('div');
    this.detailsEl.className = 'card';
    this.el.appendChild(this.detailsEl);

    this.homeBtn = document.createElement('button');
    this.homeBtn.className = 'btn-blue btn-lg btn-block';
    this.homeBtn.textContent = 'Return Home';
    this.homeBtn.style.marginTop = '16px';
    this.homeBtn.addEventListener('click', () => this.onHome());
    this.el.appendChild(this.homeBtn);
  }

  showSuccess(firmwareType: string, info: ControllerInfo | null): void {
    this.logoRing.className = 'logo-ring complete';
    this.iconEl.textContent = '\u2713';
    this.titleEl.textContent = 'Flash Complete';

    this.detailsEl.textContent = '';
    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = 'Result';
    this.detailsEl.appendChild(title);

    const table = document.createElement('table');
    table.className = 'info-table';
    const rows: [string, string][] = [['Firmware Type', firmwareType]];
    if (info) {
      rows.push(['Firmware Rev', fmtRev(info.firmwareRev)]);
      rows.push(['Radio Rev', fmtRev(info.radioRev)]);
    }
    for (const [label, value] of rows) {
      const tr = document.createElement('tr');
      const tdl = document.createElement('td'); tdl.textContent = label;
      const tdv = document.createElement('td'); tdv.textContent = value;
      tr.appendChild(tdl); tr.appendChild(tdv);
      table.appendChild(tr);
    }
    this.detailsEl.appendChild(table);

    if (firmwareType === 'BLE') {
      const modesCard = document.createElement('div');
      modesCard.className = 'card';
      modesCard.style.marginTop = '12px';
      const modesTitle = document.createElement('div');
      modesTitle.className = 'card-title';
      modesTitle.textContent = 'BLE Controller Modes';
      modesCard.appendChild(modesTitle);
      const subtitle = document.createElement('div');
      subtitle.style.cssText = 'font-size:0.7rem;color:var(--text-dim);margin-bottom:8px';
      subtitle.textContent = 'Hold a button + Steam to switch modes';
      modesCard.appendChild(subtitle);
      modesCard.appendChild(createBleHelpContent());
      this.el.insertBefore(modesCard, this.homeBtn);
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
    title.className = 'card-title';
    title.textContent = 'Error';
    this.detailsEl.appendChild(title);

    const msg = document.createElement('div');
    msg.style.cssText = 'font-size:0.75rem;color:var(--red);font-family:monospace;word-break:break-all';
    msg.textContent = error;
    this.detailsEl.appendChild(msg);

    const tip = document.createElement('div');
    tip.className = 'result-tip';
    tip.textContent = 'The controller can be recovered by plugging it in while holding the right trigger (bootloader mode).';
    this.detailsEl.appendChild(tip);
  }
}
