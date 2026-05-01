import type { ControllerInfo } from '@scflash/protocol';

function fmtRev(ts: number): string {
  if (ts === 0) return 'N/A';
  return `0x${ts.toString(16)} \u00b7 ${new Date(ts * 1000).toLocaleDateString()}`;
}

export function showFirmwareInfoModal(info: ControllerInfo): void {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.textAlign = 'left';
  modal.style.maxWidth = '420px';
  modal.style.padding = '24px 28px';

  // Header
  const header = document.createElement('div');
  header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:16px';

  const title = document.createElement('div');
  title.className = 'modal-title';
  title.style.textAlign = 'left';
  title.textContent = 'Firmware Details';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'btn-ghost btn-sm';
  closeBtn.textContent = '\u2715';
  closeBtn.style.cssText = 'font-size:1rem;padding:4px 8px;min-width:auto';

  header.appendChild(title);
  header.appendChild(closeBtn);
  modal.appendChild(header);

  // Details rows
  const rows: [string, string][] = [
    ['Firmware', fmtRev(info.firmwareRev)],
    ['Radio', fmtRev(info.radioRev)],
    ['Bootloader', fmtRev(info.bootloaderRev)],
    ['USB PID', `0x${info.usbPid.toString(16).padStart(4, '0')}`],
  ];

  for (const [label, value] of rows) {
    const row = document.createElement('div');
    row.className = 'section-row';
    const lbl = document.createElement('div');
    lbl.className = 'section-row-label';
    lbl.textContent = label;
    const val = document.createElement('div');
    val.className = 'section-row-value';
    val.textContent = value;
    row.appendChild(lbl);
    row.appendChild(val);
    modal.appendChild(row);
  }

  overlay.appendChild(modal);

  const close = () => {
    overlay.classList.add('closing');
    setTimeout(() => overlay.remove(), 350);
  };

  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  document.body.appendChild(overlay);
}

/**
 * Creates a standardized (i) button that opens the firmware info modal.
 */
export function createInfoButton(info: ControllerInfo): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.className = 'btn-ghost btn-sm btn-info-circle';
  btn.textContent = '\u24D8';
  btn.addEventListener('click', () => showFirmwareInfoModal(info));
  return btn;
}
