const COMBOS = [
  { button: 'Y', color: '#e8a43a', title: 'Bluetooth LE Pairing Mode', desc: 'Pair your controller with a new Bluetooth LE-compatible device' },
  { button: 'B', color: '#d94126', title: 'Switch to Bluetooth LE Mode', desc: 'Launch your controller in BLE mode' },
  { button: 'X', color: '#1a9fff', title: 'Receiver Pairing Mode', desc: 'Pair your controller with a new dongle or Steam Link' },
  { button: 'A', color: '#59bf40', title: 'Switch to Receiver Mode', desc: 'Launch your controller in original dongle mode' },
];

export function BleHelpContent() {
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
          <img
            src="steam-logo.png" alt="Steam"
            style={{ width: 36, height: 36, flexShrink: 0, border: '2px solid rgba(255,255,255,0.5)', borderRadius: '50%' }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-bright)', marginBottom: 2 }}>
              {combo.title}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
              {combo.desc}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
