import { describe, it, expect } from 'vitest';
import { ControllerDevice } from '../src/controller.js';
import { MockHIDTransport } from '../src/hid-transport.js';
import {
  createBLEFirmwareSet,
  createProductionFirmwareSet,
  createCustomRadioFirmwareSet,
  validateFirmwareSet,
  NRF51_S110_APP_BASE,
} from '../src/firmware.js';
import { SCProtocolId, REPORT_SIZE } from '../src/constants.js';

/**
 * Tests for flashing a custom nRF51822 radio application on top of the stock
 * S110 8.0.0 SoftDevice.
 *
 * Valve's own BLE radio blob is a single image based at 0x0 that already
 * contains the SoftDevice. A custom application is a separate image linked to
 * the S110 application base, so the SoftDevice and the application are two
 * writes at two different addresses, and the addresses have to be right or the
 * radio will not boot.
 */

function makeFirmware(size: number, fill = 0xaa): ArrayBuffer {
  const buf = new ArrayBuffer(size);
  new Uint8Array(buf).fill(fill);
  return buf;
}

function makeSwdFlashReadyResponse(): number[] {
  const buf = new Array(REPORT_SIZE).fill(0);
  buf[0] = 0x94;
  buf[1] = 0x06;
  buf[4] = 0x60;
  buf[5] = 0x09;
  return buf;
}

/** Pull the (address, length) of every FlashSWD packet the device was sent. */
function swdWrites(transport: MockHIDTransport): { address: number; length: number }[] {
  return transport.sent
    .filter((packet) => packet[0] === SCProtocolId.FlashSWD)
    .map((packet) => ({
      // Payload is [len+4][addr32 LE][data...]
      address: packet[2] | (packet[3] << 8) | (packet[4] << 16) | (packet[5] << 24),
      length: packet[1] - 4,
    }));
}

describe('createCustomRadioFirmwareSet', () => {
  it('places the radio application at the S110 application base', () => {
    const fw = createCustomRadioFirmwareSet(makeFirmware(1024), makeFirmware(2048), makeFirmware(512));
    expect(fw.radioAppOffset).toBe(0x18000);
    expect(NRF51_S110_APP_BASE).toBe(0x18000);
  });

  it('uses a different offset than the BLE and production sets', () => {
    const lpc = makeFirmware(64);
    const sd = makeFirmware(64);
    const app = makeFirmware(64);

    expect(createBLEFirmwareSet(lpc, sd, app).radioAppOffset).toBe(0);
    expect(createProductionFirmwareSet(lpc, sd, app).radioAppOffset).toBe(1024);
    expect(createCustomRadioFirmwareSet(lpc, sd, app).radioAppOffset).toBe(0x18000);
  });

  it('keeps the SoftDevice and application as separate buffers', () => {
    const sd = makeFirmware(128, 0x11);
    const app = makeFirmware(128, 0x22);
    const fw = createCustomRadioFirmwareSet(makeFirmware(64), sd, app);

    expect(fw.softdevice).toBe(sd);
    expect(fw.radioApp).toBe(app);
  });
});

describe('swdFlash addressing for a custom radio application', () => {
  it('writes the application at 0x18000 in ascending 56-byte chunks', async () => {
    const transport = new MockHIDTransport();
    const controller = new ControllerDevice(transport);

    const appSize = 14376;
    for (let i = 0; i < Math.ceil(appSize / 0x38) + 8; i++) {
      transport.queueResponse(makeSwdFlashReadyResponse());
    }

    await controller.swdFlash(makeFirmware(appSize), NRF51_S110_APP_BASE);

    const writes = swdWrites(transport);
    expect(writes.length).toBe(Math.ceil(appSize / 0x38));
    expect(writes[0].address).toBe(0x18000);
    expect(writes[1].address).toBe(0x18000 + 0x38);

    // Contiguous, ascending, and ending exactly at the end of the image.
    let expected = 0x18000;
    let total = 0;
    for (const write of writes) {
      expect(write.address).toBe(expected);
      expected += write.length;
      total += write.length;
    }
    expect(total).toBe(appSize);
    expect(expected).toBe(0x18000 + appSize);
  });

  it('keeps every chunk word aligned, which nRF51 flash writes require', async () => {
    const transport = new MockHIDTransport();
    const controller = new ControllerDevice(transport);

    const appSize = 14376;
    for (let i = 0; i < Math.ceil(appSize / 0x38) + 8; i++) {
      transport.queueResponse(makeSwdFlashReadyResponse());
    }

    await controller.swdFlash(makeFirmware(appSize), NRF51_S110_APP_BASE);

    for (const write of swdWrites(transport)) {
      expect(write.address % 4).toBe(0);
      expect(write.length % 4).toBe(0);
    }
  });

  it('does not write below the application base, where the SoftDevice lives', async () => {
    const transport = new MockHIDTransport();
    const controller = new ControllerDevice(transport);

    for (let i = 0; i < 64; i++) {
      transport.queueResponse(makeSwdFlashReadyResponse());
    }

    await controller.swdFlash(makeFirmware(1024), NRF51_S110_APP_BASE);

    for (const write of swdWrites(transport)) {
      expect(write.address).toBeGreaterThanOrEqual(0x18000);
    }
  });
});

