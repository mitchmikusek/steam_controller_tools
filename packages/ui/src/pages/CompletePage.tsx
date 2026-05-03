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
              <div className="result-tip" role="alert">
                {t('complete.errorHint')}
              </div>
              <div className="result-tip" style={{ marginTop: 10 }}>
                {t('complete.recoveryTip')}
              </div>
              {error && (
                <details style={{ marginTop: 12, fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                  <summary style={{ cursor: 'pointer' }}>{t('complete.errorDetails')}</summary>
                  <div
                    style={{
                      marginTop: 6,
                      color: 'var(--red)',
                      fontFamily: 'Consolas,SF Mono,monospace',
                      wordBreak: 'break-all',
                    }}
                  >
                    {error}
                  </div>
                </details>
              )}
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
