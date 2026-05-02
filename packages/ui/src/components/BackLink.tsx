import { useTranslation } from 'react-i18next';

interface Props {
  onClick: () => void;
}

export function BackLink({ onClick }: Props) {
  const { t } = useTranslation();
  return (
    <button className="back-link" onClick={onClick} type="button">
      <span style={{ position: 'relative', top: -1 }}>←</span> {t('nav.back')}
    </button>
  );
}
