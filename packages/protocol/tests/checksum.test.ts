import { describe, it, expect } from 'vitest';
import { computeChecksum } from '../src/checksum.js';

describe('computeChecksum', () => {
  it('produces a 16-byte Uint8Array', () => {
    // 32 bytes of data with seek at 0 → 2 blocks of 16
    const firmware = new ArrayBuffer(32);
    const view = new DataView(firmware);
    for (let i = 0; i < 32; i++) view.setUint8(i, i);

    const result = computeChecksum(firmware, 0);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.byteLength).toBe(16);
  });

  it('processes 2 blocks of 16 bytes correctly after seek offset', () => {
    // 48 bytes total: 16 bytes before seek + 32 bytes of actual data (2 blocks)
    const firmware = new ArrayBuffer(48);
    const view = new DataView(firmware);
    // Fill first 16 bytes with 0xFF (should be ignored)
    for (let i = 0; i < 16; i++) view.setUint8(i, 0xff);
    // Fill remaining 32 bytes with sequential data
    for (let i = 16; i < 48; i++) view.setUint8(i, i - 16);

    const result = computeChecksum(firmware, 16);

    // Compare with checksum of just the 32-byte payload at offset 0
    const payloadOnly = new ArrayBuffer(32);
    const pView = new DataView(payloadOnly);
    for (let i = 0; i < 32; i++) pView.setUint8(i, i);

    const expected = computeChecksum(payloadOnly, 0);
    expect(result).toEqual(expected);
  });

  it('data before seek offset is ignored', () => {
    // Two firmware buffers with same data after seek but different data before
    const fw1 = new ArrayBuffer(48);
    const fw2 = new ArrayBuffer(48);
    const v1 = new DataView(fw1);
    const v2 = new DataView(fw2);

    // Different data in first 16 bytes
    for (let i = 0; i < 16; i++) {
      v1.setUint8(i, 0xaa);
      v2.setUint8(i, 0x55);
    }
    // Same data after offset 16
    for (let i = 16; i < 48; i++) {
      v1.setUint8(i, i);
      v2.setUint8(i, i);
    }

    const checksum1 = computeChecksum(fw1, 16);
    const checksum2 = computeChecksum(fw2, 16);
    expect(checksum1).toEqual(checksum2);
  });

  it('identical inputs produce identical outputs', () => {
    const firmware = new ArrayBuffer(64);
    const view = new DataView(firmware);
    for (let i = 0; i < 64; i++) view.setUint8(i, (i * 7) & 0xff);

    const result1 = computeChecksum(firmware, 0);
    const result2 = computeChecksum(firmware, 0);
    expect(result1).toEqual(result2);
  });

  it('different inputs produce different outputs', () => {
    const fw1 = new ArrayBuffer(32);
    const fw2 = new ArrayBuffer(32);
    const v1 = new DataView(fw1);
    const v2 = new DataView(fw2);

    for (let i = 0; i < 32; i++) {
      v1.setUint8(i, i);
      v2.setUint8(i, i + 1);
    }

    const checksum1 = computeChecksum(fw1, 0);
    const checksum2 = computeChecksum(fw2, 0);
    expect(checksum1).not.toEqual(checksum2);
  });
});
