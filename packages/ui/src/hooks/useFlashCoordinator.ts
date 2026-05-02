import { useRef, useCallback } from 'react';
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

const BLE_FW = {
  lpc: 'vcf_wired_controller_d0g_5b0f21bd.bin',
  softdevice: 's110_nrf51_8.0.0_softdevice.bin',
  radio: 'vcf_wired_controller_d0g_5a0e3f348_radio.bin',
};

const PROD_FW = {
  lpc: 'vcf_wired_controller_d0g.bin',
  bootloader: 'd0g_bootloader.bin',
  radio: 'd0g_module.bin',
};

const LOCAL_BLE = 'fw_images/ble';
const LOCAL_PROD = 'fw_images/production';

/** Try Valve CDN first, fall back to local bundled copy */
async function fetchFirmware(filename: string, localDir: string): Promise<ArrayBuffer> {
  // Try Valve CDN
  try {
    const res = await fetch(`${VALVE_CDN}/${filename}`);
    if (res.ok) {
      logger.info(`Loaded ${filename} from Valve CDN`);
      return res.arrayBuffer();
    }
  } catch {
    // CDN failed, fall back
  }
  // Fall back to local
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
      c.loadBleLpc = () => fetchFirmware(BLE_FW.lpc, LOCAL_BLE);
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
            await fetchFirmware(BLE_FW.lpc, LOCAL_BLE),
            await fetchFirmware(BLE_FW.softdevice, LOCAL_BLE),
            await fetchFirmware(BLE_FW.radio, LOCAL_BLE),
          )
        : createProductionFirmwareSet(
            await fetchFirmware(PROD_FW.lpc, LOCAL_PROD),
            await fetchFirmware(PROD_FW.bootloader, LOCAL_PROD),
            await fetchFirmware(PROD_FW.radio, LOCAL_PROD),
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
