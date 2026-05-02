import { useState } from 'react';
import type { ControllerInfo } from '@scflash/protocol';
import { LogoRing } from '../components/LogoRing';
import { SectionRow } from '../components/SectionRow';
import { InfoButton } from '../components/InfoButton';
import { BleHelpModal } from '../components/BleHelpModal';
import { fmtFirmwareLabel, detectFirmwareType } from '../utils/firmware';

interface Props {
  success: boolean;
  error?: string;
  firmwareType: string;
  info: ControllerInfo | null;
  onHome: () => void;
}

export function CompletePage({ success, error, firmwareType, info, onHome }: Props) {
  const [bleHelpOpen, setBleHelpOpen] = useState(false);
  const fwType = info ? detectFirmwareType(info) : 'unknown';

  return (
    <div className="page page-wide">
      <div className="flash-center">
        <LogoRing state={success ? 'complete' : 'error'} />
        <div className="result-title">{success ? 'Flash Complete' : 'Flash Failed'}</div>

        <div className="section" style={{ width: '100%' }}>
          {success ? (
            <>
              <SectionRow label={`${firmwareType} Firmware Installed`}>
                {info && <InfoButton info={info} />}
              </SectionRow>
              {firmwareType === 'BLE' && (
                <SectionRow label="Controller Modes">
                  <button className="btn-ghost btn-sm" onClick={() => setBleHelpOpen(true)}>
                    View BLE Modes
                  </button>
                </SectionRow>
              )}
            </>
          ) : (
            <>
              <div className="section-title">Error</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--red)', fontFamily: 'Consolas,SF Mono,monospace', wordBreak: 'break-all' }}>
                {error}
              </div>
              <div className="result-tip" style={{ marginTop: 10 }}>
                The controller can be recovered by plugging it in while holding the right trigger (bootloader mode).
              </div>
            </>
          )}
        </div>

        <button className="btn-blue" style={{ marginTop: 24 }} onClick={onHome}>
          Return Home
        </button>
      </div>

      <BleHelpModal open={bleHelpOpen} onClose={() => setBleHelpOpen(false)} />
    </div>
  );
}
