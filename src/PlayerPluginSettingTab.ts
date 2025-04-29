import { PluginSettingTab, App, Setting } from 'obsidian';
import PlayerPlugin from './main';

export class PlayerPluginSettingTab extends PluginSettingTab {
  plugin: PlayerPlugin;

  constructor(app: App, plugin: PlayerPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'SpotiPlayer Settings' });

    new Setting(containerEl)
      .setName('Client ID')
      .setDesc('Your Spotify application client ID')
      .addText((text) =>
        text
          .setPlaceholder('Enter your client ID')
          .setValue(this.plugin.settings.clientId)
          .onChange(async (value) => {
            this.plugin.settings.clientId = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Client Secret')
      .setDesc('Your Spotify application client secret')
      .addText((text) =>
        text
          .setPlaceholder('Enter your client secret')
          .setValue(this.plugin.settings.clientSecret)
          .onChange(async (value) => {
            this.plugin.settings.clientSecret = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Device ID')
      .setDesc('Your Spotify playback device ID')
      .addText((text) =>
        text
          .setPlaceholder(
            'Enter your device ID. Leave empty to auto-select first'
          )
          .setValue(this.plugin.settings.deviceId || '')
          .onChange(async (value) => {
            this.plugin.settings.deviceId = value || null;
            await this.plugin.saveSettings();
          })
      );
  }
}
