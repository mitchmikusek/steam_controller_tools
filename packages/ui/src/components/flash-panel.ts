export class FlashPanel {
  readonly el: HTMLElement;
  private bleBtn: HTMLButtonElement;
  private prodBtn: HTMLButtonElement;
  private advancedContent: HTMLElement;

  onFlashBLE: () => void = () => {};
  onFlashProduction: () => void = () => {};

  // Custom firmware file inputs
  lpcFile: File | null = null;
  softdeviceFile: File | null = null;
  radioFile: File | null = null;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'card';

    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = 'Firmware';
    this.el.appendChild(title);

    const btnContainer = document.createElement('div');
    btnContainer.className = 'flash-buttons';

    this.bleBtn = document.createElement('button');
    this.bleBtn.className = 'btn-primary';
    this.bleBtn.textContent = 'Flash BLE (Bluetooth)';
    this.bleBtn.disabled = true;
    this.bleBtn.addEventListener('click', () => {
      if (confirm('This will replace your controller firmware with BLE (Bluetooth) firmware. Continue?')) {
        this.onFlashBLE();
      }
    });

    this.prodBtn = document.createElement('button');
    this.prodBtn.className = 'btn-secondary';
    this.prodBtn.textContent = 'Revert to Production';
    this.prodBtn.disabled = true;
    this.prodBtn.addEventListener('click', () => {
      if (confirm('This will revert your controller to production (non-BLE) firmware. Continue?')) {
        this.onFlashProduction();
      }
    });

    btnContainer.appendChild(this.bleBtn);
    btnContainer.appendChild(this.prodBtn);
    this.el.appendChild(btnContainer);

    // Advanced section
    const toggle = document.createElement('div');
    toggle.className = 'advanced-toggle';
    toggle.textContent = '+ Advanced: Use custom firmware files';

    this.advancedContent = document.createElement('div');
    this.advancedContent.className = 'advanced-content';

    const inputs = [
      { label: 'LPC Firmware (.bin)', key: 'lpc' as const },
      { label: 'SoftDevice (.bin)', key: 'softdevice' as const },
      { label: 'Radio Application (.bin)', key: 'radio' as const },
    ];

    for (const input of inputs) {
      const group = document.createElement('div');
      group.className = 'file-input-group';

      const lbl = document.createElement('label');
      lbl.textContent = input.label;

      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.bin';
      fileInput.addEventListener('change', () => {
        const file = fileInput.files?.[0] ?? null;
        if (input.key === 'lpc') this.lpcFile = file;
        else if (input.key === 'softdevice') this.softdeviceFile = file;
        else this.radioFile = file;
      });

      group.appendChild(lbl);
      group.appendChild(fileInput);
      this.advancedContent.appendChild(group);
    }

    toggle.addEventListener('click', () => {
      this.advancedContent.classList.toggle('open');
      toggle.textContent = this.advancedContent.classList.contains('open')
        ? '- Advanced: Use custom firmware files'
        : '+ Advanced: Use custom firmware files';
    });

    this.el.appendChild(toggle);
    this.el.appendChild(this.advancedContent);
  }

  setEnabled(enabled: boolean): void {
    this.bleBtn.disabled = !enabled;
    this.prodBtn.disabled = !enabled;
  }

  setFlashing(flashing: boolean): void {
    this.bleBtn.disabled = flashing;
    this.prodBtn.disabled = flashing;
    this.bleBtn.textContent = flashing ? 'Flashing...' : 'Flash BLE (Bluetooth)';
    this.prodBtn.textContent = flashing ? 'Flashing...' : 'Revert to Production';
  }

  hasCustomFirmware(): boolean {
    return !!(this.lpcFile && this.softdeviceFile && this.radioFile);
  }
}
