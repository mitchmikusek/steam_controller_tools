import {
  FlashCoordinator,
  WebHIDTransport,
  VALVE_VID,
  createBLEFirmwareSet,
  createProductionFirmwareSet,
  loadFirmwareFromUrl,
  loadFirmwareFromFile,
} from '@scflash/protocol';
import { logger } from './logger';
import { ConnectionPanel } from './components/connection-panel';
import { DeviceInfoPanel } from './components/device-info';
import { FlashPanel } from './components/flash-panel';
import { ProgressBar } from './components/progress-bar';
import { ExtrasPanel } from './components/extras-panel';
import { LogPanel } from './components/log-panel';

// Bundled firmware paths (relative to the web app root)
const BLE_FW = {
  lpc: 'fw_images/ble/vcf_wired_controller_d0g_5b0f21bd.bin',
  softdevice: 'fw_images/ble/s110_nrf51_8.0.0_softdevice.bin',
  radio: 'fw_images/ble/vcf_wired_controller_d0g_5a0e3f348_radio.bin',
};

const PROD_FW = {
  lpc: 'fw_images/production/vcf_wired_controller_d0g.bin',
  bootloader: 'fw_images/production/d0g_bootloader.bin',
  radio: 'fw_images/production/d0g_module.bin',
};

export class App {
  private coordinator: FlashCoordinator;
  private connectionPanel: ConnectionPanel;
  private deviceInfo: DeviceInfoPanel;
  private flashPanel: FlashPanel;
  private progressBar: ProgressBar;
  private extrasPanel: ExtrasPanel;
  private logPanel: LogPanel;

  constructor(root: HTMLElement) {
    this.coordinator = new FlashCoordinator();
    this.connectionPanel = new ConnectionPanel();
    this.deviceInfo = new DeviceInfoPanel();
    this.flashPanel = new FlashPanel();
    this.progressBar = new ProgressBar();
    this.extrasPanel = new ExtrasPanel();
    this.logPanel = new LogPanel();

    // Wire up logger to log panel
    logger.addListener((level, ts, msg) => this.logPanel.appendLine(level, ts, msg));

    // Wire up coordinator callbacks
    this.coordinator.onProgress = (p) => this.progressBar.update(p);
    this.coordinator.onLog = (level, msg) => logger.log(level, msg);
    this.coordinator.onReconnectNeeded = (targetPid) => this.promptReconnect(targetPid);

    // Wire up connection panel
    this.connectionPanel.onConnect = () => this.handleConnect();
    this.connectionPanel.onDisconnect = () => this.handleDisconnect();

    // Wire up flash panel
    this.flashPanel.onFlashBLE = () => this.handleFlashBLE();
    this.flashPanel.onFlashProduction = () => this.handleFlashProduction();

    // Mount components
    root.appendChild(this.connectionPanel.el);
    root.appendChild(this.deviceInfo.el);
    root.appendChild(this.flashPanel.el);
    root.appendChild(this.progressBar.el);
    root.appendChild(this.extrasPanel.el);
    root.appendChild(this.logPanel.el);

    logger.info('Steam Controller Flash Tool ready');
    logger.info('Connect your controller via USB to begin');
  }

  private async handleConnect(): Promise<void> {
    this.connectionPanel.setLoading(true);
    try {
      const mode = await this.coordinator.connect();
      this.connectionPanel.update(mode);
      this.flashPanel.setEnabled(true);

      if (mode === 'normal') {
        const info = await this.coordinator.getInfo();
        this.deviceInfo.update(info);
        this.extrasPanel.setController(this.coordinator.getController());
      }
    } catch (e) {
      logger.error(`Connection failed: ${e}`);
      this.connectionPanel.update('disconnected');
    } finally {
      this.connectionPanel.setLoading(false);
    }
  }

  private async handleDisconnect(): Promise<void> {
    await this.coordinator.disconnect();
    this.connectionPanel.update('disconnected');
    this.deviceInfo.update(null);
    this.flashPanel.setEnabled(false);
    this.extrasPanel.setController(null);
    this.progressBar.reset();
  }

