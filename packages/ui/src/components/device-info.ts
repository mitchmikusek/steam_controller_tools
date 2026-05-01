import type { ControllerInfo } from '@scflash/protocol';

export class DeviceInfoPanel {
  readonly el: HTMLElement;

  private pidCell: HTMLElement;
  private bootCell: HTMLElement;
  private fwCell: HTMLElement;
  private radioCell: HTMLElement;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'card';
    this.el.style.display = 'none';

    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = 'Device Info';
    this.el.appendChild(title);

    const table = document.createElement('table');
    table.className = 'info-table';

    this.pidCell = this.addRow(table, 'USB PID');
    this.bootCell = this.addRow(table, 'Bootloader');
    this.fwCell = this.addRow(table, 'Firmware');
    this.radioCell = this.addRow(table, 'Radio');

    this.el.appendChild(table);
  }

  update(info: ControllerInfo | null): void {
    if (!info) {
      this.el.style.display = 'none';
      return;
    }
    this.el.style.display = '';
    this.pidCell.textContent = `0x${info.usbPid.toString(16).padStart(4, '0')}`;
    this.bootCell.textContent = this.formatRev(info.bootloaderRev);
    this.fwCell.textContent = this.formatRev(info.firmwareRev);
    this.radioCell.textContent = this.formatRev(info.radioRev);
  }

  private addRow(table: HTMLElement, label: string): HTMLElement {
    const tr = document.createElement('tr');
    const labelTd = document.createElement('td');
    labelTd.textContent = label;
    const valueTd = document.createElement('td');
    valueTd.textContent = '-';
    tr.appendChild(labelTd);
    tr.appendChild(valueTd);
    table.appendChild(tr);
    return valueTd;
  }

  private formatRev(ts: number): string {
    if (ts === 0) return 'N/A';
    const hex = `0x${ts.toString(16)}`;
    const date = new Date(ts * 1000).toLocaleDateString();
    return `${hex} (${date})`;
  }
}
