import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ControllerInfo, ControllerDevice } from '@scflash/protocol';
import { JINGLES } from '@scflash/protocol';
import { SectionTitle } from '../components/SectionTitle';
import { SectionRow } from '../components/SectionRow';
import { Badge } from '../components/Badge';
import { InfoButton } from '../components/InfoButton';
import { BleHelpModal } from '../components/BleHelpModal';
import { detectFirmwareType } from '../utils/firmware';
import { logger } from '../utils/logger';

interface Props {
  info: ControllerInfo | null;
  controller: ControllerDevice | null;
  mode: 'normal' | 'bootloader';
  onDisconnect: () => void;
  onFlash: () => void;
}

export function HomePage({ info, controller, mode, onDisconnect, onFlash }: Props) {
  const { t } = useTranslation();
  const [bleHelpOpen, setBleHelpOpen] = useState(false);
  const fwType = info ? detectFirmwareType(info) : 'unknown';
  const badgeType =
    mode === 'bootloader' ? 'bootloader' : fwType === 'ble' ? 'ble' : fwType === 'production' ? 'prod' : 'unknown';

  const fwLabel =
    fwType === 'ble'
      ? t('home.bleFirmware')
      : fwType === 'production'
        ? t('home.productionFirmware')
        : t('home.unknownFirmware');

  return (
    <div className="page page-narrow">
      <div className="section">
        <SectionTitle>
          {t('badge.controller', 'Controller')} <Badge type={badgeType} />
        </SectionTitle>

        <div className="section-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className={`conn-dot ${mode === 'normal' ? 'ok' : 'warn'}`} />
            <span className="section-row-label">
              {mode === 'bootloader' ? t('home.bootloaderMode') : t('home.connected')}
            </span>
          </div>
          <button className="btn-ghost btn-sm" onClick={onDisconnect}>
            {t('home.disconnect')}
          </button>
        </div>

        {mode === 'normal' && info && (
          <SectionRow label={fwLabel}>
            <InfoButton info={info} />
          </SectionRow>
        )}

        {mode === 'bootloader' && (
          <div className="section-row">
            <div className="section-row-label" style={{ fontSize: '0.75rem' }}>
              {t('home.noFirmware')}
            </div>
          </div>
        )}

        <SectionRow label={t('home.flashFirmware')} sublabel={t('home.flashSublabel')}>
          <button className="btn-blue" onClick={onFlash}>
            {t('home.flash')}
          </button>
        </SectionRow>
      </div>

      {mode === 'normal' && controller && (
        <div className="section">
          <SectionTitle>{t('home.extras')}</SectionTitle>

          <SectionRow label={t('home.controllerModes')}>
            <button className="btn-ghost btn-sm" onClick={() => setBleHelpOpen(true)}>
              {t('home.viewBleModes')}
            </button>
          </SectionRow>

          <SectionRow label={t('home.hapticFeedback')}>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['left', 'right'] as const).map((side) => (
                <button
                  key={side}
                  className="btn-ghost btn-sm"
                  onClick={async () => {
                    try {
                      await controller.hapticPulse(side, 65535, 65535, 2);
                    } catch (e) {
                      logger.error(`${e}`);
                    }
                  }}
                >
                  {t(`home.${side}`)}
                </button>
              ))}
            </div>
          </SectionRow>

          <SectionRow label={t('home.ledBrightness')}>
            <input
              type="range"
              min="0"
              max="100"
              defaultValue="100"
              aria-label={t('home.ledBrightness')}
              style={{ width: 160, accentColor: 'var(--blue)' }}
              onChange={async (e) => {
                try {
                  await controller.setBrightness(parseInt(e.target.value));
                } catch (err) {
                  logger.error(`${err}`);
                }
              }}
            />
          </SectionRow>

          <SectionTitle>{t('home.jingles')}</SectionTitle>
          <div className="jingle-grid">
            {JINGLES.map((name, i) => (
              <button
                key={i}
                className="btn-ghost btn-sm"
                onClick={async () => {
                  try {
                    await controller.playJingle(i);
                    logger.info(`Playing: ${name}`);
                  } catch (e) {
                    logger.error(`${e}`);
                  }
                }}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      <BleHelpModal open={bleHelpOpen} onClose={() => setBleHelpOpen(false)} />
    </div>
  );
}
export default HomePage;
