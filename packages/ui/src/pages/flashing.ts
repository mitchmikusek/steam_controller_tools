import { VALVE_VID, type FlashProgress, type LogLevel } from '@scflash/protocol';

export class FlashingPage {
  readonly el: HTMLElement;
  private logoRing: HTMLElement;
  private iconEl: HTMLElement;
  private statusText: HTMLElement;
  private fillBar: HTMLElement;
  private pctText: HTMLElement;
  private reconnectArea: HTMLElement;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'page';

    // Steps
    const steps = document.createElement('div');
    steps.className = 'steps';
    for (let i = 0; i < 4; i++) {
      const dot = document.createElement('div');
      dot.className = 'step-dot' + (i < 2 ? ' done' : i === 2 ? ' active' : '');
      steps.appendChild(dot);
    }
    this.el.appendChild(steps);

    // Center area
    const center = document.createElement('div');
    center.className = 'flash-center';

    // Logo ring with spinning arc
    this.logoRing = document.createElement('div');
    this.logoRing.className = 'logo-ring';

    const arcBg = document.createElement('div');
    arcBg.className = 'arc-bg';
    const arcWrap = document.createElement('div');
    arcWrap.className = 'arc-wrap';
    const arc = document.createElement('div');
    arc.className = 'arc';
    arcWrap.appendChild(arc);
    this.iconEl = document.createElement('img');
    this.iconEl.className = 'icon';
    (this.iconEl as HTMLImageElement).src = 'steam-logo.png';
    (this.iconEl as HTMLImageElement).alt = 'Steam';
    this.iconEl.style.cssText += ';width:100px;height:100px';

    this.logoRing.appendChild(arcBg);
    this.logoRing.appendChild(arcWrap);
    this.logoRing.appendChild(this.iconEl);
    center.appendChild(this.logoRing);

    // Status
    this.statusText = document.createElement('div');
    this.statusText.className = 'flash-status';
    this.statusText.textContent = 'Initializing...';
    center.appendChild(this.statusText);

    // Progress bar
    const track = document.createElement('div');
    track.className = 'progress-track';
    this.fillBar = document.createElement('div');
    this.fillBar.className = 'progress-fill';
    track.appendChild(this.fillBar);
    center.appendChild(track);

    this.pctText = document.createElement('div');
    this.pctText.className = 'progress-pct';
    this.pctText.textContent = '0%';
    center.appendChild(this.pctText);

    // Reconnect area (inline, under progress)
    this.reconnectArea = document.createElement('div');
    this.reconnectArea.style.display = 'none';
    center.appendChild(this.reconnectArea);

    this.el.appendChild(center);
  }

  updateProgress(p: FlashProgress): void {
    this.statusText.textContent = p.phase === 'Complete' ? 'Complete' : `${p.phase}...`;
    this.fillBar.style.width = `${p.percent}%`;
    this.pctText.textContent = p.phase === 'Complete' ? 'Firmware flashed successfully' : `${p.percent}% complete`;

    if (p.phase === 'Complete') {
      this.fillBar.classList.add('complete');
      this.logoRing.classList.add('complete');
      // Replace Steam logo with checkmark
      const check = document.createElement('div');
      check.className = 'icon';
      check.style.fontSize = '3rem';
      check.textContent = '\u2713';
      this.iconEl.replaceWith(check);
      this.iconEl = check;
    }
  }

  appendLog(_level: LogLevel, _ts: string, _msg: string): void {
    // Log output removed from UI — logs go to browser console only
  }

  showReconnectPrompt(targetPid: number): Promise<void> {
    return new Promise((resolve) => {
      const modeName = targetPid === 0x1002 ? 'bootloader' : 'normal';

      // Update inline status + pulse bar amber
      this.statusText.textContent = 'Reconnection Required';
      this.pctText.textContent = `Controller rebooted into ${modeName} mode`;
      this.fillBar.classList.add('waiting');

      // Show reconnect button inline
      this.reconnectArea.style.display = '';
      this.reconnectArea.textContent = '';

      const desc = document.createElement('div');
      desc.style.cssText = 'font-size:0.75rem;color:var(--text-dim);text-align:center;margin-bottom:12px';
      desc.textContent = 'Select the controller from the device picker to continue.';

      const btn = document.createElement('button');
      btn.className = 'btn-blue';
      btn.textContent = 'Reconnect';
      btn.addEventListener('click', async () => {
        try {
          const filters = targetPid === 0x1002
            ? [{ vendorId: VALVE_VID, productId: targetPid }]
            : [{ vendorId: VALVE_VID, productId: targetPid, usagePage: 0xff00 }];
          await navigator.hid.requestDevice({ filters });
          this.reconnectArea.style.display = 'none';
          this.fillBar.classList.remove('waiting');
          this.statusText.textContent = 'Resuming...';
          this.pctText.textContent = 'Reconnected successfully';
          resolve();
        } catch {
          // User cancelled picker — keep showing button
        }
      });

      this.reconnectArea.appendChild(desc);
      this.reconnectArea.appendChild(btn);
      this.reconnectArea.style.textAlign = 'center';
    });
  }

  showError(error: string): void {
    this.logoRing.classList.add('error');
    this.iconEl.style.display = 'none';
    this.fillBar.classList.add('error');
    this.statusText.textContent = 'Flash Failed';
    this.pctText.textContent = error;
  }

  reset(): void {
    this.statusText.textContent = 'Initializing...';
    this.fillBar.style.width = '0%';
    this.fillBar.className = 'progress-fill';
    this.pctText.textContent = '0%';
    this.logoRing.className = 'logo-ring';
    // Restore Steam logo if it was replaced with checkmark
    const img = document.createElement('img');
    img.className = 'icon';
    (img as HTMLImageElement).src = 'steam-logo.png';
    (img as HTMLImageElement).alt = 'Steam';
    img.style.cssText += ';width:100px;height:100px';
    this.iconEl.replaceWith(img);
    this.iconEl = img;
    this.reconnectArea.style.display = 'none';
  }
}
