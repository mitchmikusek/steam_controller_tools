import { describe, it, expect, vi } from 'vitest';
import { BootloaderDevice } from '../src/bootloader.js';
import { ControllerDevice } from '../src/controller.js';
import { MockHIDTransport } from '../src/hid-transport.js';
import { createBLEFirmwareSet, createProductionFirmwareSet } from '../src/firmware.js';
import { SCProtocolId, REPORT_SIZE } from '../src/constants.js';
import {
  makeEraseResponse,
  makeVerifySuccessResponse,
  makeInfoResponse,
  makeSwdReadyResponse,
} from './fixtures/mock-responses.js';

/**
 * End-to-end flash sequence tests.
 *
 * These tests exercise the full firmware flashing pipeline through
 * BootloaderDevice and ControllerDevice using MockHIDTransport,
 * verifying command sequences, progress callbacks, and state transitions.
 */

// Create minimal but valid firmware buffers
function makeFirmware(size: number, fill = 0xaa): ArrayBuffer {
  const buf = new ArrayBuffer(size);
  new Uint8Array(buf).fill(fill);
  return buf;
}

// SWD erase complete response: [0x94, 0x06, 0x00, 0x00, 0x01, 0x00]
function makeSwdEraseCompleteResponse(): number[] {
  const buf = new Array(REPORT_SIZE).fill(0);
  buf[0] = 0x94;
  buf[1] = 0x06;
  buf[2] = 0x00;
  buf[3] = 0x00;
  buf[4] = 0x01;
  buf[5] = 0x00;
  return buf;
}

// SWD flash chunk ready response: [0x94, 0x06, 0x00, 0x00, 0x60, 0x09]
function makeSwdFlashReadyResponse(): number[] {
  const buf = new Array(REPORT_SIZE).fill(0);
  buf[0] = 0x94;
  buf[1] = 0x06;
  buf[2] = 0x00;
  buf[3] = 0x00;
  buf[4] = 0x60;
  buf[5] = 0x09;
  return buf;
}

describe('BLE flash sequence (e2e)', () => {
  it('executes full LPC erase → flash → verify cycle', async () => {
    const transport = new MockHIDTransport();
    const bootloader = new BootloaderDevice(transport);

    // Firmware: 0x2000 header + 100 bytes payload = 2 chunks
    const firmware = makeFirmware(0x2000 + 100);

    // Queue responses: erase ack, then verify success
    transport.queueResponse(makeEraseResponse());
    transport.queueResponse(makeVerifySuccessResponse());

    const progress: [string, number][] = [];
    const onProgress = (phase: string, pct: number) => progress.push([phase, pct]);

    // Step 1: Erase
    await bootloader.eraseFirmware();
    expect(transport.sent[0][0]).toBe(SCProtocolId.EraseLPCFirmware);

    // Step 2: Flash
    await bootloader.flashFirmware(firmware, onProgress);
    // 100 bytes / 50 per chunk = 2 chunks
    const flashCommands = transport.sent.filter(s => s[0] === SCProtocolId.FlashLPCFirmware);
    expect(flashCommands).toHaveLength(2);
    expect(progress).toHaveLength(2);
    expect(progress[0][0]).toBe('Flashing LPC');
    expect(progress[1][1]).toBe(100);

    // Step 3: Verify
    await bootloader.verifyFirmware(firmware);
    const verifyCmd = transport.sent.find(s => s[0] === SCProtocolId.VerifyLPCFirmware);
    expect(verifyCmd).toBeDefined();
    expect(verifyCmd![1]).toBe(0x10); // 16-byte checksum
  });

  it('rejects firmware with bad checksum on verify', async () => {
    const transport = new MockHIDTransport();
    const bootloader = new BootloaderDevice(transport);

    const firmware = makeFirmware(0x2030 + 32);

    // Queue verify failure response
    const failResponse = new Array(REPORT_SIZE).fill(0);
    failResponse[0] = 0x94;
    failResponse[1] = 0x02;
    failResponse[2] = 0x01;
    transport.queueResponse(failResponse);

    await expect(bootloader.verifyFirmware(firmware)).rejects.toThrow(
      'Firmware checksum verification failed',
    );
  });
});

