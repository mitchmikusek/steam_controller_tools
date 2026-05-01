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

    this.el.appendChild(center);

    // Reconnect area
    this.reconnectArea = document.createElement('div');
    this.reconnectArea.style.display = 'none';
    this.el.appendChild(this.reconnectArea);
  }

  updateProgress(p: FlashProgress): void {
    this.statusText.textContent = p.phase === 'Complete' ? 'Complete' : `${p.phase}...`;
    this.fillBar.style.width = `${p.percent}%`;
    this.pctText.textContent = p.phase === 'Complete' ? 'Firmware flashed successfully' : `${p.percent}% complete`;

    if (p.phase === 'Complete') {
      this.fillBar.classList.add('complete');
      this.logoRing.classList.add('complete');
      this.iconEl.style.display = 'none';
    }
  }

  appendLog(_level: LogLevel, _ts: string, _msg: string): void {
    // Log output removed from UI — logs go to browser console only
  }

  showReconnectPrompt(targetPid: number): Promise<void> {
    return new Promise((resolve) => {
      this.statusText.textContent = 'Reconnection Required';

      const modeName = targetPid === 0x1002 ? 'bootloader' : 'normal';

      // Full-screen modal overlay
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';

      const modal = document.createElement('div');
      modal.className = 'modal';

      // Icon
      const icon = document.createElement('div');
      icon.className = 'modal-icon';
      icon.textContent = '\u26A0';

      const title = document.createElement('div');
      title.className = 'modal-title';
      title.textContent = 'Reconnection Required';

      const desc = document.createElement('div');
      desc.className = 'modal-desc';
      desc.textContent = `The controller has rebooted into ${modeName} mode. Select it from the device picker to continue flashing.`;

      const btn = document.createElement('button');
      btn.className = 'btn-blue';
      btn.textContent = 'Reconnect Controller';
      btn.addEventListener('click', async () => {
        try {
          // For normal mode, filter by vendor usage page (0xFF00) to get the protocol interface
          // For bootloader, only one interface exists so no filter needed
          const filters = targetPid === 0x1002
            ? [{ vendorId: VALVE_VID, productId: targetPid }]
            : [{ vendorId: VALVE_VID, productId: targetPid, usagePage: 0xff00 }];
          await navigator.hid.requestDevice({ filters });
          overlay.classList.add('closing');
          setTimeout(() => {
            overlay.remove();
          }, 350);
          this.statusText.textContent = 'Resuming...';
          resolve();
        } catch {
          // User cancelled picker — keep showing modal
        }
      });

      modal.appendChild(icon);
      modal.appendChild(title);
      modal.appendChild(desc);
      modal.appendChild(btn);
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
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
    this.iconEl.style.display = '';
    this.reconnectArea.style.display = 'none';
  }
}