  private async handleFlashBLE(): Promise<void> {
    this.flashPanel.setFlashing(true);
    this.progressBar.reset();
    try {
      const fw = this.flashPanel.hasCustomFirmware()
        ? await this.loadCustomFirmware('ble')
        : await this.loadBundledBLEFirmware();

      await this.coordinator.flashBLE(fw);

      // Refresh info after flash
      const info = await this.coordinator.getInfo();
      this.deviceInfo.update(info);
      this.connectionPanel.update(this.coordinator.currentMode);
      this.extrasPanel.setController(this.coordinator.getController());
    } catch (e) {
      logger.error(`Flash failed: ${e}`);
      this.progressBar.reset();
    } finally {
      this.flashPanel.setFlashing(false);
    }
  }

  private async handleFlashProduction(): Promise<void> {
    this.flashPanel.setFlashing(true);
    this.progressBar.reset();
    try {
      const fw = this.flashPanel.hasCustomFirmware()
        ? await this.loadCustomFirmware('production')
        : await this.loadBundledProductionFirmware();

      await this.coordinator.flashProduction(fw);

      const info = await this.coordinator.getInfo();
      this.deviceInfo.update(info);
      this.connectionPanel.update(this.coordinator.currentMode);
      this.extrasPanel.setController(this.coordinator.getController());
    } catch (e) {
      logger.error(`Flash failed: ${e}`);
      this.progressBar.reset();
    } finally {
      this.flashPanel.setFlashing(false);
    }
  }

  private async loadBundledBLEFirmware() {
    logger.info('Loading bundled BLE firmware...');
    const [lpc, softdevice, radio] = await Promise.all([
      loadFirmwareFromUrl(BLE_FW.lpc),
      loadFirmwareFromUrl(BLE_FW.softdevice),
      loadFirmwareFromUrl(BLE_FW.radio),
    ]);
    return createBLEFirmwareSet(lpc, softdevice, radio);
  }

  private async loadBundledProductionFirmware() {
    logger.info('Loading bundled production firmware...');
    const [lpc, bootloader, radio] = await Promise.all([
      loadFirmwareFromUrl(PROD_FW.lpc),
      loadFirmwareFromUrl(PROD_FW.bootloader),
      loadFirmwareFromUrl(PROD_FW.radio),
    ]);
    return createProductionFirmwareSet(lpc, bootloader, radio);
  }

  /**
   * Show a reconnect overlay with a button. WebHID requires a user gesture
   * to grant permission for a device with a new PID after mode switch.
   */
  private promptReconnect(targetPid: number): Promise<void> {
    return new Promise((resolve) => {
      const modeName = targetPid === 0x1002 ? 'bootloader' : 'normal';

      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed; inset: 0; background: rgba(0,0,0,0.7);
        display: flex; align-items: center; justify-content: center; z-index: 1000;
      `;

      const dialog = document.createElement('div');
      dialog.style.cssText = `
        background: var(--bg-card); border: 1px solid var(--border);
        border-radius: 12px; padding: 24px; text-align: center; max-width: 400px;
      `;

      const msg = document.createElement('p');
      msg.style.marginBottom = '16px';
      msg.textContent = `Controller rebooted into ${modeName} mode. Click below to reconnect.`;

      const btn = document.createElement('button');
      btn.className = 'btn-primary';
      btn.textContent = `Reconnect (${modeName})`;
      btn.style.fontSize = '1rem';
      btn.style.padding = '12px 24px';
      btn.addEventListener('click', async () => {
        try {
          await navigator.hid.requestDevice({
            filters: [{ vendorId: VALVE_VID, productId: targetPid }],
          });
          overlay.remove();
          resolve();
        } catch (e) {
          logger.error(`Reconnect failed: ${e}`);
        }
      });

      dialog.appendChild(msg);
      dialog.appendChild(btn);
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);
    });
  }

  private async loadCustomFirmware(mode: 'ble' | 'production') {
    logger.info('Loading custom firmware files...');
    const [lpc, softdevice, radio] = await Promise.all([
      loadFirmwareFromFile(this.flashPanel.lpcFile!),
      loadFirmwareFromFile(this.flashPanel.softdeviceFile!),
      loadFirmwareFromFile(this.flashPanel.radioFile!),
    ]);
    return mode === 'ble'
      ? createBLEFirmwareSet(lpc, softdevice, radio)
      : createProductionFirmwareSet(lpc, softdevice, radio);
  }
}
