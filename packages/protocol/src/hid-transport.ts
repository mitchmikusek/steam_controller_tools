export interface DeviceInfo {
  manufacturer: string;
  product: string;
}

export interface HIDTransport {
  open(vendorId: number, productId: number): Promise<void>;
  close(): Promise<void>;
  sendFeatureReport(reportId: number, data: Uint8Array): Promise<void>;
  receiveFeatureReport(reportId: number): Promise<DataView>;
  readonly isOpen: boolean;
  readonly deviceInfo: DeviceInfo | null;
}

/**
 * Mock transport for testing. Records all sent data and returns canned responses.
 */
export class MockHIDTransport implements HIDTransport {
  isOpen = false;
  deviceInfo: DeviceInfo | null = null;
  sent: Uint8Array[] = [];
  responses: DataView[] = [];
  private responseIndex = 0;

  queueResponse(data: number[]): void {
    const buf = new ArrayBuffer(data.length);
    const view = new DataView(buf);
    data.forEach((b, i) => view.setUint8(i, b));
    this.responses.push(view);
  }

  async open(): Promise<void> {
    this.isOpen = true;
    this.deviceInfo = { manufacturer: 'Mock', product: 'Mock Controller' };
  }

  async close(): Promise<void> {
    this.isOpen = false;
  }

  async sendFeatureReport(_reportId: number, data: Uint8Array): Promise<void> {
    this.sent.push(new Uint8Array(data));
  }

  async receiveFeatureReport(_reportId: number): Promise<DataView> {
    if (this.responseIndex < this.responses.length) {
      return this.responses[this.responseIndex++];
    }
    return new DataView(new ArrayBuffer(64));
  }
}
