import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BleHelpModal } from './BleHelpModal';

export function BleModesButton() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn-ghost btn-sm" onClick={() => setOpen(true)}>
        {t('home.viewBleModes')}
      </button>
      <BleHelpModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
