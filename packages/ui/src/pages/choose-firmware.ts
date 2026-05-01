import type { ControllerInfo } from '@scflash/protocol';

export type FirmwareChoice = 'ble' | 'production' | 'custom';

const KNOWN_BLE_FW = [0x5b0f21bd, 0x58be1e97];

function detectFirmwareType(info: ControllerInfo): 'ble' | 'production' | 'unknown' {
  if (KNOWN_BLE_FW.includes(info.firmwareRev)) return 'ble';
  if (info.firmwareRev > 0x5a000000) return 'ble';
  if (info.firmwareRev > 0 && info.firmwareRev < 0x5a000000) return 'production';
  return 'unknown';
}

export class ChooseFirmwarePage {
  readonly el: HTMLElement;
  private selected: FirmwareChoice | null = null;
  private nextBtn: HTMLButtonElement;
  private cards: HTMLElement[] = [];
  private customArea: HTMLElement;
  private installedEl: HTMLElement;

  lpcFile: File | null = null;
  softdeviceFile: File | null = null;
  radioFile: File | null = null;

  onBack: () => void = () => {};
  onNext: (choice: FirmwareChoice) => void = () => {};

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'page';

    // Steps indicator
    const steps = document.createElement('div');
    steps.className = 'steps';
    for (let i = 0; i < 4; i++) {
      const dot = document.createElement('div');
      dot.className = 'step-dot' + (i === 0 ? ' active' : '');
      steps.appendChild(dot);
    }
    this.el.appendChild(steps);

    // Back link
    const back = document.createElement('div');
    back.className = 'back-link';
    back.textContent = '\u2190 Back';
    back.addEventListener('click', () => this.onBack());
    this.el.appendChild(back);

    const heading = document.createElement('div');
    heading.style.cssText = 'font-size:1rem;font-weight:300;color:var(--text-bright);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.04em';
    heading.textContent = 'Choose Firmware';
    this.el.appendChild(heading);

    // Hidden — kept for setDeviceInfo compatibility
    this.installedEl = document.createElement('div');
    this.installedEl.style.display = 'none';

    // Options
    const options: { id: FirmwareChoice; title: string; desc: string }[] = [
      { id: 'ble', title: 'BLE (Bluetooth)', desc: 'Adds Bluetooth support while keeping dongle compatibility' },
      { id: 'production', title: 'Production', desc: 'Original firmware with dongle support only. Use if experiencing issues with BLE firmware.' },
      { id: 'custom', title: 'Custom Firmware', desc: 'Load your own firmware files' },
    ];

    for (const opt of options) {
      const card = document.createElement('div');
      card.className = 'select-card';
      card.addEventListener('click', () => this.select(opt.id));

      const t = document.createElement('div');
      t.className = 'select-card-title';
      t.textContent = opt.title;

      const d = document.createElement('div');
      d.className = 'select-card-desc';
      d.textContent = opt.desc;

      card.appendChild(t);
      card.appendChild(d);
      this.el.appendChild(card);
      this.cards.push(card);
    }

    // Custom firmware file pickers (hidden by default)
    this.customArea = document.createElement('div');
    this.customArea.style.display = 'none';
    this.customArea.className = 'card';

    const inputs = [
      { label: 'LPC Firmware (.bin)', key: 'lpc' as const },
      { label: 'SoftDevice (.bin)', key: 'softdevice' as const },
      { label: 'Radio Application (.bin)', key: 'radio' as const },
    ];
    for (const input of inputs) {
      const group = document.createElement('div');
      group.className = 'file-group';
      const lbl = document.createElement('label');
      lbl.textContent = input.label;
      const fi = document.createElement('input');
      fi.type = 'file'; fi.accept = '.bin';
      fi.addEventListener('change', () => {
        const file = fi.files?.[0] ?? null;
        if (input.key === 'lpc') this.lpcFile = file;
        else if (input.key === 'softdevice') this.softdeviceFile = file;
        else this.radioFile = file;
        this.updateNextBtn();
      });
      group.appendChild(lbl);
      group.appendChild(fi);
      this.customArea.appendChild(group);
    }
    this.el.appendChild(this.customArea);

    // Nav
    const nav = document.createElement('div');
    nav.className = 'nav-row';
    const spacer = document.createElement('div');
    spacer.className = 'spacer';
    this.nextBtn = document.createElement('button');
    this.nextBtn.className = 'btn-ghost';
    this.nextBtn.textContent = 'Next';
    this.nextBtn.disabled = true;
    this.nextBtn.addEventListener('click', () => {
      if (this.selected) this.onNext(this.selected);
    });
    nav.appendChild(spacer);
    nav.appendChild(this.nextBtn);
    this.el.appendChild(nav);
  }

  private select(choice: FirmwareChoice): void {
    this.selected = choice;
    this.cards.forEach((c, i) => {
      const ids: FirmwareChoice[] = ['ble', 'production', 'custom'];
      c.classList.toggle('selected', ids[i] === choice);
    });
    this.customArea.style.display = choice === 'custom' ? '' : 'none';
    this.updateNextBtn();
  }

  private updateNextBtn(): void {
    if (this.selected === 'custom') {
      this.nextBtn.disabled = !(this.lpcFile && this.softdeviceFile && this.radioFile);
    } else {
      this.nextBtn.disabled = !this.selected;
    }
  }

  setDeviceInfo(info: ControllerInfo | null): void {
    if (!info) return;
    const fwType = detectFirmwareType(info);

    // Add "installed" badge to the matching card
    const ids: FirmwareChoice[] = ['ble', 'production', 'custom'];
    this.cards.forEach((card, i) => {
      const existing = card.querySelector('.badge');
      if (existing) existing.remove();
      if (ids[i] === fwType) {
        const badge = document.createElement('span');
        badge.className = 'badge badge-prod';
        badge.textContent = 'INSTALLED';
        badge.style.marginLeft = '8px';
        card.querySelector('.select-card-title')?.appendChild(badge);
      }
    });
  }
}
