import type { ControllerInfo } from '@scflash/protocol';
import { Modal } from './Modal';
import { fmtRev } from '../utils/firmware';

interface Props {
  open: boolean;
  onClose: () => void;
  info: ControllerInfo;
}

export function FirmwareInfoModal({ open, onClose, info }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Firmware Details">
      <Row label="Firmware" value={fmtRev(info.firmwareRev)} />
      <Row label="Radio" value={fmtRev(info.radioRev)} />
      <Row label="Bootloader" value={fmtRev(info.bootloaderRev)} />
      <Row label="USB PID" value={`0x${info.usbPid.toString(16).padStart(4, '0')}`} />
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="section-row">
      <div className="section-row-label">{label}</div>
      <div className="section-row-value">{value}</div>
    </div>
  );
}
