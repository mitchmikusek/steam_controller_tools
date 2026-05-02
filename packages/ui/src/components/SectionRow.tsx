import type { ReactNode } from 'react';

interface Props {
  label: string;
  sublabel?: string;
  value?: string;
  children?: ReactNode;
}

export function SectionRow({ label, sublabel, value, children }: Props) {
  return (
    <div className="section-row">
      <div>
        <div className="section-row-label">{label}</div>
        {sublabel && <div className="section-row-sublabel">{sublabel}</div>}
      </div>
      {value && <div className="section-row-value">{value}</div>}
      {children}
    </div>
  );
}
