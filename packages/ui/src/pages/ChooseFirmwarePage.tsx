import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ControllerInfo } from '@scflash/protocol';
import { BackLink } from '../components/BackLink';
import { SelectCard } from '../components/SelectCard';
import { detectFirmwareType } from '../utils/firmware';

export type FirmwareChoice = 'ble' | 'production' | 'custom';

interface Props {
  info: ControllerInfo | null;
  onBack: () => void;
  onNext: (choice: FirmwareChoice, files?: { lpc: File; softdevice: File; radio: File }) => void;
}

export function ChooseFirmwarePage({ info, onBack, onNext }: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<FirmwareChoice | null>(null);
  const [lpcFile, setLpcFile] = useState<File | null>(null);
  const [softdeviceFile, setSoftdeviceFile] = useState<File | null>(null);
  const [radioFile, setRadioFile] = useState<File | null>(null);

  const installedType = info ? detectFirmwareType(info) : null;

  const canProceed = selected === 'custom'
    ? !!(lpcFile && softdeviceFile && radioFile)
    : !!selected;

  const handleNext = () => {
    if (!selected) return;
    if (selected === 'custom' && lpcFile && softdeviceFile && radioFile) {
      onNext(selected, { lpc: lpcFile, softdevice: softdeviceFile, radio: radioFile });
    } else {
      onNext(selected);
    }
  };

  const options: { id: FirmwareChoice; title: string; desc: string }[] = [
    { id: 'ble', title: t('choose.bleTitle'), desc: t('choose.bleDesc') },
    { id: 'production', title: t('choose.prodTitle'), desc: t('choose.prodDesc') },
    { id: 'custom', title: t('choose.customTitle'), desc: t('choose.customDesc') },
  ];

  return (
    <div className="page page-narrow">
      <BackLink onClick={onBack} />
      <div className="page-heading">{t('choose.title')}</div>

      {options.map(opt => (
        <SelectCard
          key={opt.id}
          title={opt.title}
          desc={opt.desc}
          selected={selected === opt.id}
          installed={installedType === opt.id}
          onClick={() => setSelected(opt.id)}
        />
      ))}

      {selected === 'custom' && (
        <div className="card" style={{ marginTop: 8 }}>
          <FileInput label="LPC Firmware (.bin)" onChange={setLpcFile} />
          <FileInput label="SoftDevice (.bin)" onChange={setSoftdeviceFile} />
          <FileInput label="Radio Application (.bin)" onChange={setRadioFile} />
        </div>
      )}

      <div className="nav-row">
        <div className="spacer" />
        <button className="btn-ghost" onClick={handleNext} disabled={!canProceed}>{t('choose.next')}</button>
      </div>
    </div>
  );
}

function FileInput({ label, onChange }: { label: string; onChange: (f: File | null) => void }) {
  return (
    <div className="file-group">
      <label>{label}</label>
      <input type="file" accept=".bin" onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
    </div>
  );
}
export default ChooseFirmwarePage;
