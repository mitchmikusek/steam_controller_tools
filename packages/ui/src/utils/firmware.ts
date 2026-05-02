import type { ControllerInfo } from '@scflash/protocol';

const KNOWN_BLE_FW = [0x5b0f21bd, 0x58be1e97];

export type FirmwareType = 'ble' | 'production' | 'unknown';

export function detectFirmwareType(info: ControllerInfo): FirmwareType {
  if (KNOWN_BLE_FW.includes(info.firmwareRev)) return 'ble';
  if (info.firmwareRev > 0x5a000000) return 'ble';
  if (info.firmwareRev > 0 && info.firmwareRev < 0x5a000000) return 'production';
  return 'unknown';
}

export function fmtRev(ts: number): string {
  if (ts === 0) return 'N/A';
  return `0x${ts.toString(16)} \u00b7 ${new Date(ts * 1000).toLocaleDateString()}`;
}

export function fmtFirmwareLabel(type: FirmwareType): string {
  switch (type) {
    case 'ble':
      return 'Bluetooth LE Firmware';
    case 'production':
      return 'Production Firmware';
    default:
      return 'Unknown Firmware';
  }
}
