import { VALVE_VID, CONTROLLER_PID, BOOTLOADER_PID } from './constants.js';
import type { HIDTransport, DeviceInfo } from './hid-transport.js';

// The Steam Controller exposes 3 HID interfaces:
//   Interface 0: Keyboard (usage page 0x01, usage 0x06)
//   Interface 1: Mouse (usage page 0x01, usage 0x02)
//   Interface 2: Vendor-defined (usage page 0xFF00) — protocol interface
// We need the vendor-defined one for firmware operations.
const VENDOR_USAGE_PAGE = 0xff00;

function isVendorDevice(device: HIDDevice): boolean {
  return device.collections.some(c => c.usagePage === VENDOR_USAGE_PAGE);
}

export class WebHIDTransport implements HIDTransport {
  private device: HIDDevice | null = null;

  get isOpen(): boolean {
    return this.device?.opened ?? false;
  }

  get deviceInfo(): DeviceInfo | null {
    if (!this.device) return null;
    return {
      manufacturer: this.device.productName ?? 'Unknown',
      product: this.device.productName ?? 'Unknown',
    };
  }

  /**
   * Request user permission and open a device matching the given VID/PID.
   * For the controller in normal mode, selects the vendor-defined interface.
   */
  async open(vendorId: number, productId: number): Promise<void> {
    // First check if we already have permission for this device
    const existing = await navigator.hid.getDevices();
    let device = existing.find(
      d => d.vendorId === vendorId && d.productId === productId && isVendorDevice(d),
    );

    if (!device) {
      // For bootloader mode (0x1002), there's only one interface, no need for usage filter
      if (productId === BOOTLOADER_PID) {
        device = existing.find(
          d => d.vendorId === vendorId && d.productId === productId,
        );
      }
    }

    if (!device) {
      // Request permission — filter by usage page for normal mode
      const filters = productId === CONTROLLER_PID
        ? [{ vendorId, productId, usagePage: VENDOR_USAGE_PAGE }]
        : [{ vendorId, productId }];

      const selected = await navigator.hid.requestDevice({ filters });
      if (!selected.length) throw new Error('No device selected');
      device = selected[0];
    }

    if (!device.opened) {
      await device.open();
    }
    this.device = device;
  }

  /**
   * Open a specific HIDDevice that was already granted permission.
   * Used for reconnection after mode switch.
   */
  async openDevice(device: HIDDevice): Promise<void> {
    if (!device.opened) {
      await device.open();
    }
    this.device = device;
  }

  async close(): Promise<void> {
    if (this.device?.opened) {
      await this.device.close();
    }
    this.device = null;
  }

  async sendFeatureReport(reportId: number, data: Uint8Array): Promise<void> {
    if (!this.device?.opened) throw new Error('Device not open');
    await this.device.sendFeatureReport(reportId, data as unknown as BufferSource);
  }

  async receiveFeatureReport(reportId: number): Promise<DataView> {
    if (!this.device?.opened) throw new Error('Device not open');
    return this.device.receiveFeatureReport(reportId);
  }

  /**
   * Request permission for both controller PIDs upfront.
   * Uses usage page filter for normal mode to get the right interface.
   */
  static async requestBothDevices(): Promise<HIDDevice[]> {
    return navigator.hid.requestDevice({
      filters: [
        { vendorId: VALVE_VID, productId: CONTROLLER_PID, usagePage: VENDOR_USAGE_PAGE },
        { vendorId: VALVE_VID, productId: BOOTLOADER_PID },
      ],
    });
  }

  /**
   * Find a previously-granted device by PID. Used after mode switch.
   * For normal mode, filters for the vendor-defined usage page.
   */
  static async findDevice(productId: number, requireVendorPage = true): Promise<HIDDevice | null> {
    const devices = await navigator.hid.getDevices();

    if (productId === CONTROLLER_PID && requireVendorPage) {
      return devices.find(
        d => d.vendorId === VALVE_VID && d.productId === productId && isVendorDevice(d),
      ) ?? null;
    }

    return devices.find(
      d => d.vendorId === VALVE_VID && d.productId === productId,
    ) ?? null;
  }
}
