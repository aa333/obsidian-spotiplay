export class PlayButton {
  isLoading: boolean = false;
  error?: string | undefined = undefined;
  elt: HTMLButtonElement;

  constructor(
    private label: string,
    private uri: string,
    private parent: HTMLElement,
    private onClick: (uri: string) => Promise<{ error?: string | undefined }>
  ) {
    this.label = label;
    this.uri = uri;
    this.elt = this.createButtonElt(parent);
  }

  setError(error: string) {
    this.isLoading = false;
    this.error = error;
    this.updateText();
  }

  private updateText() {
    this.elt.setText(this.text);
  }

  private get text() {
    if (this.isLoading) return `Loading...`;
    if (this.error) return `Error!`;
    return `🎵 Play ${this.label}`;
  }

  async onClickHandler() {
    // console.debug('onClickHandler:', this.uri);
    if (this.isLoading) return;
    this.isLoading = true;
    this.error = undefined;
    this.updateText();
    const result = await this.onClick(this.uri);
    this.isLoading = false;
    if (result.error) this.error = result.error;
    this.updateText();
  }

  showError(text: string) {
    this.parent.createEl('p', {
      text,
      attr: { class: 'spotiplayer-error', style: 'color: red' },
    });
  }

  private createButtonElt(parent: HTMLElement) {
    const btn = parent.createEl('button', {
      text: this.text,
      cls: 'spotiplayer-button',
    });
    btn.setAttr('aria-pressed', 'false');
    btn.onclick = this.onClickHandler.bind(this);
    return btn;
  }
}
