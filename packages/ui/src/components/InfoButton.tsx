import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (!open || !onReadInfo || info.radioRev !== 0) return;
    let cancelled = false;
    setReading(true);
    onReadInfo().finally(() => {
      if (!cancelled) setReading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <>
      <button
        className="btn-ghost btn-sm btn-info-circle"
        onClick={() => setOpen(true)}
        aria-label={t('firmware.details')}
      >
        i
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={t('firmware.details')}>
        <Row label={t('firmware.firmware')} value={fmtRev(info.firmwareRev)} />
        <Row label={t('firmware.radio')} value={fmtRev(info.radioRev)} loading={reading && info.radioRev === 0} />
        <Row label={t('firmware.bootloader')} value={fmtRev(info.bootloaderRev)} />
        <Row label={t('firmware.usbPid')} value={`0x${info.usbPid.toString(16).padStart(4, '0')}`} />
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
