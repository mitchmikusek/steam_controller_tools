import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ControllerInfo } from '@scflash/protocol';
import { Modal } from './Modal';
import { fmtRev } from '../utils/firmware';

interface Props {
  info: ControllerInfo;
  onReadInfo?: () => Promise<ControllerInfo | null>;
}

export function InfoButton({ info, onReadInfo }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [reading, setReading] = useState(false);
  const [freshInfo, setFreshInfo] = useState<ControllerInfo | null>(null);

  const handleOpen = async () => {
    setOpen(true);
    setFreshInfo(null);
    if (!onReadInfo) return;
    setReading(true);
    try {
      const result = await onReadInfo();
      setFreshInfo(result);
    } finally {
      setReading(false);
    }
  };

  const display = freshInfo ?? info;

  return (
    <>
      <button className="btn-ghost btn-sm btn-info-circle" onClick={handleOpen} aria-label={t('firmware.details')}>
        i
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={t('firmware.details')}>
        <Row label={t('firmware.firmware')} value={fmtRev(display.firmwareRev)} loading={reading} />
        <Row label={t('firmware.radio')} value={fmtRev(display.radioRev)} loading={reading} />
        <Row label={t('firmware.bootloader')} value={fmtRev(display.bootloaderRev)} loading={reading} />
        <Row
          label={t('firmware.usbPid')}
          value={`0x${display.usbPid.toString(16).padStart(4, '0')}`}
          loading={reading}
        />
      </Modal>
    </>
  );
}

function Row({ label, value, loading }: { label: string; value: string; loading?: boolean }) {
  return (
    <div className="section-row">
      <div className="section-row-label">{label}</div>
      {loading ? <div className="check-spinner" /> : <div className="section-row-value">{value}</div>}
    </div>
  );
}
