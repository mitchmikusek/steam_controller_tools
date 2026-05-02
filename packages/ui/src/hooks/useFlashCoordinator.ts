import { useRef, useCallback } from 'react';
import { unzipSync } from 'fflate';
import {
  FlashCoordinator,
  createBLEFirmwareSet,
  createProductionFirmwareSet,
  loadFirmwareFromFile,
  type ControllerInfo,
  type FlashProgress,
} from '@scflash/protocol';
import type { FirmwareChoice } from '../pages/ChooseFirmwarePage';
import { logger } from '../utils/logger';
import {
  VALVE_ZIP_URL,
  BLE_LPC, BLE_SOFTDEVICE, BLE_RADIO,
  PROD_LPC, PROD_BOOTLOADER, PROD_RADIO,
  type FirmwareFileConfig, type FirmwareSource,
} from '../utils/firmware-sources';

// ---- ZIP cache ----

let zipCache: Record<string, Uint8Array> | null = null;

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

// ---- Firmware loader ----

async function loadFromSource(source: FirmwareSource): Promise<ArrayBuffer> {
  switch (source.type) {
    case 'url': {
      const res = await fetch(source.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = await res.arrayBuffer();
      if (buf.byteLength < 10000 || buf.byteLength > 500000) throw new Error(`Invalid firmware size: ${buf.byteLength} bytes`);
      return buf;
    }
    case 'zip': {
      const zip = await loadValveZip();
      const entry = zip[source.zipPath];
      if (!entry) throw new Error(`Not found in ZIP: ${source.zipPath}`);
      return entry.buffer.slice(entry.byteOffset, entry.byteOffset + entry.byteLength);
    }
    case 'local': {
      const res = await fetch(source.path);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.arrayBuffer();
    }
  }
}

async function loadFirmwareFile(config: FirmwareFileConfig): Promise<ArrayBuffer> {
  for (const source of config.sources) {
    try {
      const data = await loadFromSource(source);
      logger.info(`${config.name}: loaded from ${source.type}${source.type === 'url' ? '' : source.type === 'zip' ? ' (Valve ZIP)' : ' (local bundle)'}`);
      return data;
    } catch (e) {
      logger.debug(`${config.name}: ${source.type} failed — ${e}`);
    }
  }
  throw new Error(`${config.name}: all sources failed`);
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
  }, [getCoordinator]);

  const isConnected = useCallback(() => {
    return coordinatorRef.current?.isConnected ?? false;
  }, []);

  const currentMode = useCallback(() => {
    return (coordinatorRef.current?.currentMode ?? 'disconnected') as 'normal' | 'bootloader' | 'disconnected';
  }, []);

  return { connect, disconnect, getInfo, getController, flash, isConnected, currentMode };
}
