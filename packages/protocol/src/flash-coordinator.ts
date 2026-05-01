import { VALVE_VID, CONTROLLER_PID, BOOTLOADER_PID } from './constants.js';
import { delay } from './device-base.js';
import { ControllerDevice, type ControllerInfo } from './controller.js';
import { BootloaderDevice } from './bootloader.js';
import { WebHIDTransport } from './webhid-transport.js';
import type { FirmwareSet } from './firmware.js';

export interface FlashProgress {
  phase: string;
  percent: number;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type ProgressHandler = (progress: FlashProgress) => void;
export type LogHandler = (level: LogLevel, message: string) => void;

/**
 * Called when the coordinator needs the user to grant permission for a
 * re-enumerated device (different PID after mode switch).
 * The UI should show a button and resolve the promise when the user clicks it.
 */
export type ReconnectPromptHandler = (targetPid: number) => Promise<void>;

type DeviceMode = 'normal' | 'bootloader' | 'disconnected';

export class FlashCoordinator {
  private transport: WebHIDTransport;
  private controller: ControllerDevice | null = null;
  private bootloader: BootloaderDevice | null = null;
  private mode: DeviceMode = 'disconnected';

  onProgress: ProgressHandler = () => {};
  onLog: LogHandler = () => {};
  onReconnectNeeded: ReconnectPromptHandler = async () => {};

  constructor() {
    this.transport = new WebHIDTransport();
  }

  get currentMode(): DeviceMode {
    return this.mode;
  }

  get isConnected(): boolean {
    return this.mode !== 'disconnected';
  }

  /**
   * Connect to the Steam Controller. Prompts user to select device.
   * Requests permission for both normal and bootloader PIDs.
   */
  async connect(): Promise<DeviceMode> {
    this.log('info', 'Requesting device access...');

    // Request permission for both PIDs
    await WebHIDTransport.requestBothDevices();

    // Try to find and connect to whichever device is present
    let device = await WebHIDTransport.findDevice(CONTROLLER_PID);
    if (device) {
      await this.transport.openDevice(device);
      this.controller = new ControllerDevice(this.transport);
      this.mode = 'normal';
      this.log('info', 'Connected in normal mode');
      return 'normal';
    }

    device = await WebHIDTransport.findDevice(BOOTLOADER_PID);
    if (device) {
      await this.transport.openDevice(device);
      this.bootloader = new BootloaderDevice(this.transport);
      this.mode = 'bootloader';
      this.log('info', 'Connected in bootloader mode');
      return 'bootloader';
    }

    throw new Error('No Steam Controller found. Is it plugged in via USB?');
  }

  async disconnect(): Promise<void> {
    await this.transport.close();
    this.controller = null;
    this.bootloader = null;
    this.mode = 'disconnected';
    this.log('info', 'Disconnected');
  }

  async getInfo(): Promise<ControllerInfo | null> {
    if (this.mode !== 'normal' || !this.controller) {
      this.log('warn', 'Cannot get info: not in normal mode');
      return null;
    }
    const info = await this.controller.info();
    this.log('info', `Firmware: ${this.formatTimestamp(info.firmwareRev)}`);
    this.log('info', `Radio: ${this.formatTimestamp(info.radioRev)}`);
    this.log('info', `Bootloader: ${this.formatTimestamp(info.bootloaderRev)}`);
    return info;
  }

  /**
   * Flash BLE firmware. Sequence:
   * 1. Flash LPC firmware (bootloader mode) — needed first for SWD support
   * 2. Flash radio firmware via SWD (normal mode)
   */
  async flashBLE(fw: FirmwareSet): Promise<void> {
    // Step 1: Switch to bootloader mode if needed
    if (this.mode === 'normal') {
      this.log('info', 'Rebooting to bootloader...');
      await this.controller!.rebootToBootloader();
      await this.transport.close();
      this.controller = null;
      await this.waitForDevice(BOOTLOADER_PID);
      this.bootloader = new BootloaderDevice(this.transport);
      this.mode = 'bootloader';
    }

    if (!this.bootloader) throw new Error('Not in bootloader mode');

    // Step 2: Flash LPC firmware
    this.log('info', 'Erasing LPC firmware...');
    this.progress('Erasing LPC', 0);
    await this.bootloader.eraseFirmware();

    this.log('info', 'Flashing LPC firmware...');
    await this.bootloader.flashFirmware(fw.lpc, (phase, pct) => this.progress(phase, pct));

    this.log('info', 'Verifying LPC firmware...');
    this.progress('Verifying', 100);
    await this.bootloader.verifyFirmware(fw.lpc);

    // Step 3: Reboot to normal mode
    this.log('info', 'Rebooting to firmware mode...');
    await this.bootloader.rebootToFirmware();
    await this.transport.close();
    this.bootloader = null;

    this.log('info', 'Waiting for reboot...');
    await delay(4000);

    await this.waitForDevice(CONTROLLER_PID);
    this.controller = new ControllerDevice(this.transport);
    this.mode = 'normal';

    // Step 4: Flash radio firmware via SWD
    this.log('info', 'Starting SWD interface...');
    this.progress('SWD Start', 0);
    await this.controller.swdStart();

    this.log('info', 'Erasing radio firmware...');
    this.progress('Erasing radio', 0);
    await this.controller.swdErase();

    this.log('info', 'Flashing SoftDevice...');
    await this.controller.swdFlash(fw.softdevice, 0, (_phase, pct) =>
      this.progress('Flashing SoftDevice', pct),
    );

    this.log('info', 'Flashing radio application...');
    await this.controller.swdFlash(fw.radioApp, fw.radioAppOffset, (phase, pct) =>
      this.progress(phase, pct),
    );

    this.log('info', 'Saving radio firmware...');
    await this.controller.swdSave();

    this.log('info', 'Resetting controller...');
    await this.controller.resetSOC();

    this.progress('Complete', 100);
    this.log('info', 'BLE firmware flash complete!');
  }

