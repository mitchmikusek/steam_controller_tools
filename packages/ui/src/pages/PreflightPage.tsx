import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ControllerInfo } from '@scflash/protocol';
import type { FirmwareChoice } from './ChooseFirmwarePage';
import { BackLink } from '../components/BackLink';
import { detectFirmwareType } from '../utils/firmware';

interface Check {
  label: string;
  status: 'pass' | 'fail';
  detail?: string;
}

const FW_FILES: Record<string, string[]> = {
  ble: [
    'fw_images/ble/vcf_wired_controller_d0g_5b0f21bd.bin',
    'fw_images/ble/s110_nrf51_8.0.0_softdevice.bin',
    'fw_images/ble/vcf_wired_controller_d0g_5a0e3f348_radio.bin',
  ],
  production: [
    'fw_images/production/vcf_wired_controller_d0g.bin',
    'fw_images/production/d0g_bootloader.bin',
    'fw_images/production/d0g_module.bin',
  ],
};

interface Props {
  choice: FirmwareChoice;
  info: ControllerInfo | null;
  isConnected: boolean;
  onBack: () => void;
  onBegin: () => void;
}

export function PreflightPage({ choice, info, isConnected, onBack, onBegin }: Props) {
  const { t } = useTranslation();
  const [visibleChecks, setVisibleChecks] = useState(0);
  const [resolvedChecks, setResolvedChecks] = useState(0);
  const [showExtras, setShowExtras] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [fwCheckStatus, setFwCheckStatus] = useState<'checking' | 'pass' | 'fail'>('checking');
  const [fwCheckDetail, setFwCheckDetail] = useState<string | undefined>();

  useEffect(() => {
    if (choice === 'custom') {
      setFwCheckStatus('pass');
      return;
    }
    const files = FW_FILES[choice] ?? [];
    Promise.all(
      files.map(async (url) => {
        const res = await fetch(url, { method: 'HEAD' });
        if (!res.ok) throw new Error(`${url}: ${res.status}`);
      }),
    )
      .then(() => setFwCheckStatus('pass'))
      .catch((e) => {
        setFwCheckStatus('fail');
        setFwCheckDetail(`${e.message}`);
      });
  }, [choice]);

  const fwLabel =
    choice === 'custom'
      ? t('preflight.customSelected')
      : choice === 'ble'
        ? t('preflight.bleBundled')
        : t('preflight.prodBundled');

  const checks: Check[] = [
    'hid' in navigator
      ? { label: t('preflight.webhidSupported'), status: 'pass' }
      : { label: t('preflight.webhidNotSupported'), status: 'fail', detail: t('preflight.webhidDetail') },
    isConnected
      ? { label: t('preflight.controllerConnected'), status: 'pass' }
      : { label: t('preflight.controllerNotConnected'), status: 'fail', detail: t('preflight.controllerDetail') },
    { label: fwLabel, status: fwCheckStatus === 'checking' ? 'pass' : fwCheckStatus, detail: fwCheckDetail },
  ];

  const allPass = checks.every((c) => c.status === 'pass') && fwCheckStatus === 'pass';

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

  const currentType = useMemo(() => {
    if (!info) return t('badge.unknown', 'Unknown');
    const ft = detectFirmwareType(info);
    return ft === 'ble' ? 'BLE' : ft === 'production' ? 'Production' : t('badge.unknown', 'Unknown');
  }, [info, t]);
  const targetType = choice === 'ble' ? 'BLE' : choice === 'production' ? 'Production' : 'Custom';

  const warnings = [
    t('preflight.warnNoUnplug'),
    t('preflight.warnCloseSteam'),
    t('preflight.warnDuration'),
    ...(choice === 'production' ? [t('preflight.warnRemoveBle')] : []),
  ];

  return (
    <div className="page page-narrow">
      <BackLink onClick={onBack} />
      <div className="page-heading">{t('preflight.title')}</div>

      <div className="section">
        <div className="section-title">{t('preflight.systemChecks')}</div>
        {checks.map((check, i) => (
          <div key={i} className={`section-row check-item-animated${i < visibleChecks ? ' visible' : ''}`}>
            <div>
              <div className="section-row-label">{check.label}</div>
              {check.detail && <div className="section-row-sublabel">{check.detail}</div>}
            </div>
            {i < resolvedChecks ? (
              <div className={`check-icon ${check.status}`}>{check.status === 'pass' ? '✓' : '✗'}</div>
            ) : i < visibleChecks ? (
              <div className="check-spinner" />
            ) : null}
          </div>
        ))}
      </div>

      <div className={`section preflight-extra${showExtras ? ' visible' : ''}`}>
        <div className="section-title">⚠ {t('preflight.warningsTitle', 'Before You Begin')}</div>
        {warnings.map((w, i) => (
          <div key={i} className="section-row" style={{ color: 'var(--yellow)', fontSize: '0.75rem' }}>
            <span>{w}</span>
          </div>
        ))}
      </div>

      {info && (
        <div className={`section preflight-extra${showExtras ? ' visible' : ''}`}>
          <div className="section-title">{t('preflight.summary')}</div>
          <div className="summary-row">
            <span className="summary-label">{t('preflight.firmware')}</span>
            <span className="summary-values">
              <span className="summary-value" title={info ? `0x${info.firmwareRev.toString(16)}` : ''}>
                {currentType}
              </span>
              <span
                style={{ color: 'var(--blue)', margin: '0 8px', fontSize: '0.7rem', position: 'relative', top: -2 }}
              >
                →
              </span>
              <span className="summary-value">{targetType}</span>
            </span>
          </div>
        </div>
      )}

      <div className="nav-row" style={{ marginBottom: 32 }}>
        <div className="spacer" />
        <button
          className="btn-green"
          onClick={onBegin}
          disabled={!allPass || !showButton}
          style={{ opacity: showButton ? 1 : 0, transition: 'opacity 0.4s ease' }}
        >
          {t('preflight.beginFlash')}
        </button>
      </div>
    </div>
  );
}
export default PreflightPage;
