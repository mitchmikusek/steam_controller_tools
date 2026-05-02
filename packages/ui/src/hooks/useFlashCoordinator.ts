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

const BLE_FW = {
  lpc: 'fw_images/ble/vcf_wired_controller_d0g_5b0f21bd.bin',
  softdevice: 'fw_images/ble/s110_nrf51_8.0.0_softdevice.bin',
  radio: 'fw_images/ble/vcf_wired_controller_d0g_5a0e3f348_radio.bin',
};

const PROD_FW = {
  lpc: 'fw_images/production/vcf_wired_controller_d0g.bin',
  bootloader: 'fw_images/production/d0g_bootloader.bin',
  radio: 'fw_images/production/d0g_module.bin',
};

export function useFlashCoordinator(
  onProgress: (p: FlashProgress) => void,
  onReconnectNeeded: (pid: number) => Promise<void>,
) {
  const coordinatorRef = useRef<FlashCoordinator | null>(null);

  const getCoordinator = useCallback(() => {
    if (!coordinatorRef.current) {
      const c = new FlashCoordinator();
      c.onLog = (level, msg) => logger.log(level, msg);
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

    const fw = customFiles
      ? createBLEFirmwareSet(
          await loadFirmwareFromFile(customFiles.lpc),
          await loadFirmwareFromFile(customFiles.softdevice),
          await loadFirmwareFromFile(customFiles.radio),
        )
      : choice === 'ble'
        ? createBLEFirmwareSet(
            await loadFirmwareFromUrl(BLE_FW.lpc),
            await loadFirmwareFromUrl(BLE_FW.softdevice),
            await loadFirmwareFromUrl(BLE_FW.radio),
          )
        : createProductionFirmwareSet(
            await loadFirmwareFromUrl(PROD_FW.lpc),
            await loadFirmwareFromUrl(PROD_FW.bootloader),
            await loadFirmwareFromUrl(PROD_FW.radio),
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
