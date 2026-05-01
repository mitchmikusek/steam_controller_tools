import { REPORT_ID, REPORT_SIZE } from './constants.js';
import type { HIDTransport } from './hid-transport.js';

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class DeviceBase {
  constructor(protected transport: HIDTransport) {}

  async send(data: number[]): Promise<void> {
    const buf = new Uint8Array(REPORT_SIZE);
    for (let i = 0; i < data.length && i < REPORT_SIZE; i++) {
      buf[i] = data[i];
    }
    await this.transport.sendFeatureReport(REPORT_ID, buf);
  }

  async get(maxRetries = 15, retryDelayMs = 100): Promise<Uint8Array> {
    for (let i = 0; i < maxRetries; i++) {
      const view = await this.transport.receiveFeatureReport(REPORT_ID);
      if (view.byteLength > 0) {
        const arr = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
        // Check if response is non-empty (not all zeros)
        if (arr.some(b => b !== 0)) {
          return arr;
        }
      }
      await delay(retryDelayMs);
    }
    return new Uint8Array(REPORT_SIZE);
  }

  /**
   * Match response bytes against one or more expected patterns.
   * Returns the index of the first matching pattern, or throws.
   */
  expect(response: Uint8Array, ...patterns: number[][]): number {
    for (let pi = 0; pi < patterns.length; pi++) {
      const pattern = patterns[pi];
      let match = true;
      for (let i = 0; i < pattern.length; i++) {
        if (i >= response.length || response[i] !== pattern[i]) {
          match = false;
          break;
        }
      }
      if (match) return pi;
    }
    throw new Error(
      `Unexpected response: [${Array.from(response.slice(0, 8)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(', ')}...]`
    );
  }

  async resetSOC(data?: number[]): Promise<void> {
    const payload = [0x95]; // SCProtocolId.ResetSOC
    if (data) payload.push(...data);
    await this.send(payload);
  }
}

export { delay };
