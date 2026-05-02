import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export function SectionTitle({ children }: Props) {
  return <h2 className="section-title">{children}</h2>;
}
