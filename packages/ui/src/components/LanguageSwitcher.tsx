import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../i18n';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <select
      value={i18n.language.split('-')[0]} // 'zh-CN' → 'zh'
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      aria-label="Language"
      style={{
        background: 'transparent',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        color: 'var(--text-dim)',
        fontSize: '0.7rem',
        padding: '4px 8px',
        cursor: 'pointer',
        outline: 'none',
      }}
    >
      {LANGUAGES.map(({ code, label }) => (
        <option key={code} value={code} style={{ background: 'var(--bg)' }}>
          {label}
        </option>
      ))}
    </select>
  );
}
