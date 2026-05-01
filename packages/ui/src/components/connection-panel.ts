export class ConnectionPanel {
  readonly el: HTMLElement;
  private dot: HTMLElement;
  private statusText: HTMLElement;
  private connectBtn: HTMLButtonElement;
  private disconnectBtn: HTMLButtonElement;

  onConnect: () => void = () => {};
  onDisconnect: () => void = () => {};

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'card';

    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = 'Connection';
    this.el.appendChild(title);

    const row = document.createElement('div');
    row.className = 'connection';

    this.dot = document.createElement('div');
    this.dot.className = 'status-dot';

    this.statusText = document.createElement('span');
    this.statusText.className = 'status-text';
    this.statusText.textContent = 'Disconnected';

    this.connectBtn = document.createElement('button');
    this.connectBtn.className = 'btn-primary';
    this.connectBtn.textContent = 'Connect';
    this.connectBtn.addEventListener('click', () => this.onConnect());

    this.disconnectBtn = document.createElement('button');
    this.disconnectBtn.className = 'btn-secondary';
    this.disconnectBtn.textContent = 'Disconnect';
    this.disconnectBtn.style.display = 'none';
    this.disconnectBtn.addEventListener('click', () => this.onDisconnect());

    row.appendChild(this.dot);
    row.appendChild(this.statusText);
    row.appendChild(this.connectBtn);
    row.appendChild(this.disconnectBtn);
    this.el.appendChild(row);
  }

  update(mode: 'disconnected' | 'normal' | 'bootloader'): void {
    this.dot.className = 'status-dot';
    if (mode === 'normal') {
      this.dot.classList.add('connected');
      this.statusText.textContent = 'Connected (Normal Mode)';
    } else if (mode === 'bootloader') {
      this.dot.classList.add('bootloader');
      this.statusText.textContent = 'Connected (Bootloader Mode)';
    } else {
      this.statusText.textContent = 'Disconnected';
    }
    this.connectBtn.style.display = mode === 'disconnected' ? '' : 'none';
    this.disconnectBtn.style.display = mode === 'disconnected' ? 'none' : '';
  }

  setLoading(loading: boolean): void {
    this.connectBtn.disabled = loading;
    this.connectBtn.textContent = loading ? 'Connecting...' : 'Connect';
  }
}
