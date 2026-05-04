import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ControllerInfo, ControllerDevice } from '@scflash/protocol';
import { JINGLES } from '@scflash/protocol';
import { SectionTitle } from '../components/SectionTitle';
import { SectionRow } from '../components/SectionRow';
import { Badge } from '../components/Badge';
import { InfoButton } from '../components/InfoButton';
import { Modal } from '../components/Modal';
import { detectFirmwareType } from '../utils/firmware';
import { logger } from '../utils/logger';

interface Props {
  info: ControllerInfo | null;
  controller: ControllerDevice | null;
  mode: 'normal' | 'bootloader';
  onReadInfo?: () => Promise<ControllerInfo | null>;
  onDisconnect: () => void;
  onFlash: () => void;
}

function useShortViewport() {
  return useState(() => window.matchMedia('(max-height: 700px)').matches)[0];
}

export function HomePage({ info, controller, mode, onReadInfo, onDisconnect, onFlash }: Props) {
  const { t } = useTranslation();
  const isShort = useShortViewport();
  const [confirmModal, setConfirmModal] = useState<'reset' | 'factory' | null>(null);
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
            <InfoButton info={info} onReadInfo={onReadInfo} />
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
          <details className="collapsible-section" open={!isShort || undefined}>
            <summary>
              {t('home.extras')} <span className="chevron">&#9660;</span>
            </summary>

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

            <SectionRow label={t('home.resetSettings')} sublabel={t('home.resetSettingsSub')}>
              <button className="btn-ghost btn-sm" onClick={() => setConfirmModal('reset')}>
                {t('home.reset')}
              </button>
            </SectionRow>

            <SectionRow label={t('home.factoryReset')} sublabel={t('home.factoryResetSub')}>
              <button
                className="btn-ghost btn-sm"
                style={{ color: 'var(--red)' }}
                onClick={() => setConfirmModal('factory')}
              >
                {t('home.reset')}
              </button>
            </SectionRow>
          </details>

          <details className="collapsible-section" open={!isShort || undefined}>
            <summary>
              {t('home.jingles')} <span className="chevron">&#9660;</span>
            </summary>
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
          </details>
        </div>
      )}
      <Modal open={confirmModal === 'reset'} onClose={() => setConfirmModal(null)} title={t('home.resetSettings')}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: 16 }}>
          {t('home.resetSettingsDetail')}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn-ghost" style={{ minWidth: 140 }} onClick={() => setConfirmModal(null)}>
            {t('home.cancel')}
          </button>
          <button
            className="btn-blue"
            style={{ minWidth: 140 }}
            onClick={async () => {
              try {
                await controller?.resetSettings();
                logger.info('Settings reset to defaults');
              } catch (e) {
                logger.error(`${e}`);
              }
              setConfirmModal(null);
            }}
          >
            {t('home.confirmReset')}
          </button>
        </div>
      </Modal>

      <Modal open={confirmModal === 'factory'} onClose={() => setConfirmModal(null)} title={t('home.factoryReset')}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: 16 }}>
          {t('home.factoryResetDetail')}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn-ghost" style={{ minWidth: 140 }} onClick={() => setConfirmModal(null)}>
            {t('home.cancel')}
          </button>
          <button
            className="btn-blue"
            style={{ minWidth: 140, background: 'var(--red)' }}
            onClick={async () => {
              try {
                await controller?.factoryReset();
                logger.info('Factory reset complete');
              } catch (e) {
                logger.error(`${e}`);
              }
              setConfirmModal(null);
            }}
          >
            {t('home.confirmFactoryReset')}
          </button>
        </div>
      </Modal>
    </div>
  );
}
export default HomePage;
