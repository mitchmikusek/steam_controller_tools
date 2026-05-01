/**
 * CRC-128 checksum used by the Steam Controller bootloader to verify LPC firmware.
 * Ported from SteamController.py ChecksumFirmwareFile().
 *
 * Reads 16-byte blocks starting at `seekOffset`, treating each as 4 little-endian uint32s.
 * Returns a 16-byte Uint8Array (the checksum packed as 4 LE uint32s).
 */
export function computeChecksum(firmware: ArrayBuffer, seekOffset: number): Uint8Array {
  const view = new DataView(firmware);
  const remaining = firmware.byteLength - seekOffset;
  const blockCount = Math.floor(remaining / 16);

  let c0 = 0;
  let c1 = 0;
  let c2 = 0;
  let c3 = 0;

  for (let block = 0; block < blockCount; block++) {
    const offset = seekOffset + block * 16;
    const w0 = view.getUint32(offset, true);
    const w1 = view.getUint32(offset + 4, true);
    const w2 = view.getUint32(offset + 8, true);
    const w3 = view.getUint32(offset + 12, true);

    const save = (c1 << 31) >>> 0;

    // c1 = (c2 << 0x1f ^ c1 >> 1 ^ w1) masked to 32-bit
    c1 = ((c2 << 31) ^ (c1 >>> 1) ^ w1) >>> 0;

    // c2 = (w2 ^ (c2 >> 1 | c3 << 0x1f)) masked to 32-bit
    c2 = (w2 ^ ((c2 >>> 1) | (c3 << 31))) >>> 0;

    // c3 complex expression:
    // t = (((c0 << 0x19 ^ c0) * 4 ^ c0) * 4 ^ w3)
    // c3 = (t & 0x80000000 ^ c0 << 0x1f | w3 & 0x7fffffff ^ c3 >> 1)
    let t = ((c0 << 25) ^ c0) >>> 0;
    t = ((t << 2) ^ c0) >>> 0;
    t = ((t << 2) ^ w3) >>> 0;
    c3 = (((t & 0x80000000) ^ (c0 << 31)) | ((w3 & 0x7fffffff) ^ (c3 >>> 1))) >>> 0;

    // c0 = ((c0 >> 1 | save) ^ w0) masked to 32-bit
    c0 = (((c0 >>> 1) | save) ^ w0) >>> 0;
  }

  // Pack as 4 little-endian uint32s
  const result = new Uint8Array(16);
  const resultView = new DataView(result.buffer);
  resultView.setUint32(0, c0, true);
  resultView.setUint32(4, c1, true);
  resultView.setUint32(8, c2, true);
  resultView.setUint32(12, c3, true);

  return result;
}
