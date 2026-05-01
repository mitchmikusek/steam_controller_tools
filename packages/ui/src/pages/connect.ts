export class ConnectPage {
  readonly el: HTMLElement;
  private connectBtn: HTMLButtonElement;

  onConnect: () => Promise<void> = async () => {};

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'page page-centered';

    const prompt = document.createElement('div');
    prompt.className = 'connect-prompt';

    const img = document.createElement('img');
    img.src = 'controller-blueprint.png';
    img.alt = 'Steam Controller';
    prompt.appendChild(img);

    const hint = document.createElement('div');
    hint.className = 'connect-hint';
    hint.textContent = 'Plug in controller via USB, then click Connect';
    prompt.appendChild(hint);

    this.connectBtn = document.createElement('button');
    this.connectBtn.className = 'btn-blue';
    this.connectBtn.textContent = 'Connect';
    this.connectBtn.addEventListener('click', async () => {
      this.connectBtn.disabled = true;
      this.connectBtn.textContent = 'Connecting...';
      await this.onConnect();
      this.connectBtn.disabled = false;
      this.connectBtn.textContent = 'Connect';
    });
    prompt.appendChild(this.connectBtn);

    this.el.appendChild(prompt);
  }
}
