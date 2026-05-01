const COMBOS: { button: string; color: string; title: string; desc: string }[] = [
  { button: 'Y', color: '#e8a43a', title: 'Bluetooth LE Pairing Mode', desc: 'Pair your controller with a new Bluetooth LE-compatible device' },
  { button: 'B', color: '#d94126', title: 'Switch to Bluetooth LE Mode', desc: 'Launch your controller in BLE mode' },
  { button: 'X', color: '#1a9fff', title: 'Receiver Pairing Mode', desc: 'Pair your controller with a new dongle or Steam Link' },
  { button: 'A', color: '#59bf40', title: 'Switch to Receiver Mode', desc: 'Launch your controller in original dongle mode' },
];

export function createBleHelpContent(): HTMLElement {
  return createContent();
}

function createContent(): HTMLElement {
  const wrap = document.createElement('div');

  for (const combo of COMBOS) {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:16px;padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.06)';

    // Button circle (outline style)
    const btnCircle = document.createElement('div');
    btnCircle.style.cssText = `
      width:36px;height:36px;border-radius:50%;
      background:transparent;
      border:2px solid ${combo.color};
      color:${combo.color};
      display:flex;align-items:center;justify-content:center;
      font-weight:700;font-size:0.9rem;flex-shrink:0;
    `;
    btnCircle.textContent = combo.button;

    // Plus sign
    const plus = document.createElement('div');
    plus.style.cssText = 'color:var(--text-dim);font-size:0.8rem;flex-shrink:0';
    plus.textContent = '+';

    // Steam pixel icon
    const steamIcon = document.createElement('img');
    steamIcon.src = 'steam-logo.png';
    steamIcon.alt = 'Steam';
    steamIcon.style.cssText = 'width:36px;height:36px;flex-shrink:0;border:2px solid rgba(255,255,255,0.5);border-radius:50%';

    // Text
    const text = document.createElement('div');
    text.style.cssText = 'flex:1;min-width:0';
    const title = document.createElement('div');
    title.style.cssText = 'font-size:0.85rem;font-weight:500;color:var(--text-bright);margin-bottom:2px';
    title.textContent = combo.title;
    const desc = document.createElement('div');
    desc.style.cssText = 'font-size:0.7rem;color:var(--text-dim)';
    desc.textContent = combo.desc;
    text.appendChild(title);
    text.appendChild(desc);

    row.appendChild(btnCircle);
    row.appendChild(plus);
    row.appendChild(steamIcon);
    row.appendChild(text);
    wrap.appendChild(row);
  }

  const lastRow = wrap.lastElementChild as HTMLElement;
  if (lastRow) lastRow.style.borderBottom = 'none';

  return wrap;
}

export function showBleHelpModal(onClose?: () => void): void {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.maxWidth = '480px';
  modal.style.textAlign = 'left';
  modal.style.padding = '24px 28px';

  const header = document.createElement('div');
  header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:16px';

  const title = document.createElement('div');
  title.style.cssText = 'font-size:0.95rem;font-weight:500;color:var(--text-bright);letter-spacing:0.03em';
  title.textContent = 'BLE Controller Modes';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'btn-ghost btn-sm';
  closeBtn.textContent = '\u2715';
  closeBtn.style.cssText = 'font-size:1rem;padding:4px 8px;min-width:auto';
  closeBtn.addEventListener('click', () => {
    overlay.remove();
    onClose?.();
  });

  header.appendChild(title);
  header.appendChild(closeBtn);
  modal.appendChild(header);

  const subtitle = document.createElement('div');
  subtitle.style.cssText = 'font-size:0.7rem;color:var(--text-dim);margin-bottom:12px';
  subtitle.textContent = 'Hold a button + Steam to switch modes (BLE firmware only)';
  modal.appendChild(subtitle);

  modal.appendChild(createContent());

  overlay.appendChild(modal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
      onClose?.();
    }
  });
  document.body.appendChild(overlay);
}
