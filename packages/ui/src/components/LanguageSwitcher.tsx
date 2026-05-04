import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../i18n';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <select
      value={i18n.language.split('-')[0]} // 'zh-CN' → 'zh'
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      aria-label="Language"
      className="lang-select"
    >
      {LANGUAGES.map(({ code, label }) => (
        <option key={code} value={code} style={{ background: 'var(--bg)' }}>
          {label}
        </option>
      ))}
    </select>
  );
}
