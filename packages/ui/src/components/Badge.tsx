interface Props {
  type: 'ble' | 'prod' | 'unknown' | 'bootloader';
}

const config = {
  ble: { className: 'badge-ble', label: 'BLE' },
  prod: { className: 'badge-prod', label: 'PRODUCTION' },
  unknown: { className: 'badge-unknown', label: 'UNKNOWN' },
  bootloader: { className: 'badge-unknown', label: 'BOOTLOADER' },
};

export function Badge({ type }: Props) {
  const { className, label } = config[type];
  return <span className={`badge ${className}`}>{label}</span>;
}
