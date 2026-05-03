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
