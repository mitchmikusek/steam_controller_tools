import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export function SectionTitle({ children }: Props) {
  return <div className="section-title">{children}</div>;
}
