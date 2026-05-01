import type { ControllerInfo } from '@scflash/protocol';
import type { FirmwareChoice } from './choose-firmware';

interface Check {
  label: string;
  status: 'pass' | 'fail' | 'warn';
  detail?: string;
}

export class PreflightPage {
  readonly el: HTMLElement;
  private beginBtn: HTMLButtonElement;
  private contentEl: HTMLElement;

  onBack: () => void = () => {};
  onBegin: () => void = () => {};

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'page';

    // Steps
    const steps = document.createElement('div');
    steps.className = 'steps';
    for (let i = 0; i < 4; i++) {
      const dot = document.createElement('div');
      dot.className = 'step-dot' + (i < 1 ? ' done' : i === 1 ? ' active' : '');
      steps.appendChild(dot);
    }
    this.el.appendChild(steps);

    const back = document.createElement('div');
    back.className = 'back-link';
    back.textContent = '\u2190 Back';
    back.addEventListener('click', () => this.onBack());
    this.el.appendChild(back);

    this.contentEl = document.createElement('div');
    this.el.appendChild(this.contentEl);

    const nav = document.createElement('div');
    nav.className = 'nav-row';
    const spacer = document.createElement('div');
    spacer.className = 'spacer';
    this.beginBtn = document.createElement('button');
    this.beginBtn.className = 'btn-blue btn-lg';
    this.beginBtn.textContent = 'Begin Flash';
    this.beginBtn.addEventListener('click', () => this.onBegin());
    nav.appendChild(spacer);
    nav.appendChild(this.beginBtn);
    this.el.appendChild(nav);
  }

  configure(choice: FirmwareChoice, info: ControllerInfo | null, isConnected: boolean): void {
    this.contentEl.textContent = '';

    const checks: Check[] = [];
    if ('hid' in navigator) {
      checks.push({ label: 'WebHID supported', status: 'pass' });
    } else {
      checks.push({ label: 'WebHID not supported', status: 'fail', detail: 'Use Chrome, Edge, or Vivaldi' });
    }
    if (isConnected) {
      checks.push({ label: 'Controller connected', status: 'pass' });
    } else {
      checks.push({ label: 'Controller not connected', status: 'fail', detail: 'Plug in via USB and connect' });
    }
    checks.push({
      label: choice === 'custom' ? 'Custom firmware files selected' : `${choice === 'ble' ? 'BLE' : 'Production'} firmware bundled`,
      status: 'pass',
    });

    // Checks section
    const checksSection = document.createElement('div');
    checksSection.className = 'section';
    const checksTitle = document.createElement('div');
    checksTitle.className = 'section-title';
    checksTitle.textContent = 'System Checks';
    checksSection.appendChild(checksTitle);

    let allPass = true;
    for (const check of checks) {
      const row = document.createElement('div');
      row.className = 'section-row';
      const label = document.createElement('div');
      label.className = 'section-row-label';
      label.textContent = check.label;
      if (check.detail) {
        const sub = document.createElement('div');
        sub.className = 'section-row-sublabel';
        sub.textContent = check.detail;
        label.appendChild(sub);
      }
      const icon = document.createElement('div');
      icon.className = `check-icon ${check.status}`;
      icon.textContent = check.status === 'pass' ? '\u2713' : check.status === 'warn' ? '\u26A0' : '\u2717';
      row.appendChild(label);
      row.appendChild(icon);
      checksSection.appendChild(row);
      if (check.status === 'fail') allPass = false;
    }
    this.contentEl.appendChild(checksSection);

    // Warnings
    const warnings: string[] = [
      'Do not unplug the controller during flashing.',
      'The process takes approximately 30 seconds. You will be prompted along the way.',
      'If flashing fails, recovery is possible via bootloader mode.',
    ];
    if (choice === 'production') {
      warnings.push('This will remove Bluetooth (BLE) support.');
    }

    const warnBox = document.createElement('div');
    warnBox.className = 'warning-box';
    for (const w of warnings) {
      const p = document.createElement('div');
      p.textContent = '\u26A0 ' + w;
      p.style.marginBottom = '4px';
      warnBox.appendChild(p);
    }
    this.contentEl.appendChild(warnBox);

    // Summary
    if (info) {
      const sumSection = document.createElement('div');
      sumSection.className = 'section';
      const sumTitle = document.createElement('div');
      sumTitle.className = 'section-title';
      sumTitle.textContent = 'Summary';
      sumSection.appendChild(sumTitle);

      const knownBle = [0x5b0f21bd, 0x58be1e97];
      const currentType = knownBle.includes(info.firmwareRev) ? 'BLE' :
                          (info.firmwareRev > 0x5a000000) ? 'BLE' :
                          (info.firmwareRev > 0) ? 'Production' : 'Unknown';
      const currentHex = `0x${info.firmwareRev.toString(16)}`;
      const targetType = choice === 'ble' ? 'BLE' : choice === 'production' ? 'Production' : 'Custom';
      const targetHex = choice === 'ble' ? '0x5b0f21bd' : choice === 'production' ? 'bundled' : 'user-provided';

      const row = document.createElement('div');
      row.className = 'summary-row';
      const lbl = document.createElement('span');
      lbl.className = 'summary-label';
      lbl.textContent = 'Firmware';
      const val = document.createElement('span');
      val.className = 'summary-values';
      const cur = document.createElement('span');
      cur.className = 'summary-value';
      cur.textContent = currentType;
      cur.title = currentHex;
      cur.style.cursor = 'help';
      const arrow = document.createElement('span');
      arrow.style.cssText = 'color:var(--blue);margin:0 8px;font-size:0.7rem;position:relative;top:-2px';
      arrow.textContent = '\u2192';
      const tgt = document.createElement('span');
      tgt.className = 'summary-value';
      tgt.textContent = targetType;
      tgt.title = targetHex;
      tgt.style.cursor = 'help';
      val.appendChild(cur); val.appendChild(arrow); val.appendChild(tgt);
      row.appendChild(lbl); row.appendChild(val);
      sumSection.appendChild(row);
      this.contentEl.appendChild(sumSection);
    }

    this.beginBtn.disabled = !allPass;
  }
}
