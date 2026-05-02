import { useTranslation } from 'react-i18next';
import { Modal } from './Modal';
import { BleHelpContent } from './BleHelpContent';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function BleHelpModal({ open, onClose }: Props) {
  const { t } = useTranslation();
  return (
    <Modal open={open} onClose={onClose} title={t('bleHelp.title')}>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: 12 }}>
        {t('bleHelp.subtitle')}
      </div>
      <BleHelpContent />
    </Modal>
  );
}
