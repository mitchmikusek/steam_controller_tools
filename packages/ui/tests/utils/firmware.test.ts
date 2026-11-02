import { describe, it, expect } from 'vitest';
import { detectFirmwareType, fmtRev, fmtFirmwareLabel } from '../../src/utils/firmware';
import type { ControllerInfo } from '@scflash/protocol';

function makeInfo(firmwareRev: number, radioRev = 0): ControllerInfo {
  return { usbPid: 0x1102, bootloaderRev: 0, firmwareRev, radioRev };
}

describe('detectFirmwareType', () => {
  it('returns "ble" for known BLE hash 0x5b0f21bd', () => {
    expect(detectFirmwareType(makeInfo(0x5b0f21bd))).toBe('ble');
  });

  it('returns "ble" for known BLE hash 0x58be1e97', () => {
    expect(detectFirmwareType(makeInfo(0x58be1e97))).toBe('ble');
  });

  it('returns "ble" for revision above 0x5a000000 (0x5a000001)', () => {
    expect(detectFirmwareType(makeInfo(0x5a000001))).toBe('ble');
  });

  it('returns "production" for revision 0x57bf5c10 (below 0x5a000000)', () => {
    expect(detectFirmwareType(makeInfo(0x57bf5c10))).toBe('production');
  });

  it('returns "gamepad" for Valve\'s BLE main-chip firmware with a gamepad radio build', () => {
    expect(detectFirmwareType(makeInfo(0x5b0f21bd, 0x6aba447e))).toBe('gamepad');
  });

  it('keeps "ble" for Valve\'s own 2018 radio', () => {
    expect(detectFirmwareType(makeInfo(0x5b0f21bd, 0x5a0e3f34))).toBe('ble');
  });

  it('never calls production firmware a gamepad, whatever the radio reports', () => {
    expect(detectFirmwareType(makeInfo(0x57bf5c10, 0x6aba447e))).toBe('production');
  });

  it('returns "unknown" for revision 0', () => {
    expect(detectFirmwareType(makeInfo(0))).toBe('unknown');
  });
});

describe('fmtRev', () => {
  it('returns "N/A" for 0', () => {
    expect(fmtRev(0)).toBe('N/A');
  });

  it('includes hex string for 0x5b0f21bd', () => {
    const result = fmtRev(0x5b0f21bd);
    expect(result).toContain('0x5b0f21bd');
  });

  it('includes a date for 0x5b0f21bd', () => {
    const result = fmtRev(0x5b0f21bd);
    // The date portion comes from new Date(0x5b0f21bd * 1000).toLocaleDateString()
    const expectedDate = new Date(0x5b0f21bd * 1000).toLocaleDateString();
    expect(result).toContain(expectedDate);
  });
});

describe('fmtFirmwareLabel', () => {
  it('returns "Bluetooth LE Firmware" for "ble"', () => {
    expect(fmtFirmwareLabel('ble')).toBe('Bluetooth LE Firmware');
  });

  it('returns "Production Firmware" for "production"', () => {
    expect(fmtFirmwareLabel('production')).toBe('Production Firmware');
  });

  it('returns "Unknown Firmware" for "unknown"', () => {
    expect(fmtFirmwareLabel('unknown')).toBe('Unknown Firmware');
  });
});
