import { Modal } from './Modal';
import { BleHelpContent } from './BleHelpContent';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function BleHelpModal({ open, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="BLE Controller Modes">
      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: 12 }}>
        Hold a button + Steam to switch modes (BLE firmware only)
      </div>
      <BleHelpContent />
    </Modal>
  );
}