describe('SWD radio flash sequence (e2e)', () => {
  it('executes SWD start → erase → flash → save cycle', async () => {
    const transport = new MockHIDTransport();
    const controller = new ControllerDevice(transport);

    // Small radio firmware: 112 bytes = 2 SWD chunks (56 bytes each)
    const radioFirmware = makeFirmware(112, 0xbb);

    // Queue responses for: swdStart (ready), swdErase (complete), 2x flash chunk ready
    transport.queueResponse(makeSwdReadyResponse());
    transport.queueResponse(makeSwdEraseCompleteResponse());
    transport.queueResponse(makeSwdFlashReadyResponse());
    transport.queueResponse(makeSwdFlashReadyResponse());

    const progress: [string, number][] = [];

    // SWD Start
    await controller.swdStart();
    expect(transport.sent[0][0]).toBe(SCProtocolId.SendIRCode);

    // SWD Erase
    await controller.swdErase();
    expect(transport.sent[1][0]).toBe(SCProtocolId.SWDErase);

    // SWD Flash
    await controller.swdFlash(radioFirmware, 0, (phase, pct) => progress.push([phase, pct]));

    const flashCommands = transport.sent.filter(s => s[0] === SCProtocolId.FlashSWD);
    expect(flashCommands).toHaveLength(2);

    // First chunk: address bytes [0x00, 0x00, 0x00, 0x00]
    expect(flashCommands[0][2]).toBe(0x00);
    expect(flashCommands[0][3]).toBe(0x00);

    // Second chunk: address bytes [0x38, 0x00, 0x00, 0x00] (56 = 0x38)
    expect(flashCommands[1][2]).toBe(0x38);
    expect(flashCommands[1][3]).toBe(0x00);

    expect(progress[0][0]).toBe('Flashing radio');
    expect(progress[1][1]).toBe(100);

    // SWD Save
    await controller.swdSave();
    const saveCmd = transport.sent.find(s => s[0] === SCProtocolId.SWDSave);
    expect(saveCmd).toBeDefined();
  });

  it('flashes SWD with non-zero start address for production firmware', async () => {
    const transport = new MockHIDTransport();
    const controller = new ControllerDevice(transport);

    // Single chunk of radio data
    const radioFirmware = makeFirmware(56, 0xcc);

    // Queue SWD flash ready response
    transport.queueResponse(makeSwdFlashReadyResponse());

    // Flash with offset 1024 (0x400) — production radio offset
    await controller.swdFlash(radioFirmware, 1024);

    const flashCmd = transport.sent.find(s => s[0] === SCProtocolId.FlashSWD);
    expect(flashCmd).toBeDefined();
    // Address should be 1024 = [0x00, 0x04, 0x00, 0x00] LE
    expect(flashCmd![2]).toBe(0x00);
    expect(flashCmd![3]).toBe(0x04);
    expect(flashCmd![4]).toBe(0x00);
    expect(flashCmd![5]).toBe(0x00);
  });
});

describe('Full BLE firmware set (e2e)', () => {
  it('creates a valid BLE firmware set with correct offsets', () => {
    const lpc = makeFirmware(0x2000 + 100);
    const softdevice = makeFirmware(200);
    const radio = makeFirmware(100);

    const fw = createBLEFirmwareSet(lpc, softdevice, radio);

    expect(fw.lpc.byteLength).toBe(0x2000 + 100);
    expect(fw.softdevice.byteLength).toBe(200);
    expect(fw.radioApp.byteLength).toBe(100);
    expect(fw.radioAppOffset).toBe(0); // BLE starts at 0
  });

  it('creates a valid production firmware set with offset 1024', () => {
    const lpc = makeFirmware(0x2000 + 100);
    const bootloader = makeFirmware(200);
    const radio = makeFirmware(100);

    const fw = createProductionFirmwareSet(lpc, bootloader, radio);

    expect(fw.lpc.byteLength).toBe(0x2000 + 100);
    expect(fw.softdevice.byteLength).toBe(200); // bootloader stored as softdevice
    expect(fw.radioApp.byteLength).toBe(100);
    expect(fw.radioAppOffset).toBe(1024); // Production offset
  });
});

describe('Device info parsing (e2e)', () => {
  it('reads controller info and parses all fields correctly', async () => {
    const transport = new MockHIDTransport();
    const controller = new ControllerDevice(transport);

    const BLE_REV = 0x5b0f21bd; // Known BLE firmware revision
    const RADIO_REV = 0x5a0e3f34;
    const BOOT_REV = 0x59876543;

    transport.queueResponse(makeInfoResponse(0x1102, BOOT_REV, BLE_REV, RADIO_REV));

    const info = await controller.info();

    expect(info.usbPid).toBe(0x1102);
    expect(info.firmwareRev).toBe(BLE_REV);
    expect(info.radioRev).toBe(RADIO_REV);
    expect(info.bootloaderRev).toBe(BOOT_REV);
  });
});
