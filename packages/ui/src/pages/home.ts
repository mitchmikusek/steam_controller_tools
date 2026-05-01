import type { ControllerInfo, ControllerDevice } from '@scflash/protocol';
import { JINGLES } from '@scflash/protocol';
import { logger } from '../logger';
import { showBleHelpModal } from '../components/ble-help-modal';
import { createInfoButton } from '../components/firmware-info-modal';

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
  private controllerSection: HTMLElement;
  private extrasSection: HTMLElement;
  private controller: ControllerDevice | null = null;
  private currentFwType: 'ble' | 'production' | 'unknown' = 'unknown';

  onDisconnect: () => void = () => {};
  onFlash: () => void = () => {};

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'page';

    // ---- Controller section (connection + firmware + flash) ----
    this.controllerSection = document.createElement('div');
    this.controllerSection.className = 'section';
    this.el.appendChild(this.controllerSection);

    // ---- Extras section ----
    this.extrasSection = document.createElement('div');
    this.extrasSection.className = 'section';
    this.el.appendChild(this.extrasSection);
  }

  setMode(_mode: 'normal' | 'bootloader'): void {
    // Mode is shown via setDeviceInfo now
  }

  setDeviceInfo(info: ControllerInfo | null): void {
    if (!info) { this.controllerSection.textContent = ''; this.currentFwType = 'unknown'; return; }
    this.controllerSection.textContent = '';

    const fwType = detectFirmwareType(info);
    this.currentFwType = fwType;
    const badgeClass = fwType === 'ble' ? 'badge-ble' : fwType === 'production' ? 'badge-prod' : 'badge-unknown';
    const badgeText = fwType === 'ble' ? 'BLE' : fwType === 'production' ? 'PRODUCTION' : 'UNKNOWN';

    // Section title with badge
    const title = document.createElement('div');
    title.className = 'section-title';
    title.textContent = 'Controller ';
    const badge = document.createElement('span');
    badge.className = `badge ${badgeClass}`;
    badge.textContent = badgeText;
    title.appendChild(badge);
    this.controllerSection.appendChild(title);

    // Connection status row
    const connRow = document.createElement('div');
    connRow.className = 'section-row';
    const connLeft = document.createElement('div');
    connLeft.style.cssText = 'display:flex;align-items:center;gap:8px';
    this.connDot = document.createElement('div');
    this.connDot.className = 'conn-dot ok';
    this.connStatus = document.createElement('span');
    this.connStatus.className = 'section-row-label';
    this.connStatus.textContent = 'Connected';
    connLeft.appendChild(this.connDot);
    connLeft.appendChild(this.connStatus);
    const disconnectBtn = document.createElement('button');
    disconnectBtn.className = 'btn-ghost btn-sm';
    disconnectBtn.textContent = 'Disconnect';
    disconnectBtn.addEventListener('click', () => this.onDisconnect());
    connRow.appendChild(connLeft);
    connRow.appendChild(disconnectBtn);
    this.controllerSection.appendChild(connRow);

    // Firmware summary row with info modal
    const fwRow = document.createElement('div');
    fwRow.className = 'section-row';
    const fwLabel = document.createElement('div');
    fwLabel.className = 'section-row-label';
    fwLabel.textContent = fwType === 'ble' ? 'Bluetooth LE Firmware' : fwType === 'production' ? 'Production Firmware' : 'Unknown Firmware';
    fwRow.appendChild(fwLabel);
    fwRow.appendChild(createInfoButton(info));
    this.controllerSection.appendChild(fwRow);

    // Flash firmware row
    const flashRow = document.createElement('div');
    flashRow.className = 'section-row';
    const flashLabel = document.createElement('div');
    const flashMain = document.createElement('div');
    flashMain.className = 'section-row-label';
    flashMain.textContent = 'Flash Firmware';
    const flashSub = document.createElement('div');
    flashSub.className = 'section-row-sublabel';
    flashSub.textContent = 'Switch between BLE and Production';
    flashLabel.appendChild(flashMain);
    flashLabel.appendChild(flashSub);
    const flashBtn = document.createElement('button');
    flashBtn.className = 'btn-blue';
    flashBtn.textContent = 'Flash';
    flashBtn.addEventListener('click', () => this.onFlash());
    flashRow.appendChild(flashLabel);
    flashRow.appendChild(flashBtn);
    this.controllerSection.appendChild(flashRow);
  }

  setController(ctrl: ControllerDevice | null): void {
    this.controller = ctrl;
    this.extrasSection.textContent = '';
    if (!ctrl) return;

    const title = document.createElement('div');
    title.className = 'section-title';
    title.textContent = 'Extras';
    this.extrasSection.appendChild(title);

    // BLE Modes button (top of extras)
    if (this.currentFwType === 'ble') {
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
      this.extrasSection.appendChild(modesRow);
    }

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
