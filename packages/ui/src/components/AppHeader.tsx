import { useTranslation } from 'react-i18next';

export function AppHeader() {
  const { t } = useTranslation();

  return (
    <div className="app-header">
      <h1>{t('app.title')}</h1>
      <div className="subtitle">{t('app.subtitle')}</div>
    </div>
  );
}
