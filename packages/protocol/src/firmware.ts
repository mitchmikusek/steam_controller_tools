export interface FirmwareSet {
  lpc: ArrayBuffer;
  softdevice: ArrayBuffer;
  radioApp: ArrayBuffer;
  radioAppOffset: number; // 0 for BLE, 1024 for production, 0x18000 for a custom radio app
  /**
   * What to call the two radio writes in progress and log messages. The image
   * at address 0 is a bootloader on the production path and a SoftDevice
   * everywhere else, and calling a SoftDevice a bootloader in the flash log
   * makes a failed flash much harder to read.
   */
  labels?: { base: string; app: string };
}

/**
 * Application base address on the nRF51822 when the S110 8.0.0 SoftDevice is
 * present. The SoftDevice occupies 0x0 to 0x16917, and S110 8.0.0 places the
 * application vector table at 0x18000.
 */
export const NRF51_S110_APP_BASE = 0x18000;

export function createBLEFirmwareSet(lpc: ArrayBuffer, softdevice: ArrayBuffer, radioApp: ArrayBuffer): FirmwareSet {
  return { lpc, softdevice, radioApp, radioAppOffset: 0, labels: { base: 'SoftDevice', app: 'radio application' } };
}

export function createProductionFirmwareSet(
  lpc: ArrayBuffer,
  bootloader: ArrayBuffer,
  radioApp: ArrayBuffer,
): FirmwareSet {
  return {
    lpc,
    softdevice: bootloader,
    radioApp,
    radioAppOffset: 1024,
    labels: { base: 'bootloader', app: 'radio module' },
  };
}

/**
 * Firmware set for a custom nRF51822 radio application layered on the stock
 * SoftDevice.
 *
 * Valve's BLE radio image is a single blob based at 0x0 that already contains
 * the SoftDevice, which is why `createBLEFirmwareSet` leaves `radioAppOffset`
 * at 0. A custom application is built separately and linked to 0x18000, so the
 * SoftDevice and the application are two distinct writes.
 *
 * Flash such a set with `FlashCoordinator.flashBLE` when its LPC firmware is
 * Valve's BLE firmware: that firmware implements the SWD
 * bridge, so the LPC goes first and the radio is written through it. Only an
 * LPC firmware without the bridge needs `flashProduction`'s radio-first order.
 *
 * @param lpc        LPC11U37 firmware to leave on the controller.
 * @param softdevice SoftDevice image, written at 0x0.
 * @param radioApp   Radio application image, written at 0x18000.
 */
export function createCustomRadioFirmwareSet(
  lpc: ArrayBuffer,
  softdevice: ArrayBuffer,
  radioApp: ArrayBuffer,
): FirmwareSet {
  return {
    lpc,
    softdevice,
    radioApp,
    radioAppOffset: NRF51_S110_APP_BASE,
    labels: { base: 'SoftDevice', app: 'custom radio application' },
  };
}

/**
 * Sanity check a radio firmware set before it is written.
 *
 * The failures this catches are silent and destroy the radio image: an
 * application linked to 0x18000 flashed at offset 0 lands on top of the
 * SoftDevice, an application linked for some other base jumps into the void,
 * and a base image longer than the application offset means the application
 * is written over flash the base image already programmed. `swdFlash` writes
 * wherever it is told, so in every case the flash reports success and the
 * radio simply never boots again.
 *
 * A bare application image starts with its vector table, whose first word is an
 * initial stack pointer pointing into RAM. A full image that begins with the
 * SoftDevice does not: S110 8.0.0 starts with 0x000007C0. That difference is
 * enough to tell the two apart. A bare image's second word, its reset vector,
 * must then point into the image as it will sit in flash.
 *
 * @returns An error message, or null if the set looks coherent.
 */
export function validateFirmwareSet(fw: FirmwareSet): string | null {
  if (fw.radioApp.byteLength < 8) {
    return 'Radio application image is too small to contain a vector table.';
  }

  const view = new DataView(fw.radioApp);
  const initialSp = view.getUint32(0, true);
  const looksLikeBareApp = initialSp >= 0x20000000 && initialSp <= 0x20010000;

  if (looksLikeBareApp && fw.radioAppOffset === 0) {
    return (
      `Radio application looks like a bare application image (initial stack pointer ` +
      `0x${initialSp.toString(16)}), but it would be written at address 0, on top of the ` +
      `SoftDevice. Build the set with createCustomRadioFirmwareSet so it is written at ` +
      `0x${NRF51_S110_APP_BASE.toString(16)}.`
    );
  }

  if (looksLikeBareApp) {
    const resetVector = view.getUint32(4, true) & ~1;
    const start = fw.radioAppOffset;
    const end = fw.radioAppOffset + fw.radioApp.byteLength;
    if (resetVector < start || resetVector >= end) {
      return (
        `Radio application's reset vector 0x${resetVector.toString(16)} is outside the image, which ` +
        `would sit at 0x${start.toString(16)}-0x${(end - 1).toString(16)}. It was linked for a different ` +
        `address and would not boot there.`
      );
    }
  }

  if (fw.radioAppOffset > 0 && fw.softdevice.byteLength > fw.radioAppOffset) {
    return (
      `Base image is ${fw.softdevice.byteLength} bytes, more than the 0x${fw.radioAppOffset.toString(16)} ` +
      `bytes below the radio application, so the application would be written over it.`
    );
  }

  if (!looksLikeBareApp && fw.radioAppOffset === NRF51_S110_APP_BASE) {
    return (
      `Radio application does not look like a bare application image (first word ` +
      `0x${initialSp.toString(16)}), but it would be written at ` +
      `0x${NRF51_S110_APP_BASE.toString(16)}. A full image that already contains the ` +
      `SoftDevice must be written at address 0.`
    );
  }

  return null;
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
