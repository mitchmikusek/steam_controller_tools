import { useTranslation } from 'react-i18next';

export function UnsupportedBrowser() {
  const { t } = useTranslation();

  return (
    <div className="unsupported">
      <img src="controller-blueprint.webp" alt="Steam Controller" />
      <div className="unsupported-title">{t('app.unsupported')}</div>
    </div>
  );
}
