import { useEffect, useState } from 'react';
import type { ControllerInfo } from '@scflash/protocol';
import type { FirmwareChoice } from './ChooseFirmwarePage';
import { BackLink } from '../components/BackLink';
import { detectFirmwareType } from '../utils/firmware';

interface Check {
  label: string;
  status: 'pass' | 'fail';
  detail?: string;
}

interface Props {
  choice: FirmwareChoice;
  info: ControllerInfo | null;
  isConnected: boolean;
  onBack: () => void;
  onBegin: () => void;
}

export function PreflightPage({ choice, info, isConnected, onBack, onBegin }: Props) {
  const [visibleChecks, setVisibleChecks] = useState(0);
  const [resolvedChecks, setResolvedChecks] = useState(0);
  const [showExtras, setShowExtras] = useState(false);
  const [showButton, setShowButton] = useState(false);

  const checks: Check[] = [
    'hid' in navigator
      ? { label: 'WebHID supported', status: 'pass' }
      : { label: 'WebHID not supported', status: 'fail', detail: 'Use Chrome, Edge, or Vivaldi' },
    isConnected
      ? { label: 'Controller connected', status: 'pass' }
      : { label: 'Controller not connected', status: 'fail', detail: 'Plug in via USB and connect' },
    { label: choice === 'custom' ? 'Custom firmware files selected' : `${choice === 'ble' ? 'BLE' : 'Production'} firmware bundled`, status: 'pass' },
  ];

  const allPass = checks.every(c => c.status === 'pass');

  // Sequential animation
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    let delay = 200;

    for (let i = 0; i < checks.length; i++) {
      timers.push(setTimeout(() => setVisibleChecks(i + 1), delay));
      delay += 1000;
      timers.push(setTimeout(() => setResolvedChecks(i + 1), delay));
      delay += 500;
    }

    timers.push(setTimeout(() => setShowExtras(true), delay + 200));
    timers.push(setTimeout(() => setShowButton(true), delay + 600));

    return () => timers.forEach(clearTimeout);
  }, []);

  // Summary
  const currentType = info ? (() => {
    const t = detectFirmwareType(info);
    return t === 'ble' ? 'BLE' : t === 'production' ? 'Production' : 'Unknown';
  })() : 'Unknown';
  const targetType = choice === 'ble' ? 'BLE' : choice === 'production' ? 'Production' : 'Custom';

  const warnings = [
    'Do not unplug the controller during flashing.',
    'The process takes approximately 30 seconds. You will be prompted along the way.',
    'If flashing fails, recovery is possible via bootloader mode.',
    ...(choice === 'production' ? ['This will remove Bluetooth (BLE) support.'] : []),
  ];

  return (
    <div className="page page-narrow">
      <BackLink onClick={onBack} />
      <div className="page-heading">Pre-flight Checks</div>

      <div className="section">
        <div className="section-title">System Checks</div>
        {checks.map((check, i) => (
          <div key={i} className={`section-row check-item-animated${i < visibleChecks ? ' visible' : ''}`}>
            <div>
              <div className="section-row-label">{check.label}</div>
              {check.detail && <div className="section-row-sublabel">{check.detail}</div>}
            </div>
            {i < resolvedChecks ? (
              <div className={`check-icon ${check.status}`}>
                {check.status === 'pass' ? '✓' : '✗'}
              </div>
            ) : i < visibleChecks ? (
              <div className="check-spinner" />
            ) : null}
          </div>
        ))}
      </div>

      <div className={`warning-box preflight-extra${showExtras ? ' visible' : ''}`}>
        {warnings.map((w, i) => (
          <div key={i} style={{ marginBottom: 4 }}>⚠ {w}</div>
        ))}
      </div>

      {info && (
        <div className={`section preflight-extra${showExtras ? ' visible' : ''}`}>
          <div className="section-title">Summary</div>
          <div className="summary-row">
            <span className="summary-label">Firmware</span>
            <span className="summary-values">
              <span className="summary-value" title={info ? `0x${info.firmwareRev.toString(16)}` : ''}>{currentType}</span>
              <span style={{ color: 'var(--blue)', margin: '0 8px', fontSize: '0.7rem', position: 'relative', top: -2 }}>→</span>
              <span className="summary-value">{targetType}</span>
            </span>
          </div>
        </div>
      )}

      <div className="nav-row">
        <div className="spacer" />
        <button
          className="btn-green"
          onClick={onBegin}
          disabled={!allPass || !showButton}
          style={{ opacity: showButton ? 1 : 0, transition: 'opacity 0.4s ease' }}
        >
          Begin Flash
        </button>
      </div>
    </div>
  );
}
