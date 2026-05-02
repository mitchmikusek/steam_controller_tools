import { useTranslation } from 'react-i18next';
import { VALVE_VID, type FlashProgress } from '@scflash/protocol';
import { LogoRing } from '../components/LogoRing';
import { ProgressBar } from '../components/ProgressBar';

interface Props {
  progress: FlashProgress | null;
  reconnectPid: number | null;
  onReconnect: () => void;
}

export function FlashingPage({ progress, reconnectPid, onReconnect }: Props) {
  const { t } = useTranslation();
  const isComplete = progress?.phase === 'Complete';
  const isWaiting = reconnectPid !== null;

  const statusText = isWaiting
    ? t('flashing.reconnectionRequired')
    : isComplete
      ? t('flashing.flashComplete')
      : progress
        ? `${progress.phase}...`
        : t('flashing.initializing');

  const pctText = isWaiting
    ? t('flashing.rebootedTo', { mode: reconnectPid === 0x1002 ? 'bootloader' : 'normal' })
    : isComplete
      ? t('flashing.complete')
      : t('flashing.percentComplete', { percent: progress?.percent ?? 0 });

  const barState = isWaiting ? ('waiting' as const) : isComplete ? ('complete' as const) : ('active' as const);
  const barPercent = isWaiting ? 100 : (progress?.percent ?? 0);

  const handleReconnectClick = async () => {
    if (!reconnectPid) return;
    try {
      const filters =
        reconnectPid === 0x1002
          ? [{ vendorId: VALVE_VID, productId: reconnectPid }]
          : [{ vendorId: VALVE_VID, productId: reconnectPid, usagePage: 0xff00 }];
      await navigator.hid.requestDevice({ filters });
      onReconnect();
    } catch {
      // User cancelled picker
    }
  };

  return (
    <div className="page page-wide">
      <div className="flash-center">
        <LogoRing state={isComplete ? 'complete' : 'spinning'} />

        <div className="flash-status" aria-live="polite" aria-atomic="true">
          {statusText}
        </div>

        <ProgressBar percent={barPercent} state={barState} />
        <div className="progress-pct" aria-live="polite">
          {pctText}
        </div>

        {isWaiting && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: 12 }}>
              {t('flashing.reconnectHint')}
            </div>
            <button className="btn-blue" onClick={handleReconnectClick}>
              {t('flashing.reconnect')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
export default FlashingPage;
