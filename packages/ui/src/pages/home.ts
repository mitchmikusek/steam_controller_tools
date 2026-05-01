import type { ControllerInfo, ControllerDevice } from '@scflash/protocol';
import { JINGLES } from '@scflash/protocol';
import { logger } from '../logger';
import { showBleHelpModal } from '../components/ble-help-modal';

const KNOWN_BLE_FW = [0x5b0f21bd, 0x58be1e97];

function detectFirmwareType(info: ControllerInfo): 'ble' | 'production' | 'unknown' {
  if (KNOWN_BLE_FW.includes(info.firmwareRev)) return 'ble';
  if (info.firmwareRev > 0x5a000000) return 'ble';
  if (info.firmwareRev > 0 && info.firmwareRev < 0x5a000000) return 'production';
  return 'unknown';
}

function fmtRev(ts: number): string {
  if (ts === 0) return 'N/A';
  return `0x${ts.toString(16)} \u00b7 ${new Date(ts * 1000).toLocaleDateString()}`;
}

export class HomePage {
  readonly el: HTMLElement;
  private connDot: HTMLElement;
  private connStatus: HTMLElement;
  private connBtn: HTMLButtonElement;
  private controllerSection: HTMLElement;
  private extrasSection: HTMLElement;
  private flashRow: HTMLElement;
  private controller: ControllerDevice | null = null;
  private currentFwType: 'ble' | 'production' | 'unknown' = 'unknown';

  onConnect: () => Promise<void> = async () => {};
  onDisconnect: () => Promise<void> = async () => {};
  onFlash: () => void = () => {};

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'page';

    // ---- Connection bar ----
    const conn = document.createElement('div');
    conn.className = 'conn-bar';
    this.connDot = document.createElement('div');
    this.connDot.className = 'conn-dot';
    this.connStatus = document.createElement('span');
    this.connStatus.className = 'conn-status';
    this.connStatus.textContent = 'Disconnected';
    this.connBtn = document.createElement('button');
    this.connBtn.className = 'btn-blue btn-sm';
    this.connBtn.textContent = 'Connect';
    this.connBtn.addEventListener('click', async () => {
      this.connBtn.disabled = true;
      this.connBtn.textContent = 'Connecting...';
      await this.onConnect();
      this.connBtn.disabled = false;
    });
    conn.appendChild(this.connDot);
    conn.appendChild(this.connStatus);
    conn.appendChild(this.connBtn);
    this.el.appendChild(conn);

    // ---- Controller section ----
    this.controllerSection = document.createElement('div');
    this.controllerSection.className = 'section';
    this.controllerSection.style.display = 'none';
    this.el.appendChild(this.controllerSection);

    // ---- Flash firmware row ----
    this.flashRow = document.createElement('div');
    this.flashRow.className = 'section';
    this.flashRow.style.display = 'none';

    const flashTitle = document.createElement('div');
    flashTitle.className = 'section-title';
    flashTitle.textContent = 'Firmware';
    this.flashRow.appendChild(flashTitle);

    const flashRowInner = document.createElement('div');
    flashRowInner.className = 'section-row';
    const flashLabel = document.createElement('div');
    const flashMain = document.createElement('div');
    flashMain.className = 'section-row-label';
    flashMain.textContent = 'Flash Controller Firmware';
    const flashSub = document.createElement('div');
    flashSub.className = 'section-row-sublabel';
    flashSub.textContent = 'Switch between BLE and Production firmware';
    flashLabel.appendChild(flashMain);
    flashLabel.appendChild(flashSub);

    const flashBtn = document.createElement('button');
    flashBtn.className = 'btn-blue';
    flashBtn.textContent = 'Flash Firmware';
    flashBtn.addEventListener('click', () => this.onFlash());

    flashRowInner.appendChild(flashLabel);
    flashRowInner.appendChild(flashBtn);
    this.flashRow.appendChild(flashRowInner);
    this.el.appendChild(this.flashRow);

