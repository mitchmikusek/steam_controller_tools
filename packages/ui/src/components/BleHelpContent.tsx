import { useTranslation } from 'react-i18next';

const COMBOS = [
  { button: 'Y', color: '#e8a43a', titleKey: 'bleHelp.yTitle', descKey: 'bleHelp.yDesc' },
  { button: 'B', color: '#d94126', titleKey: 'bleHelp.bTitle', descKey: 'bleHelp.bDesc' },
  { button: 'X', color: '#1a9fff', titleKey: 'bleHelp.xTitle', descKey: 'bleHelp.xDesc' },
  { button: 'A', color: '#59bf40', titleKey: 'bleHelp.aTitle', descKey: 'bleHelp.aDesc' },
];

export function BleHelpContent() {
  const { t } = useTranslation();
  return (
    <div>
      {COMBOS.map((combo, i) => (
        <div key={combo.button} style={{
          display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0',
          borderBottom: i < COMBOS.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', background: 'transparent',
            border: `2px solid ${combo.color}`, color: combo.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.9rem', flexShrink: 0,
          }}>
            {combo.button}
          </div>
          <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', flexShrink: 0 }}>+</div>
          <img src="steam-logo.png" alt="Steam" style={{ width: 36, height: 36, flexShrink: 0, border: '2px solid rgba(255,255,255,0.5)', borderRadius: '50%' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-bright)', marginBottom: 2 }}>{t(combo.titleKey)}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{t(combo.descKey)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
