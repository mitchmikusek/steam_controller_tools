import { useState } from 'react';
import type { ControllerInfo, ControllerDevice } from '@scflash/protocol';
import { JINGLES } from '@scflash/protocol';
import { SectionTitle } from '../components/SectionTitle';
import { SectionRow } from '../components/SectionRow';
import { Badge } from '../components/Badge';
import { InfoButton } from '../components/InfoButton';
import { BleHelpModal } from '../components/BleHelpModal';
import { detectFirmwareType, fmtFirmwareLabel } from '../utils/firmware';
import { logger } from '../utils/logger';

interface Props {
  info: ControllerInfo | null;
  controller: ControllerDevice | null;
  mode: 'normal' | 'bootloader';
  onDisconnect: () => void;
  onFlash: () => void;
}

export function HomePage({ info, controller, mode, onDisconnect, onFlash }: Props) {
  const [bleHelpOpen, setBleHelpOpen] = useState(false);
  const fwType = info ? detectFirmwareType(info) : 'unknown';
  const badgeType = mode === 'bootloader' ? 'bootloader' : fwType === 'ble' ? 'ble' : fwType === 'production' ? 'prod' : 'unknown';

  return (
    <div className="page page-narrow">
      {/* Controller section */}
      <div className="section">
        <SectionTitle>
          Controller <Badge type={badgeType} />
        </SectionTitle>

        {/* Connection status */}
        <div className="section-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className={`conn-dot ${mode === 'normal' ? 'ok' : 'warn'}`} />
            <span className="section-row-label">
              {mode === 'bootloader' ? 'Bootloader Mode' : 'Connected'}
            </span>
          </div>
          <button className="btn-ghost btn-sm" onClick={onDisconnect}>Disconnect</button>
        </div>

        {/* Firmware info (normal mode) */}
        {mode === 'normal' && info && (
          <SectionRow label={fmtFirmwareLabel(fwType)}>
            <InfoButton info={info} />
          </SectionRow>
        )}

        {/* Bootloader message */}
        {mode === 'bootloader' && (
          <div className="section-row">
            <div className="section-row-label" style={{ fontSize: '0.75rem' }}>
              No firmware loaded. Flash firmware to restore.
            </div>
          </div>
        )}

        {/* Flash button */}
        <SectionRow label="Flash Firmware" sublabel="Switch between BLE and Production">
          <button className="btn-blue" onClick={onFlash}>Flash</button>
        </SectionRow>
      </div>

      {/* Extras section (normal mode only) */}
      {mode === 'normal' && controller && (
        <div className="section">
          <SectionTitle>Extras</SectionTitle>

          {/* BLE Modes */}
          {fwType === 'ble' && (
            <SectionRow label="Controller Modes">
              <button className="btn-ghost btn-sm" onClick={() => setBleHelpOpen(true)}>
                View BLE Modes
              </button>
            </SectionRow>
          )}

          {/* Haptics */}
          <SectionRow label="Haptic Feedback">
            <div style={{ display: 'flex', gap: 6 }}>
              {(['left', 'right'] as const).map(side => (
                <button key={side} className="btn-ghost btn-sm" onClick={async () => {
                  try { await controller.hapticPulse(side, 65535, 65535, 2); }
                  catch (e) { logger.error(`${e}`); }
                }}>
                  {side === 'left' ? 'Left' : 'Right'}
                </button>
              ))}
            </div>
          </SectionRow>

          {/* Brightness */}
          <SectionRow label="LED Brightness">
            <input
              type="range" min="0" max="100" defaultValue="100"
              style={{ width: 160, accentColor: 'var(--blue)' }}
              onChange={async (e) => {
                try { await controller.setBrightness(parseInt(e.target.value)); }
                catch (err) { logger.error(`${err}`); }
              }}
            />
          </SectionRow>

          {/* Jingles */}
          <SectionTitle>Jingles</SectionTitle>
          <div className="jingle-grid">
            {JINGLES.map((name, i) => (
              <button key={i} className="btn-ghost btn-sm" onClick={async () => {
                try { await controller.playJingle(i); logger.info(`Playing: ${name}`); }
                catch (e) { logger.error(`${e}`); }
              }}>
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
