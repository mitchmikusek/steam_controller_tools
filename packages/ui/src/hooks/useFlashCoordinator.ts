import { useRef, useCallback } from 'react';
import { unzipSync } from 'fflate';
import {
  FlashCoordinator,
  createBLEFirmwareSet,
  createProductionFirmwareSet,
  loadFirmwareFromUrl,
  loadFirmwareFromFile,
  type ControllerInfo,
  type FlashProgress,
} from '@scflash/protocol';
import type { FirmwareChoice } from '../pages/ChooseFirmwarePage';
import { logger } from '../utils/logger';

const VALVE_CDN = 'http://media.steampowered.com/controller_config/firmware';
const VALVE_ZIP_URL = 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/steamworks_docs/english/Steam_Controller_FW_Update_Tool.zip';

// Paths inside the Valve ZIP
const ZIP_BLE_DIR = 'Steam Controller FW Update Tool/updatescripts/fw_images/ble/';
const ZIP_PROD_DIR = 'Steam Controller FW Update Tool/updatescripts/fw_images/production/';

const BLE_FW = {
  lpc: 'vcf_wired_controller_d0g_5b0f21bd.bin',
  softdevice: 's110_nrf51_8.0.0_softdevice.bin',
  radio: 'vcf_wired_controller_d0g_5a0e3f348_radio.bin',
};

// ZIP BLE files are OLDER versions (March 2017) — don't use for BLE flash.
// Only use ZIP as fallback for production files and SoftDevice.

const PROD_FW = {
  lpc: 'vcf_wired_controller_d0g.bin',
  bootloader: 'd0g_bootloader.bin',
  radio: 'd0g_module.bin',
};

const LOCAL_BLE = 'fw_images/ble';
const LOCAL_PROD = 'fw_images/production';

// Cache extracted ZIP contents
let zipCache: Record<string, Uint8Array> | null = null;

/** Download and extract Valve's FW Update Tool ZIP */
async function loadValveZip(): Promise<Record<string, Uint8Array>> {
  if (zipCache) return zipCache;
  logger.info('Downloading Valve FW Update Tool ZIP...');
  const res = await fetch(VALVE_ZIP_URL);
  if (!res.ok) throw new Error(`ZIP download failed: ${res.status}`);
  const data = new Uint8Array(await res.arrayBuffer());
  logger.info('Extracting firmware from ZIP...');
  zipCache = unzipSync(data);
  return zipCache;
}

/** Get a file from the extracted ZIP */
function getZipFile(zip: Record<string, Uint8Array>, path: string): ArrayBuffer | null {
  const entry = zip[path];
  if (!entry) return null;
  return entry.buffer.slice(entry.byteOffset, entry.byteOffset + entry.byteLength);
}

/**
 * Try sources in order:
 * 1. Valve individual CDN (only some files available)
 * 2. Valve ZIP (all files)
 * 3. Local bundled copy
 */
async function fetchFirmware(filename: string, localDir: string, zipDir: string, zipFilename?: string): Promise<ArrayBuffer> {
  // 1. Try Valve CDN for individual file
  try {
    const res = await fetch(`${VALVE_CDN}/${filename}`);
    if (res.ok) {
      const buf = await res.arrayBuffer();
      if (buf.byteLength > 1000) { // Sanity check — not a 404 HTML page
        logger.info(`Loaded ${filename} from Valve CDN`);
        return buf;
      }
    }
  } catch {
    // CDN failed
  }

  // 2. Try Valve ZIP
  try {
    const zip = await loadValveZip();
    const zipPath = `${zipDir}${zipFilename ?? filename}`;
    const data = getZipFile(zip, zipPath);
    if (data && data.byteLength > 0) {
      logger.info(`Loaded ${filename} from Valve ZIP`);
      return data;
    }
  } catch {
    // ZIP failed
  }

  // 3. Fall back to local
  logger.info(`Loading ${filename} from local bundle`);
  return loadFirmwareFromUrl(`${localDir}/${filename}`);
}

export function useFlashCoordinator(
  onProgress: (p: FlashProgress) => void,
  onReconnectNeeded: (pid: number) => Promise<void>,
) {
  const coordinatorRef = useRef<FlashCoordinator | null>(null);

  const getCoordinator = useCallback(() => {
    if (!coordinatorRef.current) {
      const c = new FlashCoordinator();
      c.onLog = (level, msg) => logger.log(level, msg);
      c.loadBleLpc = () => fetchFirmware(BLE_FW.lpc, LOCAL_BLE, '', '');
      coordinatorRef.current = c;
    }
    const c = coordinatorRef.current;
    c.onProgress = onProgress;
    c.onReconnectNeeded = onReconnectNeeded;
    return c;
  }, [onProgress, onReconnectNeeded]);

  const connect = useCallback(async () => {
    const c = getCoordinator();
    return c.connect();
  }, [getCoordinator]);

  const disconnect = useCallback(async () => {
    const c = getCoordinator();
    await c.disconnect();
  }, [getCoordinator]);

  const getInfo = useCallback(async (): Promise<ControllerInfo | null> => {
    const c = getCoordinator();
    return c.getInfo();
  }, [getCoordinator]);

  const getController = useCallback(() => {
    const c = getCoordinator();
    return c.getController();
  }, [getCoordinator]);

  const flash = useCallback(async (
    choice: FirmwareChoice,
    customFiles?: { lpc: File; softdevice: File; radio: File },
  ) => {
    const c = getCoordinator();

    logger.info(`Loading ${choice} firmware...`);
    const fw = customFiles
      ? createBLEFirmwareSet(
          await loadFirmwareFromFile(customFiles.lpc),
          await loadFirmwareFromFile(customFiles.softdevice),
          await loadFirmwareFromFile(customFiles.radio),
        )
      : choice === 'ble'
        ? createBLEFirmwareSet(
            await fetchFirmware(BLE_FW.lpc, LOCAL_BLE, '', ''),
            await fetchFirmware(BLE_FW.softdevice, LOCAL_BLE, ZIP_BLE_DIR),
            await fetchFirmware(BLE_FW.radio, LOCAL_BLE, '', ''),
          )
        : createProductionFirmwareSet(
            await fetchFirmware(PROD_FW.lpc, LOCAL_PROD, ZIP_PROD_DIR),
            await fetchFirmware(PROD_FW.bootloader, LOCAL_PROD, ZIP_PROD_DIR),
            await fetchFirmware(PROD_FW.radio, LOCAL_PROD, ZIP_PROD_DIR),
          );

    if (choice === 'ble' || choice === 'custom') {
      await c.flashBLE(fw);
    } else {
      await c.flashProduction(fw);
    }
  }, [getCoordinator]);

  const isConnected = useCallback(() => {
    return coordinatorRef.current?.isConnected ?? false;
  }, []);

  const currentMode = useCallback(() => {
    return (coordinatorRef.current?.currentMode ?? 'disconnected') as 'normal' | 'bootloader' | 'disconnected';
  }, []);

  return { connect, disconnect, getInfo, getController, flash, isConnected, currentMode };
}