    // ---- Extras section ----
    this.extrasSection = document.createElement('div');
    this.extrasSection.className = 'section';
    this.extrasSection.style.display = 'none';
    this.el.appendChild(this.extrasSection);
  }

  setConnected(mode: 'disconnected' | 'normal' | 'bootloader'): void {
    this.connDot.className = 'conn-dot';
    if (mode === 'normal') {
      this.connDot.classList.add('ok');
      this.connStatus.textContent = 'Connected';
      this.connBtn.textContent = 'Disconnect';
      this.connBtn.className = 'btn-ghost btn-sm';
      this.connBtn.onclick = async () => {
        await this.onDisconnect();
        this.setConnected('disconnected');
        this.controllerSection.style.display = 'none';
        this.extrasSection.style.display = 'none';
        this.flashRow.style.display = 'none';
      };
      this.flashRow.style.display = '';
    } else if (mode === 'bootloader') {
      this.connDot.classList.add('warn');
      this.connStatus.textContent = 'Bootloader Mode';
      this.flashRow.style.display = '';
    } else {
      this.connStatus.textContent = 'Disconnected';
      this.connBtn.textContent = 'Connect';
      this.connBtn.className = 'btn-blue btn-sm';
      this.connBtn.onclick = async () => {
        this.connBtn.disabled = true;
        this.connBtn.textContent = 'Connecting...';
        await this.onConnect();
        this.connBtn.disabled = false;
      };
      this.flashRow.style.display = 'none';
    }
  }

  setDeviceInfo(info: ControllerInfo | null): void {
    if (!info) { this.controllerSection.style.display = 'none'; this.currentFwType = 'unknown'; return; }
    this.controllerSection.style.display = '';
    this.controllerSection.textContent = '';

    const fwType = detectFirmwareType(info);
    this.currentFwType = fwType;
    const badgeClass = fwType === 'ble' ? 'badge-ble' : fwType === 'production' ? 'badge-prod' : 'badge-unknown';
    const badgeText = fwType === 'ble' ? 'BLE' : fwType === 'production' ? 'PRODUCTION' : 'UNKNOWN';

    const title = document.createElement('div');
    title.className = 'section-title';
    title.textContent = 'Controller ';
    const badge = document.createElement('span');
    badge.className = `badge ${badgeClass}`;
    badge.textContent = badgeText;
    title.appendChild(badge);
    this.controllerSection.appendChild(title);

    const rows: [string, string][] = [
      ['Firmware', fmtRev(info.firmwareRev)],
      ['Radio', fmtRev(info.radioRev)],
      ['Bootloader', fmtRev(info.bootloaderRev)],
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
      this.controllerSection.appendChild(row);
    }
  }

  setController(ctrl: ControllerDevice | null): void {
    this.controller = ctrl;
    if (!ctrl) { this.extrasSection.style.display = 'none'; return; }
    this.extrasSection.style.display = '';
    this.extrasSection.textContent = '';

    const title = document.createElement('div');
    title.className = 'section-title';
    title.textContent = 'Extras';
    this.extrasSection.appendChild(title);

    // Haptics row
    const hapticRow = document.createElement('div');
    hapticRow.className = 'section-row';
    const hapticLabel = document.createElement('div');
    hapticLabel.className = 'section-row-label';
    hapticLabel.textContent = 'Haptic Feedback';
    const hapticBtns = document.createElement('div');
    hapticBtns.style.display = 'flex';
    hapticBtns.style.gap = '6px';
    for (const side of ['left', 'right'] as const) {
      const btn = document.createElement('button');
      btn.className = 'btn-ghost btn-sm';
      btn.textContent = side === 'left' ? 'Left' : 'Right';
      btn.addEventListener('click', async () => {
        try { await ctrl.hapticPulse(side, 65535, 65535, 2); }
        catch (e) { logger.error(`${e}`); }
      });
      hapticBtns.appendChild(btn);
    }
    hapticRow.appendChild(hapticLabel);
    hapticRow.appendChild(hapticBtns);
    this.extrasSection.appendChild(hapticRow);

    // BLE Modes button (only when BLE firmware detected)
    if (this.currentFwType === 'ble') {
      const modesRow = document.createElement('div');
      modesRow.className = 'section-row';
      const modesLabel = document.createElement('div');
      modesLabel.className = 'section-row-label';
      modesLabel.textContent = 'Controller Modes';
      const modesBtn = document.createElement('button');
      modesBtn.className = 'btn-blue btn-sm';
      modesBtn.textContent = 'View BLE Modes';
      modesBtn.addEventListener('click', () => showBleHelpModal());
      modesRow.appendChild(modesLabel);
      modesRow.appendChild(modesBtn);
      this.extrasSection.appendChild(modesRow);
    }

    // Brightness row
    const brightRow = document.createElement('div');
    brightRow.className = 'section-row';
    const brightLabel = document.createElement('div');
    brightLabel.className = 'section-row-label';
    brightLabel.textContent = 'LED Brightness';
    const slider = document.createElement('input');
    slider.type = 'range'; slider.min = '0'; slider.max = '100'; slider.value = '100';
    slider.style.width = '160px';
    slider.style.accentColor = 'var(--blue)';
    slider.addEventListener('change', async () => {
      try { await ctrl.setBrightness(parseInt(slider.value)); }
      catch (e) { logger.error(`${e}`); }
    });
    brightRow.appendChild(brightLabel);
    brightRow.appendChild(slider);
    this.extrasSection.appendChild(brightRow);

    // Jingles section
    const jingleTitle = document.createElement('div');
    jingleTitle.className = 'section-title';
    jingleTitle.textContent = 'Jingles';
    jingleTitle.style.marginTop = '16px';
    this.extrasSection.appendChild(jingleTitle);

    const jGrid = document.createElement('div');
    jGrid.className = 'jingle-grid';
    for (let i = 0; i < JINGLES.length; i++) {
      const btn = document.createElement('button');
      btn.className = 'btn-ghost btn-sm';
      btn.textContent = JINGLES[i];
      btn.addEventListener('click', async () => {
        try { await ctrl.playJingle(i); logger.info(`Playing: ${JINGLES[i]}`); }
        catch (e) { logger.error(`${e}`); }
      });
      jGrid.appendChild(btn);
    }
    this.extrasSection.appendChild(jGrid);
  }
}