/** A bare application image: vector table starting with a RAM stack pointer. */
function makeAppImage(initialSp = 0x20004000, resetVector = 0x000180f5): ArrayBuffer {
  const buf = new ArrayBuffer(512);
  const view = new DataView(buf);
  view.setUint32(0, initialSp, true);
  view.setUint32(4, resetVector, true);
  return buf;
}

/** A full image that opens with the SoftDevice, as Valve's blob does. */
function makeFullImage(): ArrayBuffer {
  const buf = new ArrayBuffer(512);
  const view = new DataView(buf);
  view.setUint32(0, 0x000007c0, true); // S110 8.0.0's first word
  view.setUint32(4, 0x000006d1, true);
  return buf;
}

describe('validateFirmwareSet', () => {
  it('accepts a bare application aimed at the application base', () => {
    const fw = createCustomRadioFirmwareSet(makeFirmware(64), makeFirmware(64), makeAppImage());
    expect(validateFirmwareSet(fw)).toBeNull();
  });

  it('accepts a full image aimed at address 0', () => {
    const fw = createBLEFirmwareSet(makeFirmware(64), makeFirmware(64), makeFullImage());
    expect(validateFirmwareSet(fw)).toBeNull();
  });

  it('rejects a bare application that would be written over the SoftDevice', () => {
    // The footgun: a 0x18000-linked image in a set that writes at offset 0.
    // swdFlash would happily do it and the radio would never boot again.
    const fw = createBLEFirmwareSet(makeFirmware(64), makeFirmware(64), makeAppImage());
    const problem = validateFirmwareSet(fw);
    expect(problem).toBeTruthy();
    expect(problem).toContain('on top of the SoftDevice');
    expect(problem).toContain('createCustomRadioFirmwareSet');
  });

  it('rejects a full image aimed at the application base', () => {
    const fw = createCustomRadioFirmwareSet(makeFirmware(64), makeFirmware(64), makeFullImage());
    const problem = validateFirmwareSet(fw);
    expect(problem).toBeTruthy();
    expect(problem).toContain('must be written at address 0');
  });

  it('rejects an image too small to hold a vector table', () => {
    const fw = createCustomRadioFirmwareSet(makeFirmware(64), makeFirmware(64), new ArrayBuffer(4));
    expect(validateFirmwareSet(fw)).toContain('too small');
  });

  it('rejects a bare application linked for a different base', () => {
    // E.g. built for S130, whose application base is 0x1B000: the stack
    // pointer still looks right, but the reset vector points past the image.
    const fw = createCustomRadioFirmwareSet(makeFirmware(64), makeFirmware(64), makeAppImage(0x20004000, 0x0001b0f5));
    expect(validateFirmwareSet(fw)).toContain('outside the image');
  });

  it('rejects a base image that runs into the application', () => {
    const fw = createCustomRadioFirmwareSet(makeFirmware(64), makeFirmware(NRF51_S110_APP_BASE + 4), makeAppImage());
    expect(validateFirmwareSet(fw)).toContain('written over it');
  });

  it('accepts a base image that ends exactly at the application base', () => {
    const fw = createCustomRadioFirmwareSet(makeFirmware(64), makeFirmware(NRF51_S110_APP_BASE), makeAppImage());
    expect(validateFirmwareSet(fw)).toBeNull();
  });

  it('leaves the production set alone', () => {
    // Valve's radio module is not a bare S110 application and is written at
    // 1024, so neither rule should fire.
    const fw = createProductionFirmwareSet(makeFirmware(64), makeFirmware(64), makeFullImage());
    expect(validateFirmwareSet(fw)).toBeNull();
  });
});

describe('FlashCoordinator guard', () => {
  it('refuses to start a flash with a mismatched set', async () => {
    const { FlashCoordinator } = await import('../src/flash-coordinator.js');
    const coordinator = new FlashCoordinator();

    const logged: string[] = [];
    coordinator.onLog = (_level, msg) => logged.push(msg);

    const fw = createBLEFirmwareSet(makeFirmware(64), makeFirmware(64), makeAppImage());

    await expect(coordinator.flashBLE(fw)).rejects.toThrow(/on top of the SoftDevice/);
    await expect(coordinator.flashProduction(fw)).rejects.toThrow(/on top of the SoftDevice/);

    // And it says why, rather than failing somewhere deep in the sequence.
    expect(logged.some((m) => m.includes('on top of the SoftDevice'))).toBe(true);
  });
});
