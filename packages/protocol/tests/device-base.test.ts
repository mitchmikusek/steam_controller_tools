import { describe, it, expect } from 'vitest';
import { DeviceBase } from '../src/device-base.js';
import { MockHIDTransport } from '../src/hid-transport.js';
import { REPORT_SIZE } from '../src/constants.js';

describe('DeviceBase', () => {
  describe('send()', () => {
    it('sends a 64-byte buffer with data placed at the start', async () => {
      const transport = new MockHIDTransport();
      const device = new DeviceBase(transport);

      await device.send([0x83, 0x01, 0x02]);

      expect(transport.sent).toHaveLength(1);
      const sent = transport.sent[0];
      expect(sent.byteLength).toBe(REPORT_SIZE);
      expect(sent[0]).toBe(0x83);
      expect(sent[1]).toBe(0x01);
      expect(sent[2]).toBe(0x02);
      // Rest should be zero-filled
      for (let i = 3; i < REPORT_SIZE; i++) {
        expect(sent[i]).toBe(0);
      }
    });

    it('truncates data that exceeds REPORT_SIZE', async () => {
      const transport = new MockHIDTransport();
      const device = new DeviceBase(transport);
      const longData = new Array(100).fill(0xab);

      await device.send(longData);

      const sent = transport.sent[0];
      expect(sent.byteLength).toBe(REPORT_SIZE);
      // Only first 64 bytes should be copied
      for (let i = 0; i < REPORT_SIZE; i++) {
        expect(sent[i]).toBe(0xab);
      }
    });
  });

  describe('get()', () => {
    it('returns immediate non-zero response', async () => {
      const transport = new MockHIDTransport();
      const device = new DeviceBase(transport);
      transport.queueResponse([0x83, 0x01, 0x02, 0x03]);

      const result = await device.get(5, 0);

      expect(result[0]).toBe(0x83);
      expect(result[1]).toBe(0x01);
      expect(result[2]).toBe(0x02);
      expect(result[3]).toBe(0x03);
    });

    it('retries on all-zero response and returns valid data', async () => {
      const transport = new MockHIDTransport();
      const device = new DeviceBase(transport);

      // Queue two all-zero responses followed by a valid one
      transport.queueResponse(new Array(64).fill(0));
      transport.queueResponse(new Array(64).fill(0));
      transport.queueResponse([0x94, 0x02, 0x00]);

      const result = await device.get(5, 0);
      expect(result[0]).toBe(0x94);
      expect(result[1]).toBe(0x02);
    });

    it('returns all-zero buffer when max retries exhausted', async () => {
      const transport = new MockHIDTransport();
      const device = new DeviceBase(transport);

      // No responses queued — MockHIDTransport returns empty DataView (64 zeros)
      const result = await device.get(3, 0);
      expect(result.byteLength).toBe(REPORT_SIZE);
      expect(result.every(b => b === 0)).toBe(true);
    });
  });

  describe('expect()', () => {
    it('returns 0 when response matches the first pattern', () => {
      const transport = new MockHIDTransport();
      const device = new DeviceBase(transport);
      const response = new Uint8Array([0x83, 0x01, 0x02, 0x03]);

      const index = device.expect(response, [0x83, 0x01]);
      expect(index).toBe(0);
    });

    it('returns 1 when response matches the second pattern', () => {
      const transport = new MockHIDTransport();
      const device = new DeviceBase(transport);
      const response = new Uint8Array([0x94, 0x02, 0x00]);

      const index = device.expect(response, [0x83], [0x94, 0x02]);
      expect(index).toBe(1);
    });

    it('throws when no pattern matches', () => {
      const transport = new MockHIDTransport();
      const device = new DeviceBase(transport);
      const response = new Uint8Array([0xff, 0xee]);

      expect(() => device.expect(response, [0x83], [0x94])).toThrow('Unexpected response');
    });
  });
});
