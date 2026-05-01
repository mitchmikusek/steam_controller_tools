import { SCProtocolId } from './constants.js';
import { DeviceBase, delay } from './device-base.js';
import { computeChecksum } from './checksum.js';
import type { HIDTransport } from './hid-transport.js';

const LPC_CHUNK_SIZE = 0x32; // 50 bytes per chunk
const LPC_DATA_OFFSET = 0x2000; // Firmware data starts at this offset
const LPC_CHECKSUM_OFFSET = 0x2030; // Checksum computed from this offset

export type ProgressCallback = (phase: string, percent: number) => void;

export class BootloaderDevice extends DeviceBase {
  constructor(transport: HIDTransport) {
    super(transport);
  }

  async eraseFirmware(): Promise<void> {
    await this.send([SCProtocolId.EraseLPCFirmware]);
    await delay(100);
    const response = await this.get();
    this.expect(response, [0x94, 0x02]);
  }

  async flashFirmware(data: ArrayBuffer, onProgress?: ProgressCallback): Promise<void> {
    const bytes = new Uint8Array(data);
    const start = LPC_DATA_OFFSET;
    const totalChunks = Math.ceil((bytes.byteLength - start) / LPC_CHUNK_SIZE);

    for (let i = 0; i < totalChunks; i++) {
      const offset = start + i * LPC_CHUNK_SIZE;
      const end = Math.min(offset + LPC_CHUNK_SIZE, bytes.byteLength);
      const chunk = bytes.slice(offset, end);

      const payload: number[] = [SCProtocolId.FlashLPCFirmware, chunk.length];
      payload.push(...chunk);
      await this.send(payload);

      onProgress?.('Flashing LPC', Math.round(((i + 1) / totalChunks) * 100));
    }
    await delay(200);
  }

  async verifyFirmware(data: ArrayBuffer): Promise<void> {
    const checksum = computeChecksum(data, LPC_CHECKSUM_OFFSET);
    const payload: number[] = [SCProtocolId.VerifyLPCFirmware, 0x10];
    payload.push(...checksum);
    await this.send(payload);
    await delay(1000);
    const response = await this.get();
    try {
      this.expect(response, [0x94, 0x02, 0x00]);
    } catch {
      throw new Error('Firmware checksum verification failed');
    }
  }

  async rebootToFirmware(): Promise<void> {
    await this.resetSOC();
  }
}
