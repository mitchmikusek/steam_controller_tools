import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ControllerInfo } from '@scflash/protocol';
import { Modal } from './Modal';
import { fmtRev } from '../utils/firmware';

interface Props {
  info: ControllerInfo;
}

export function InfoButton({ info }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="btn-ghost btn-sm btn-info-circle" onClick={() => setOpen(true)} aria-label={t('firmware.details')}>
        i
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={t('firmware.details')}>
        <Row label={t('firmware.firmware')} value={fmtRev(info.firmwareRev)} />
        <Row label={t('firmware.radio')} value={fmtRev(info.radioRev)} />
        <Row label={t('firmware.bootloader')} value={fmtRev(info.bootloaderRev)} />
        <Row label={t('firmware.usbPid')} value={`0x${info.usbPid.toString(16).padStart(4, '0')}`} />
      </Modal>
    </>
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
