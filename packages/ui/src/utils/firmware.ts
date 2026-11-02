import type { ControllerInfo } from '@scflash/protocol';

const KNOWN_BLE_FW = [0x5b0f21bd, 0x58be1e97];

/**
 * The gamepad firmware leaves Valve's BLE firmware on the main chip, so the
 * main chip's revision alone says "BLE". Its radio reports its build time as
 * its revision, and every build is years newer than Valve's last radio image
 * (2018), so a radio revision from 2025 on marks the gamepad radio.
 */
const GAMEPAD_RADIO_MIN_REV = 0x68000000;

export type FirmwareType = 'ble' | 'gamepad' | 'production' | 'unknown';

export function detectFirmwareType(info: ControllerInfo): FirmwareType {
  const bleLpc = KNOWN_BLE_FW.includes(info.firmwareRev) || info.firmwareRev > 0x5a000000;
  if (bleLpc && info.radioRev >= GAMEPAD_RADIO_MIN_REV) return 'gamepad';
  if (bleLpc) return 'ble';
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
    case 'gamepad':
      return 'BLE Gamepad Firmware';
    case 'production':
      return 'Production Firmware';
    default:
      return 'Unknown Firmware';
  }
}
