import { describe, it, expect } from 'vitest';
import { detectFirmwareType, fmtRev, fmtFirmwareLabel } from '../../src/utils/firmware';
import type { ControllerInfo } from '@scflash/protocol';

function makeInfo(firmwareRev: number): ControllerInfo {
  return { usbPid: 0x1102, bootloaderRev: 0, firmwareRev, radioRev: 0 };
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
