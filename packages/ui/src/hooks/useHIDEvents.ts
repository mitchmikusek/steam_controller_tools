import { useEffect, useCallback } from 'react';

interface UseHIDEventsProps {
  onDisconnect?: () => void;
  onConnect?: () => void;
  enabled?: boolean;
}

/**
 * Listen for WebHID connect/disconnect events.
 * Only fires for Valve devices (VID 0x28de).
 */
export function useHIDEvents({ onDisconnect, onConnect, enabled = true }: UseHIDEventsProps) {
  const handleDisconnect = useCallback(
    (e: HIDConnectionEvent) => {
      if (e.device.vendorId === 0x28de) {
        onDisconnect?.();
      }
    },
    [onDisconnect],
  );

  const handleConnect = useCallback(
    (e: HIDConnectionEvent) => {
      if (e.device.vendorId === 0x28de) {
        onConnect?.();
      }
    },
    [onConnect],
  );

  useEffect(() => {
    if (!enabled || !('hid' in navigator)) return;

    navigator.hid.addEventListener('disconnect', handleDisconnect);
    navigator.hid.addEventListener('connect', handleConnect);

    return () => {
      navigator.hid.removeEventListener('disconnect', handleDisconnect);
      navigator.hid.removeEventListener('connect', handleConnect);
    };
  }, [enabled, handleDisconnect, handleConnect]);
}
