/**
 * Firmware source configuration.
 *
 * All firmware is served from the local bundle (included in the build).
 * Valve's CDN and ZIP sources lack CORS headers and cannot be fetched
 * from a browser context.
 */

export interface FirmwareFileConfig {
  /** Human-readable name for logging */
  name: string;
  /** Path to local firmware file */
  path: string;
}

// ---- BLE firmware files (latest May 2018 versions) ----

export const BLE_LPC: FirmwareFileConfig = {
  name: 'BLE LPC firmware',
  path: 'fw_images/ble/vcf_wired_controller_d0g_5b0f21bd.bin',
};

export const BLE_SOFTDEVICE: FirmwareFileConfig = {
  name: 'BLE SoftDevice',
  path: 'fw_images/ble/s110_nrf51_8.0.0_softdevice.bin',
};

export const BLE_RADIO: FirmwareFileConfig = {
  name: 'BLE radio firmware',
  path: 'fw_images/ble/vcf_wired_controller_d0g_5a0e3f348_radio.bin',
};

// ---- Production firmware files ----

export const PROD_LPC: FirmwareFileConfig = {
  name: 'Production LPC firmware',
  path: 'fw_images/production/vcf_wired_controller_d0g.bin',
};

export const PROD_BOOTLOADER: FirmwareFileConfig = {
  name: 'Production bootloader',
  path: 'fw_images/production/d0g_bootloader.bin',
};

export const PROD_RADIO: FirmwareFileConfig = {
  name: 'Production radio module',
  path: 'fw_images/production/d0g_module.bin',
};

// ---- BLE gamepad radio application ----

/**
 * Replacement nRF51822 radio application that pairs the controller as a
 * standard BLE HID gamepad instead of a mouse and keyboard. A bare application
 * linked to 0x18000, flashed on top of the stock SoftDevice.
 *
 * Source and release: https://github.com/dimitrieh/steamcontroller-ble-gamepad
 * (this file is that release's sc_ble_gamepad.bin, checksum in SHA256SUMS).
 */
export const GAMEPAD_RADIO: FirmwareFileConfig = {
  name: 'BLE gamepad radio application',
  path: 'fw_images/gamepad/sc_ble_gamepad.bin',
};

/** Step-by-step hardware test guide for the gamepad firmware. */
export const GAMEPAD_TEST_GUIDE_URL = 'https://dimitrieh.github.io/steamcontroller-ble-gamepad/';
