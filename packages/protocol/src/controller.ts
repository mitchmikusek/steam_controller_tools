import { SCProtocolId, BOOTLOADER_MAGIC } from './constants.js';
import { DeviceBase, delay } from './device-base.js';
import type { HIDTransport } from './hid-transport.js';
import type { ProgressCallback } from './bootloader.js';

const SWD_CHUNK_SIZE = 0x38; // 56 bytes per chunk

export interface ControllerInfo {
  usbPid: number;
  bootloaderRev: number;
  firmwareRev: number;
  radioRev: number;
}

export class ControllerDevice extends DeviceBase {
  constructor(transport: HIDTransport) {
    super(transport);
  }

  async info(): Promise<ControllerInfo> {
    await this.send([SCProtocolId.ControllerInfoRequest]);
    const response = await this.get();
    this.expect(response, [0x83]);

    // Parse struct: <BBIHHIIIBIBI (12 fields, little-endian, packed)
    // Offset 0:  protoId      (B, 1 byte)
    // Offset 1:  unk1         (B, 1 byte)
    // Offset 2:  unk2         (I, 4 bytes)
    // Offset 6:  unk3         (H, 2 bytes)
    // Offset 8:  usb_pid      (H, 2 bytes)
    // Offset 10: unk4         (I, 4 bytes)
    // Offset 14: unk5         (I, 4 bytes)
    // Offset 18: bootloaderRev(I, 4 bytes)
    // Offset 22: unk7         (B, 1 byte)
    // Offset 23: firmwareRev  (I, 4 bytes)
    // Offset 27: sep5         (B, 1 byte)
    // Offset 28: radioRev     (I, 4 bytes)
    const view = new DataView(response.buffer, response.byteOffset, response.byteLength);
    const usbPid = view.getUint16(8, true);
    const bootloaderRev = view.getUint32(18, true);
    const firmwareRev = view.getUint32(23, true);
    const radioRev = view.getUint32(28, true);

    return { usbPid, bootloaderRev, firmwareRev, radioRev };
  }

  async rebootToBootloader(): Promise<void> {
    await this.resetSOC(BOOTLOADER_MAGIC);
  }

  // --- SWD (Serial Wire Debug) operations for nRF51822 radio chip ---

  async swdStart(timeoutMs = 15000): Promise<void> {
    await this.send([SCProtocolId.SendIRCode, 0x04, 0x17, 0xed, 0xfe, 0xd0]);
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const response = await this.get();
      // Check for ready pattern
      if (this.matchesPattern(response, [0x94, 0x06, 0x00, 0x00, 0xfc, 0x03])) break;
      // Any other 0x94 response means still working — keep polling
      if (response[0] === 0x94) {
        await delay(100);
        continue;
      }
      throw new Error(`SWD start unexpected response: [${this.hexBytes(response)}]`);
    }
  }

  async swdErase(timeoutMs = 15000): Promise<void> {
    await this.send([SCProtocolId.SWDErase]);
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const response = await this.get();
      // Check for complete pattern
      if (this.matchesPattern(response, [0x94, 0x06, 0x00, 0x00, 0x01, 0x00])) break;
      // Any other 0x94 response means still working
      if (response[0] === 0x94) {
        await delay(100);
        continue;
      }
      throw new Error(`SWD erase unexpected response: [${this.hexBytes(response)}]`);
    }
  }

  async swdFlash(data: ArrayBuffer, startAddress: number, onProgress?: ProgressCallback): Promise<void> {
    const bytes = new Uint8Array(data);
    const totalChunks = Math.ceil(bytes.byteLength / SWD_CHUNK_SIZE);

    for (let i = 0; i < totalChunks; i++) {
      const offset = i * SWD_CHUNK_SIZE;
      const end = Math.min(offset + SWD_CHUNK_SIZE, bytes.byteLength);
      const chunk = bytes.slice(offset, end);

      const address = i * SWD_CHUNK_SIZE + startAddress;
      const addrBytes = [address & 0xff, (address >> 8) & 0xff, (address >> 16) & 0xff, (address >> 24) & 0xff];

      const payload: number[] = [SCProtocolId.FlashSWD, chunk.length + 4];
      payload.push(...addrBytes);
      payload.push(...chunk);
      await this.send(payload);

      // Poll until device acknowledges the chunk. Tolerates non-SWD responses
      // (tab throttling, stale reads) by retrying immediately. A genuine USB
      // disconnect will throw from receiveFeatureReport. 5-minute safety timeout
      // catches cases where another app (Steam/game) holds the controller.
      const deadline = Date.now() + 300000;
      for (;;) {
        const response = await this.get();
        if (this.matchesPattern(response, [0x94, 0x06, 0x00, 0x00, 0x60, 0x09])) break;
        if (response[0] === 0x94) await delay(10);
        if (Date.now() > deadline) {
          throw new Error('Flashing timed out — close Steam and any games, then try again');
        }
      }

      onProgress?.('Flashing radio', Math.round(((i + 1) / totalChunks) * 100));
    }
  }

  async swdSave(): Promise<void> {
    await this.send([SCProtocolId.SWDSave]);
  }

  // --- Helpers ---

  private matchesPattern(response: Uint8Array, pattern: number[]): boolean {
    for (let i = 0; i < pattern.length; i++) {
      if (i >= response.length || response[i] !== pattern[i]) return false;
    }
    return true;
  }

  private hexBytes(data: Uint8Array, count = 8): string {
    return Array.from(data.slice(0, count))
      .map((b) => '0x' + b.toString(16).padStart(2, '0'))
      .join(', ');
  }

  // --- Fun extras ---

  async hapticPulse(side: 'left' | 'right', highDuration: number, lowDuration: number, repeat: number): Promise<void> {
    const sideVal = side === 'left' ? 1 : 0;
    await this.send([
      SCProtocolId.TriggerHapticPulse,
      0x07,
      sideVal,
      highDuration & 0xff,
      (highDuration >> 8) & 0xff,
      lowDuration & 0xff,
      (lowDuration >> 8) & 0xff,
      repeat & 0xff,
      (repeat >> 8) & 0xff,
    ]);
  }

  async playJingle(index?: number): Promise<void> {
    if (index !== undefined) {
      // Must be in personalise mode to play by index
      await this.enterPersonaliseMode();
      await this.send([SCProtocolId.PlayAudio, 0x04, index]);
    } else {
      await this.send([SCProtocolId.PlayAudio]);
    }
  }

  async enterPersonaliseMode(): Promise<void> {
    await this.send([
      SCProtocolId.SetPersonalise,
      0x10,
      0x00,
      0x01,
      0x02,
      0x03,
      0x04,
      0x05,
      0x06,
      0x07,
      0x08,
      0x09,
      0x0a,
      0x0b,
      0x0c,
      0x0d,
      0x0e,
      0x0f,
    ]);
  }

  async setBrightness(brightness: number): Promise<void> {
    const val = Math.max(0, Math.min(100, brightness));
    await this.send([SCProtocolId.SetSettings, 0x03, 0x2d, val]);
  }

  async resetSettings(): Promise<void> {
    await this.send([SCProtocolId.ResetControllerMappings]);
    await this.send([SCProtocolId.SetSettingsDefaultValues]);
    await this.send([SCProtocolId.SetSettings, 0x03, 0x18, 0x01]);
  }

  async factoryReset(): Promise<void> {
    await this.send([SCProtocolId.FactoryReset]);
  }

  async turnOff(): Promise<void> {
    await this.send([SCProtocolId.TurnOffController]);
  }
}
