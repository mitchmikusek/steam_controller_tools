import { useRef, useCallback } from 'react';
import {
  FlashCoordinator,
  createBLEFirmwareSet,
  createProductionFirmwareSet,
  createCustomRadioFirmwareSet,
  loadFirmwareFromFile,
  type ControllerInfo,
  type FlashProgress,
} from '@scflash/protocol';
import type { FirmwareChoice } from '../pages/ChooseFirmwarePage';
import { logger } from '../utils/logger';
import {
  BLE_LPC,
  BLE_SOFTDEVICE,
  BLE_RADIO,
  PROD_LPC,
  PROD_BOOTLOADER,
  PROD_RADIO,
  GAMEPAD_RADIO,
  type FirmwareFileConfig,
} from '../utils/firmware-sources';

// ---- Firmware loader ----

async function loadFirmwareFile(config: FirmwareFileConfig): Promise<ArrayBuffer> {
  const res = await fetch(config.path);
  if (!res.ok) throw new Error(`${config.name}: failed to load (HTTP ${res.status})`);
  const buf = await res.arrayBuffer();
  if (buf.byteLength < 512 || buf.byteLength > 500000)
    throw new Error(`${config.name}: invalid size (${buf.byteLength} bytes)`);
  logger.info(`${config.name}: loaded from local bundle`);
  return buf;
}

// ---- Hook ----

export function useFlashCoordinator(
  onProgress: (p: FlashProgress) => void,
  onReconnectNeeded: (pid: number) => Promise<void>,
) {
  const coordinatorRef = useRef<FlashCoordinator | null>(null);

  const getCoordinator = useCallback(() => {
    if (!coordinatorRef.current) {
      const c = new FlashCoordinator();
      c.onLog = (level, msg) => logger.log(level, msg);
      c.loadBleLpc = () => loadFirmwareFile(BLE_LPC);
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

  const flash = useCallback(
    async (choice: FirmwareChoice, customFiles?: { lpc: File; softdevice: File; radio: File }) => {
      const c = getCoordinator();

      logger.info(`Loading ${choice} firmware...`);
      if (choice === 'gamepad') {
        /*
         * The LPC gets Valve's BLE firmware, as for a BLE flash. That firmware
         * implements the SWD bridge, so the BLE sequence applies unchanged: LPC
         * first, then the radio through it. The only difference from a BLE
         * flash is the radio: the stock SoftDevice plus the gamepad application
         * at 0x18000 instead of Valve's radio blob. Leaving Valve's LPC firmware
         * in place also keeps the radio reflashable later.
         */
        const fw = createCustomRadioFirmwareSet(
          await loadFirmwareFile(BLE_LPC),
          await loadFirmwareFile(BLE_SOFTDEVICE),
          await loadFirmwareFile(GAMEPAD_RADIO),
        );
        await c.flashBLE(fw);
        return;
      }

      const fw = customFiles
        ? createBLEFirmwareSet(
            await loadFirmwareFromFile(customFiles.lpc),
            await loadFirmwareFromFile(customFiles.softdevice),
            await loadFirmwareFromFile(customFiles.radio),
          )
        : choice === 'ble'
          ? createBLEFirmwareSet(
              await loadFirmwareFile(BLE_LPC),
              await loadFirmwareFile(BLE_SOFTDEVICE),
              await loadFirmwareFile(BLE_RADIO),
            )
          : createProductionFirmwareSet(
              await loadFirmwareFile(PROD_LPC),
              await loadFirmwareFile(PROD_BOOTLOADER),
              await loadFirmwareFile(PROD_RADIO),
            );

      if (choice === 'ble' || choice === 'custom') {
        await c.flashBLE(fw);
      } else {
        await c.flashProduction(fw);
      }
    },
    [getCoordinator],
  );

  const isConnected = useCallback(() => {
    return coordinatorRef.current?.isConnected ?? false;
  }, []);

  const currentMode = useCallback(() => {
    return (coordinatorRef.current?.currentMode ?? 'disconnected') as 'normal' | 'bootloader' | 'disconnected';
  }, []);

  return { connect, disconnect, getInfo, getController, flash, isConnected, currentMode };
}
