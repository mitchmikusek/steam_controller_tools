/**
 * Firmware source configuration.
 *
 * Each firmware file has an ordered list of sources to try.
 * The first successful source wins. This makes it easy to:
 * - Add/remove sources
 * - Change priority order
 * - Update filenames or URLs
 */

// ---- Source URLs ----

const VALVE_CDN = 'https://media.steampowered.com/controller_config/firmware';
export const VALVE_ZIP_URL =
  'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/steamworks_docs/english/Steam_Controller_FW_Update_Tool.zip';

// Paths inside the Valve ZIP
const ZIP_BLE = 'Steam Controller FW Update Tool/updatescripts/fw_images/ble';
const ZIP_PROD = 'Steam Controller FW Update Tool/updatescripts/fw_images/production';

// ---- Source types ----

export type FirmwareSource =
  | { type: 'url'; url: string }
  | { type: 'zip'; zipPath: string }
  | { type: 'local'; path: string };

export interface FirmwareFileConfig {
  /** Human-readable name for logging */
  name: string;
  /** Ordered list of sources to try (first success wins) */
  sources: FirmwareSource[];
}

// ---- BLE firmware files (latest May 2018 versions) ----

export const BLE_LPC: FirmwareFileConfig = {
  name: 'BLE LPC firmware',
  sources: [
    { type: 'url', url: `${VALVE_CDN}/vcf_wired_controller_d0g_5b0f21bd.bin` },
    // ZIP has older March 2017 version — skip
    { type: 'local', path: 'fw_images/ble/vcf_wired_controller_d0g_5b0f21bd.bin' },
  ],
};

export const BLE_SOFTDEVICE: FirmwareFileConfig = {
  name: 'BLE SoftDevice',
  sources: [
    // Not on Valve CDN individually
    { type: 'zip', zipPath: `${ZIP_BLE}/s110_nrf51_8.0.0_softdevice.bin` },
    { type: 'local', path: 'fw_images/ble/s110_nrf51_8.0.0_softdevice.bin' },
  ],
};

export const BLE_RADIO: FirmwareFileConfig = {
  name: 'BLE radio firmware',
  sources: [
    { type: 'url', url: `${VALVE_CDN}/vcf_wired_controller_d0g_5a0e3f348_radio.bin` },
    // ZIP has older March 2017 version — skip
    { type: 'local', path: 'fw_images/ble/vcf_wired_controller_d0g_5a0e3f348_radio.bin' },
  ],
};

// ---- Production firmware files ----

export const PROD_LPC: FirmwareFileConfig = {
  name: 'Production LPC firmware',
  sources: [
    // Not on Valve CDN individually
    { type: 'zip', zipPath: `${ZIP_PROD}/vcf_wired_controller_d0g.bin` },
    { type: 'local', path: 'fw_images/production/vcf_wired_controller_d0g.bin' },
  ],
};

export const PROD_BOOTLOADER: FirmwareFileConfig = {
  name: 'Production bootloader',
  sources: [
    // Not on Valve CDN individually
    { type: 'zip', zipPath: `${ZIP_PROD}/d0g_bootloader.bin` },
    { type: 'local', path: 'fw_images/production/d0g_bootloader.bin' },
  ],
};

export const PROD_RADIO: FirmwareFileConfig = {
  name: 'Production radio module',
  sources: [
    // Not on Valve CDN individually
    { type: 'zip', zipPath: `${ZIP_PROD}/d0g_module.bin` },
    { type: 'local', path: 'fw_images/production/d0g_module.bin' },
  ],
};
