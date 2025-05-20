import { Plugin } from 'obsidian';
import SpotifyWebApi from 'spotify-web-api-js';
import { PlayerPluginSettingTab } from './PlayerPluginSettingTab';
import { PlayerPluginSettings, DEFAULT_SETTINGS } from './types';
import { SpotifyAuthorizer } from './SpotifyAuthorizer';
import { PlayButton } from './PlayButton';
import { Logger, LogLevel } from './Logger';

const KeyValueRegex = /^([^:]+):\s*(.+)$/;

export default class PlayerPlugin extends Plugin {
  private spotifyApi!: SpotifyWebApi.SpotifyWebApiJs;
  private authorizer!: SpotifyAuthorizer;
  private logger: Logger = new Logger(LogLevel.Info); // Set verbosity level to debug for development
  settings!: PlayerPluginSettings;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new PlayerPluginSettingTab(this.app, this));

    this.spotifyApi = new SpotifyWebApi();
    this.authorizer = new SpotifyAuthorizer(
      'obsidian://obsidian-spotiplay',
      () => this.settings,
      (accessToken) => {
        this.settings.accessToken = accessToken;
        this.saveSettings();
        this.spotifyApi.setAccessToken(accessToken);
      }
    );

    this.registerObsidianProtocolHandler('obsidian-spotiplay', async (data) => {
      const { code }: { code: string } = data as unknown as { code: string };
      await this.authorizer.handleAuthCallback({ code }, this.settings);
    });

    this.registerMarkdownCodeBlockProcessor(
      'spotiplayer',
      async (source, el) => {
        let parsedData: Record<string, string> = {};
        try {
          parsedData = this.parseData(source);
        } catch (error) {
          this.logger.error('Invalid YAML in spotiplayer block:', error);
          el.createEl('p', {
            text: 'Error: Invalid YAML in spotiplayer block.',
          });
          return;
        }

        const { label, uri } = parsedData;
        if (!label || !uri) {
          this.logger.error('Missing label or uri in spotiplayer block.');
          el.createEl('p', {
            text: 'Error: Missing label or uri in spotiplayer block.',
          });
          return;
        }

        this.createPlayButton(label, uri, el);
      }
    );
  }

  parseData(source: string) {
    const parsedData: Record<string, string> = {};
    source.split('\n').forEach((line) => {
      const match = KeyValueRegex.exec(line);
      if (match) {
        const [, key, value] = match;
        parsedData[key.trim()] = value.trim();
      }
    });
    return parsedData;
  }

  async checkToken() {
    this.logger.debug('Checking token validity...');
    if (!this.authorizer.getAccessToken()) {
      this.logger.debug('No token');
      return false;
    }
    try {
      await this.spotifyApi.getMyDevices();
    } catch (error) {
      this.logger.error('Token expired', error);
      return false;
    }
    return true;
  }

  onunload() {
    this.logger.debug('Unloading plugin...');
    this.authorizer.dispose();
  }

  private async selectDevice() {
    const devices = await this.spotifyApi.getMyDevices();
    if (devices.devices.length === 0) {
      this.logger.error('No devices available for playback.');
      return 'No devices available for playback.';
    }
    this.settings.deviceId = devices.devices[0].id; // Automatically select the first device
    await this.saveSettings();
    this.logger.debug('Selected device:', this.settings.deviceId);
  }

  private async playTrack(uri: string) {
    if (!this.settings.deviceId) {
      this.logger.error('No device selected for playback.');
      return 'No device available for playback. Make sure Spotify player is open and available.';
    }
    try {
      let uris = undefined;
      let context_uri = undefined;

      let processedUri = uri.trim(); // Trim whitespace just in case

      // Check if it's a Spotify web URL
      if (processedUri.startsWith('https://open.spotify.com/')) {
        // Use a regex to capture the type (track, playlist, album) and the ID
        const urlMatch = processedUri.match(/^https:\/\/open\.spotify\.com\/(track|playlist|album)\/([a-zA-Z0-9]+)/);

        if (urlMatch) {
          const type = urlMatch[1]; // 'track', 'playlist', or 'album'
          const id = urlMatch[2];
          processedUri = `spotify:${type}:${id}`; // Convert to spotify URI format
          this.logger.debug(`Converted web URL to URI: ${processedUri}`);
        } else {
          // It's a Spotify web URL but not a supported type (track, playlist, album)
          this.logger.error('Unsupported Spotify web URL format:', uri);
          return 'Unsupported Spotify web URL. Please use a link for a track, playlist, or album.';
        }
      }
      
      if (processedUri.startsWith('spotify:track:')) {
        uris = [processedUri];
      } else if (
        processedUri.startsWith('spotify:playlist:') ||
        processedUri.startsWith('spotify:album:')
      ) {
        context_uri = processedUri;
      } else {
        // It wasn't a web URL and it's not a valid spotify: URI format
        this.logger.error('Invalid URI format:', uri); // Log original URI for clarity
        return 'Invalid URI or unsupported web URL type. Should be "spotify:track:...", "spotify:playlist:...", "spotify:album:...", or the corresponding open.spotify.com URL.';
      }

      await this.spotifyApi.play({
        device_id: this.settings.deviceId,
        uris,
        context_uri,
      });
    } catch (error) {
      this.logger.error('Error playing track:', error);
      // Attempt to get a more specific error message from the Spotify API response
      const errorMessage = (error as any)?.response?.data?.error?.message || (error as Error).message || 'Unknown error';
      return `Error playing track: ${errorMessage}`;
    }
    this.logger.debug('Playing item:', processedUri); // Log the processed URI
  }

  private createPlayButton(label: string, uri: string, parent: HTMLElement) {
    const btn = new PlayButton(label, uri, parent, (result) =>
      this.onClick(result)
    );
    return btn;
  }

  private async onClick(uri: string) {
    this.logger.debug('Play button clicked:', uri);
    const isTokenValid = await this.checkToken();
    if (!isTokenValid) {
      await this.authorizer.authenticate();
    }

    if (!this.authorizer.getAccessToken()) {
      return { success: false, error: `Token is null. Please authenticate.` };
    }

    let err: string | undefined = '';

    if (!this.settings.deviceId) {
      err = await this.selectDevice();
      if (err) {
        return { success: false, error: `Unable to select device: ${err}` };
      }
    }
    err = await this.playTrack(uri);
    if (err) {
      return { success: false, error: `Unable to play track: ${err}` };
    }
    return { success: true };
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
