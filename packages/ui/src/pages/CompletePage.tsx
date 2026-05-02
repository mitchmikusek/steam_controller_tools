import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ControllerInfo } from '@scflash/protocol';
import { LogoRing } from '../components/LogoRing';
import { SectionRow } from '../components/SectionRow';
import { InfoButton } from '../components/InfoButton';
import { BleHelpModal } from '../components/BleHelpModal';

interface Props {
  success: boolean;
  error?: string;
  firmwareType: string;
  info: ControllerInfo | null;
  onHome: () => void;
}

export function CompletePage({ success, error, firmwareType, info, onHome }: Props) {
  const { t } = useTranslation();
  const [bleHelpOpen, setBleHelpOpen] = useState(false);

  return (
    <div className="page page-wide">
      <div className="flash-center">
        <LogoRing state={success ? 'complete' : 'error'} />
        <div className="result-title">{success ? t('complete.flashComplete') : t('complete.flashFailed')}</div>

        <div className="section" style={{ width: '100%' }}>
          {success ? (
            <>
              <SectionRow label={t('complete.firmwareInstalled', { type: firmwareType })}>
                {info && <InfoButton info={info} />}
              </SectionRow>
              {firmwareType === 'BLE' && (
                <SectionRow label={t('complete.controllerModes')}>
                  <button className="btn-ghost btn-sm" onClick={() => setBleHelpOpen(true)}>
                    {t('complete.viewBleModes')}
                  </button>
                </SectionRow>
              )}
            </>
          ) : (
            <>
              <div className="section-title">{t('complete.error')}</div>
              <div role="alert" style={{ fontSize: '0.7rem', color: 'var(--red)', fontFamily: 'Consolas,SF Mono,monospace', wordBreak: 'break-all' }}>
                {error}
              </div>
              <div className="result-tip" style={{ marginTop: 10 }}>
                {t('complete.recoveryTip')}
              </div>
            </>
          )}
        </div>

        <button className="btn-blue" style={{ marginTop: 24 }} onClick={onHome}>
          {t('complete.returnHome')}
        </button>
      </div>

      <BleHelpModal open={bleHelpOpen} onClose={() => setBleHelpOpen(false)} />
    </div>
  );
}
export default CompletePage;
