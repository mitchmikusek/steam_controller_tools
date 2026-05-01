export interface FirmwareSet {
  lpc: ArrayBuffer;
  softdevice: ArrayBuffer;
  radioApp: ArrayBuffer;
  radioAppOffset: number; // 0 for BLE, 1024 for production
}

export function createBLEFirmwareSet(
  lpc: ArrayBuffer,
  softdevice: ArrayBuffer,
  radioApp: ArrayBuffer,
): FirmwareSet {
  return { lpc, softdevice, radioApp, radioAppOffset: 0 };
}

export function createProductionFirmwareSet(
  lpc: ArrayBuffer,
  bootloader: ArrayBuffer,
  radioApp: ArrayBuffer,
): FirmwareSet {
  return { lpc, softdevice: bootloader, radioApp, radioAppOffset: 1024 };
}

export async function loadFirmwareFromFile(file: File): Promise<ArrayBuffer> {
  return file.arrayBuffer();
}

export async function loadFirmwareFromUrl(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch firmware: ${response.status} ${response.statusText}`);
  }
  return response.arrayBuffer();
}
