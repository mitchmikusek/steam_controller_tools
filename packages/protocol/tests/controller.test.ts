import { describe, it, expect } from 'vitest';
import { ControllerDevice } from '../src/controller.js';
import { MockHIDTransport } from '../src/hid-transport.js';
import { SCProtocolId } from '../src/constants.js';
import { makeInfoResponse, makeSwdReadyResponse, makeSwdInProgressResponse } from './fixtures/mock-responses.js';

describe('ControllerDevice', () => {
  describe('info()', () => {
    it('parses controller info response correctly', async () => {
      const transport = new MockHIDTransport();
      const controller = new ControllerDevice(transport);

      const pid = 0x1102;
      const bootRev = 0x00000005;
      const fwRev = 0x01391001;
      const radioRev = 0x0000001a;

      transport.queueResponse(makeInfoResponse(pid, bootRev, fwRev, radioRev));

      const info = await controller.info();
      expect(info.usbPid).toBe(pid);
      expect(info.bootloaderRev).toBe(bootRev);
      expect(info.firmwareRev).toBe(fwRev);
      expect(info.radioRev).toBe(radioRev);
    });

    it('sends the correct command byte for info request', async () => {
      const transport = new MockHIDTransport();
      const controller = new ControllerDevice(transport);

      transport.queueResponse(makeInfoResponse(0x1102, 1, 2, 3));

      await controller.info();

      // First send should be the info request
      expect(transport.sent[0][0]).toBe(SCProtocolId.ControllerInfoRequest);
    });
  });

  describe('hapticPulse()', () => {
    it('sends correct command bytes for left haptic', async () => {
      const transport = new MockHIDTransport();
      const controller = new ControllerDevice(transport);

      await controller.hapticPulse('left', 500, 250, 10);

      const sent = transport.sent[0];
      expect(sent[0]).toBe(SCProtocolId.TriggerHapticPulse);
      expect(sent[1]).toBe(0x07); // length byte
      expect(sent[2]).toBe(1);   // left = 1
      // highDuration = 500 = 0x01F4 LE
      expect(sent[3]).toBe(0xf4);
      expect(sent[4]).toBe(0x01);
      // lowDuration = 250 = 0x00FA LE
      expect(sent[5]).toBe(0xfa);
      expect(sent[6]).toBe(0x00);
      // repeat = 10 = 0x000A LE
      expect(sent[7]).toBe(0x0a);
      expect(sent[8]).toBe(0x00);
    });

    it('sends correct command bytes for right haptic', async () => {
      const transport = new MockHIDTransport();
      const controller = new ControllerDevice(transport);

      await controller.hapticPulse('right', 100, 200, 5);

      const sent = transport.sent[0];
      expect(sent[0]).toBe(SCProtocolId.TriggerHapticPulse);
      expect(sent[2]).toBe(0);   // right = 0
    });
  });

  describe('swdStart()', () => {
    it('sends SWD init command and recognizes ready response', async () => {
      const transport = new MockHIDTransport();
      const controller = new ControllerDevice(transport);

      // Queue the ready response
      transport.queueResponse(makeSwdReadyResponse());

      await controller.swdStart(5000);

      // Verify the init command was sent
      const sent = transport.sent[0];
      expect(sent[0]).toBe(SCProtocolId.SendIRCode);
      expect(sent[1]).toBe(0x04);
      expect(sent[2]).toBe(0x17);
      expect(sent[3]).toBe(0xed);
      expect(sent[4]).toBe(0xfe);
      expect(sent[5]).toBe(0xd0);
    });

    it('polls until ready response is received', async () => {
      const transport = new MockHIDTransport();
      const controller = new ControllerDevice(transport);

      // Queue in-progress responses followed by ready
      transport.queueResponse(makeSwdInProgressResponse());
      transport.queueResponse(makeSwdInProgressResponse());
      transport.queueResponse(makeSwdReadyResponse());

      await controller.swdStart(5000);

      // Should have succeeded after polling through in-progress responses
      expect(transport.sent).toHaveLength(1); // Only the initial send command
    });

    it('throws on unexpected non-0x94 response', async () => {
      const transport = new MockHIDTransport();
      const controller = new ControllerDevice(transport);

      // Queue a response that doesn't start with 0x94
      const badResponse = new Array(64).fill(0);
      badResponse[0] = 0xff;
      badResponse[1] = 0x01;
      transport.queueResponse(badResponse);

      await expect(controller.swdStart(1000)).rejects.toThrow('SWD start unexpected response');
    });
  });
});