  /**
   * Flash production (non-BLE) firmware. Sequence:
   * 1. Flash radio firmware via SWD (normal mode)
   * 2. Wait 4s
   * 3. Flash LPC firmware (bootloader mode)
   */
  async flashProduction(fw: FirmwareSet): Promise<void> {
    // Step 1: Ensure normal mode for SWD
    // SWD requires a working LPC firmware. If we're in bootloader mode,
    // we need to flash BLE LPC first (it has SWD support), reboot, do SWD,
    // then flash production LPC last.
    if (this.mode === 'bootloader') {
      this.log('info', 'In bootloader mode — flashing BLE LPC first for SWD support...');
      this.progress('Erasing LPC', 0);
      await this.bootloader!.eraseFirmware();
      // Use BLE LPC firmware temporarily for SWD support
      const bleLpc = await (await fetch('fw_images/ble/vcf_wired_controller_d0g_5b0f21bd.bin')).arrayBuffer();
      await this.bootloader!.flashFirmware(bleLpc, (phase, pct) => this.progress(phase, pct));
      this.log('info', 'Verifying temporary LPC firmware...');
      await this.bootloader!.verifyFirmware(bleLpc);
      this.log('info', 'Rebooting to firmware mode...');
      await this.bootloader!.rebootToFirmware();
      await this.transport.close();
      this.bootloader = null;
      await this.waitForDevice(CONTROLLER_PID);
      this.controller = new ControllerDevice(this.transport);
      this.mode = 'normal';
    }

    if (!this.controller) throw new Error('Not in normal mode');

    // Step 2: Flash radio firmware via SWD
    this.log('info', 'Starting SWD interface...');
    this.progress('SWD Start', 0);
    await this.controller.swdStart();

    this.log('info', 'Erasing radio firmware...');
    this.progress('Erasing radio', 0);
    await this.controller.swdErase();

    this.log('info', 'Flashing bootloader...');
    await this.controller.swdFlash(fw.softdevice, 0, (phase, pct) =>
      this.progress('Flashing bootloader', pct),
    );

    this.log('info', 'Flashing radio module...');
    await this.controller.swdFlash(fw.radioApp, fw.radioAppOffset, (phase, pct) =>
      this.progress(phase, pct),
    );

    this.log('info', 'Saving radio firmware...');
    await this.controller.swdSave();

    // Step 3: Switch to bootloader for LPC flash
    this.log('info', 'Rebooting to bootloader...');
    await this.controller.rebootToBootloader();
    await this.transport.close();
    this.controller = null;

    this.log('info', 'Waiting for bootloader...');
    await this.waitForDevice(BOOTLOADER_PID);
    this.bootloader = new BootloaderDevice(this.transport);
    this.mode = 'bootloader';

    // Step 4: Flash LPC firmware
    this.log('info', 'Erasing LPC firmware...');
    this.progress('Erasing LPC', 0);
    await this.bootloader.eraseFirmware();

    this.log('info', 'Flashing LPC firmware...');
    await this.bootloader.flashFirmware(fw.lpc, (phase, pct) => this.progress(phase, pct));

    this.log('info', 'Verifying LPC firmware...');
    this.progress('Verifying', 100);
    await this.bootloader.verifyFirmware(fw.lpc);

    this.log('info', 'Rebooting to firmware mode...');
    await this.bootloader.rebootToFirmware();
    await this.transport.close();
    this.bootloader = null;

    await delay(2000);
    await this.waitForDevice(CONTROLLER_PID);
    this.controller = new ControllerDevice(this.transport);
    this.mode = 'normal';

    this.progress('Complete', 100);
    this.log('info', 'Production firmware flash complete!');
  }

  /**
   * Get the controller device for extras (haptics, jingles, etc).
   * Only available in normal mode.
   */
  getController(): ControllerDevice | null {
    return this.mode === 'normal' ? this.controller : null;
  }

  // --- Internal helpers ---

  private async waitForDevice(targetPid: number): Promise<void> {
    this.log('info', `Reconnecting to device PID 0x${targetPid.toString(16)}...`);

    // Mode switch changes PID — WebHID always requires fresh user permission.
    // Go straight to the reconnect prompt.
    await this.onReconnectNeeded(targetPid);

    // After the user grants permission, find and open the device
    await delay(500);
    const device = await WebHIDTransport.findDevice(targetPid);
    if (device) {
      await this.transport.openDevice(device);
      this.log('info', 'Device reconnected');
      return;
    }

    // Last resort: try opening directly by PID
    await this.transport.open(VALVE_VID, targetPid);
    this.log('info', 'Device opened via direct request');
  }

  private progress(phase: string, percent: number): void {
    this.onProgress({ phase, percent });
  }

  private log(level: LogLevel, message: string): void {
    this.onLog(level, message);
  }

  private formatTimestamp(ts: number): string {
    if (ts === 0) return 'N/A';
    return new Date(ts * 1000).toLocaleString();
  }
}
