import { describe, it, expect, vi } from 'vitest';
import { BootloaderDevice } from '../src/bootloader.js';
import { MockHIDTransport } from '../src/hid-transport.js';
import { SCProtocolId } from '../src/constants.js';
import { makeEraseResponse, makeVerifySuccessResponse, makeVerifyFailResponse } from './fixtures/mock-responses.js';

describe('BootloaderDevice', () => {
  describe('eraseFirmware()', () => {
    it('succeeds when erase response is received', async () => {
      const transport = new MockHIDTransport();
      const bootloader = new BootloaderDevice(transport);

      transport.queueResponse(makeEraseResponse());

      await expect(bootloader.eraseFirmware()).resolves.toBeUndefined();

      // Verify the erase command was sent
      expect(transport.sent[0][0]).toBe(SCProtocolId.EraseLPCFirmware);
    });

    it('throws when response does not match erase pattern', async () => {
      const transport = new MockHIDTransport();
      const bootloader = new BootloaderDevice(transport);

      // Bad response
      const badResponse = new Array(64).fill(0);
      badResponse[0] = 0xff;
      badResponse[1] = 0x01;
      transport.queueResponse(badResponse);

      await expect(bootloader.eraseFirmware()).rejects.toThrow('Unexpected response');
    });
  });

  describe('flashFirmware()', () => {
    it('sends chunks starting at offset 0x2000 with chunk size 0x32', async () => {
      const transport = new MockHIDTransport();
      const bootloader = new BootloaderDevice(transport);

      // Create firmware data: 0x2000 header + 100 bytes of payload (2 chunks of 0x32)
      const fwSize = 0x2000 + 100;
      const firmware = new ArrayBuffer(fwSize);
      const view = new Uint8Array(firmware);
      // Fill payload area with known pattern
      for (let i = 0x2000; i < fwSize; i++) {
        view[i] = (i - 0x2000) & 0xff;
      }

      await bootloader.flashFirmware(firmware);

      // 100 bytes / 50 (0x32) = 2 chunks
      expect(transport.sent).toHaveLength(2);

      // First chunk
      const first = transport.sent[0];
      expect(first[0]).toBe(SCProtocolId.FlashLPCFirmware);
      expect(first[1]).toBe(0x32); // chunk size
      // First payload byte should be 0 (start of data after 0x2000 offset)
      expect(first[2]).toBe(0x00);

      // Second chunk
      const second = transport.sent[1];
      expect(second[0]).toBe(SCProtocolId.FlashLPCFirmware);
      expect(second[1]).toBe(0x32); // full second chunk
      // First byte of second chunk is byte 50 of payload
      expect(second[2]).toBe(50);
    });

    it('calls progress callback with increasing percentage', async () => {
      const transport = new MockHIDTransport();
      const bootloader = new BootloaderDevice(transport);

      // 0x2000 header + 150 bytes = 3 chunks
      const fwSize = 0x2000 + 150;
      const firmware = new ArrayBuffer(fwSize);

      const progressCalls: [string, number][] = [];
      const onProgress = (phase: string, percent: number) => {
        progressCalls.push([phase, percent]);
      };

      await bootloader.flashFirmware(firmware, onProgress);

      expect(progressCalls).toHaveLength(3);
      expect(progressCalls[0][0]).toBe('Flashing LPC');
      expect(progressCalls[0][1]).toBe(33);  // ~1/3
      expect(progressCalls[1][1]).toBe(67);  // ~2/3
      expect(progressCalls[2][1]).toBe(100); // 3/3
    });

    it('handles firmware that results in a partial last chunk', async () => {
      const transport = new MockHIDTransport();
      const bootloader = new BootloaderDevice(transport);

      // 0x2000 header + 60 bytes = 1 full chunk (50) + 1 partial chunk (10)
      const fwSize = 0x2000 + 60;
      const firmware = new ArrayBuffer(fwSize);

      await bootloader.flashFirmware(firmware);

      expect(transport.sent).toHaveLength(2);
      // Second chunk should be 10 bytes
      expect(transport.sent[1][1]).toBe(10);
    });
  });

  describe('verifyFirmware()', () => {
    it('succeeds when verify success response is received', async () => {
      const transport = new MockHIDTransport();
      const bootloader = new BootloaderDevice(transport);

      // Create firmware large enough to compute checksum (need at least 0x2030 + 16 bytes)
      const fwSize = 0x2030 + 32;
      const firmware = new ArrayBuffer(fwSize);
      const view = new Uint8Array(firmware);
      for (let i = 0; i < fwSize; i++) view[i] = i & 0xff;

      transport.queueResponse(makeVerifySuccessResponse());

      await expect(bootloader.verifyFirmware(firmware)).resolves.toBeUndefined();

      // Verify the command was sent with correct protocol ID
      expect(transport.sent[0][0]).toBe(SCProtocolId.VerifyLPCFirmware);
      // Length byte should be 0x10 (16 bytes of checksum)
      expect(transport.sent[0][1]).toBe(0x10);
    });

    it('throws when verify fail response is received', async () => {
      const transport = new MockHIDTransport();
      const bootloader = new BootloaderDevice(transport);

      const fwSize = 0x2030 + 32;
      const firmware = new ArrayBuffer(fwSize);
      const view = new Uint8Array(firmware);
      for (let i = 0; i < fwSize; i++) view[i] = i & 0xff;

      transport.queueResponse(makeVerifyFailResponse());

      await expect(bootloader.verifyFirmware(firmware)).rejects.toThrow(
        'Firmware checksum verification failed'
      );
    });

    it('sends the computed checksum bytes in the payload', async () => {
      const transport = new MockHIDTransport();
      const bootloader = new BootloaderDevice(transport);

      const fwSize = 0x2030 + 32;
      const firmware = new ArrayBuffer(fwSize);
      const view = new Uint8Array(firmware);
      for (let i = 0; i < fwSize; i++) view[i] = (i * 3) & 0xff;

      transport.queueResponse(makeVerifySuccessResponse());

      await bootloader.verifyFirmware(firmware);

      // Payload should be [protocolId, 0x10, ...16 checksum bytes]
      const sent = transport.sent[0];
      expect(sent[0]).toBe(SCProtocolId.VerifyLPCFirmware);
      expect(sent[1]).toBe(0x10);
      // The remaining 16 bytes should be the checksum (non-trivial check: just ensure they exist)
      const checksumBytes = Array.from(sent.slice(2, 18));
      expect(checksumBytes).toHaveLength(16);
      // At least some bytes should be non-zero for non-trivial firmware
      expect(checksumBytes.some(b => b !== 0)).toBe(true);
    });
  });
});
