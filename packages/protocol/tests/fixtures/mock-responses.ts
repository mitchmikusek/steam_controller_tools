import { REPORT_SIZE } from '../../src/constants.js';

/**
 * Build a controller info response (0x83).
 * Struct layout:
 *   Offset 0:  protoId (0x83)
 *   Offset 8:  USB PID (u16 LE)
 *   Offset 18: bootloader rev (u32 LE)
 *   Offset 23: firmware rev (u32 LE)
 *   Offset 28: radio rev (u32 LE)
 */
export function makeInfoResponse(pid: number, bootRev: number, fwRev: number, radioRev: number): number[] {
  const buf = new Array(REPORT_SIZE).fill(0);
  buf[0] = 0x83;

  // USB PID at offset 8 (u16 LE)
  buf[8] = pid & 0xff;
  buf[9] = (pid >> 8) & 0xff;

  // Bootloader rev at offset 18 (u32 LE)
  buf[18] = bootRev & 0xff;
  buf[19] = (bootRev >> 8) & 0xff;
  buf[20] = (bootRev >> 16) & 0xff;
  buf[21] = (bootRev >> 24) & 0xff;

  // Firmware rev at offset 23 (u32 LE)
  buf[23] = fwRev & 0xff;
  buf[24] = (fwRev >> 8) & 0xff;
  buf[25] = (fwRev >> 16) & 0xff;
  buf[26] = (fwRev >> 24) & 0xff;

  // Radio rev at offset 28 (u32 LE)
  buf[28] = radioRev & 0xff;
  buf[29] = (radioRev >> 8) & 0xff;
  buf[30] = (radioRev >> 16) & 0xff;
  buf[31] = (radioRev >> 24) & 0xff;

  return buf;
}

/** SWD ready response: [0x94, 0x06, 0x00, 0x00, 0xfc, 0x03] */
export function makeSwdReadyResponse(): number[] {
  const buf = new Array(REPORT_SIZE).fill(0);
  buf[0] = 0x94;
  buf[1] = 0x06;
  buf[2] = 0x00;
  buf[3] = 0x00;
  buf[4] = 0xfc;
  buf[5] = 0x03;
  return buf;
}

/** SWD in-progress response: starts with 0x94 but different payload */
export function makeSwdInProgressResponse(): number[] {
  const buf = new Array(REPORT_SIZE).fill(0);
  buf[0] = 0x94;
  buf[1] = 0x06;
  buf[2] = 0x00;
  buf[3] = 0x00;
  buf[4] = 0x01;
  buf[5] = 0x01;
  return buf;
}

/** LPC erase complete response: [0x94, 0x02] */
export function makeEraseResponse(): number[] {
  const buf = new Array(REPORT_SIZE).fill(0);
  buf[0] = 0x94;
  buf[1] = 0x02;
  return buf;
}

/** LPC verify success response: [0x94, 0x02, 0x00] */
export function makeVerifySuccessResponse(): number[] {
  const buf = new Array(REPORT_SIZE).fill(0);
  buf[0] = 0x94;
  buf[1] = 0x02;
  buf[2] = 0x00;
  return buf;
}

/** LPC verify failure response: [0x94, 0x02, 0x01] */
export function makeVerifyFailResponse(): number[] {
  const buf = new Array(REPORT_SIZE).fill(0);
  buf[0] = 0x94;
  buf[1] = 0x02;
  buf[2] = 0x01;
  return buf;
}
