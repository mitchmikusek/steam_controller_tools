import { useState } from 'react';
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

const OPTIONS: { id: FirmwareChoice; title: string; desc: string }[] = [
  { id: 'ble', title: 'BLE (Bluetooth)', desc: 'Adds Bluetooth support while keeping dongle compatibility' },
  { id: 'production', title: 'Production', desc: 'Original firmware with dongle support only. Use if experiencing issues with BLE firmware.' },
  { id: 'custom', title: 'Custom Firmware', desc: 'Load your own firmware files' },
];

export function ChooseFirmwarePage({ info, onBack, onNext }: Props) {
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

  return (
    <div className="page page-narrow">
      <BackLink onClick={onBack} />

      <div className="page-heading">Choose Firmware</div>

      {OPTIONS.map(opt => (
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
        <button className="btn-ghost" onClick={handleNext} disabled={!canProceed}>Next</button>
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
