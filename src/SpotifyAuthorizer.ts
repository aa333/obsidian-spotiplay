import SpotifyWebApi from 'spotify-web-api-js';
import { PlayerPluginSettings } from './types';

export class SpotifyAuthorizer {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private authPromiseResolve:
    | ((data: { accessToken: string; refreshToken: string } | null) => void)
    | null = null;
  private refreshTimeout: number | null = null;
  authTimeout: number | null = null;

  constructor(
    private spotifyApi: SpotifyWebApi.SpotifyWebApiJs,
    private settings: PlayerPluginSettings,
    private redirectUri: string
  ) {
    this.accessToken = settings.accessToken;
  }

  async authenticate(settings: PlayerPluginSettings) {
    // console.debug('Authenticating with Spotify...');
    const scopes = 'user-read-playback-state user-modify-playback-state';
    const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${settings.clientId}&redirect_uri=${encodeURIComponent(this.redirectUri)}&scope=${encodeURIComponent(scopes)}`;
    const tokenData = await this.getToken(authUrl, settings);
    if (!tokenData) {
      console.error('Failed to get token data');
      return;
    }
    this.accessToken = tokenData.accessToken;
    this.refreshToken = tokenData.refreshToken;
    this.spotifyApi.setAccessToken(this.accessToken);
    if (this.refreshToken) {
      if (this.refreshTimeout) clearTimeout(this.refreshTimeout);
      this.refreshTimeout = setTimeout(() => {
        this.refreshAccessToken(settings);
      }, 3500000); // Try to refresh token (almost) every hour
    }
  }

  // TODO test properly
  async refreshAccessToken(settings: PlayerPluginSettings) {
    if (!this.refreshToken) {
      console.error('No refresh token available.');
      return;
    }
    let tokenData = await fetch(`https://accounts.spotify.com/api/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization:
          'Basic ' + btoa(settings.clientId + ':' + settings.clientSecret),
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
        client_id: settings.clientId,
      }),
    })
      .then((response) => response.json())
      .then((data) => ({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      }))
      .catch((error) => {
        console.error('Error fetching token:', error);
        return null;
      });

    if (tokenData) {
      if (tokenData.accessToken) this.accessToken = tokenData.accessToken;
      if (tokenData.refreshToken) this.refreshToken = tokenData.refreshToken;
      this.spotifyApi.setAccessToken(this.accessToken);
      if (this.refreshToken) {
        if (this.refreshTimeout) clearTimeout(this.refreshTimeout);
        this.refreshTimeout = setTimeout(() => {
          this.refreshAccessToken(settings);
        }, 3500000); // Refresh token (almost) every hour
      }
    }
  }

  dispose() {
    if (this.refreshTimeout) clearTimeout(this.refreshTimeout);
    this.accessToken = null;
    this.refreshToken = null;
    this.authPromiseResolve = null;
  }

  // This opens in response to the redirect from Spotify after authentication
  async handleAuthCallback(
    data: { code: string },
    settings: PlayerPluginSettings
  ) {
    if (this.authTimeout) clearTimeout(this.authTimeout);

    let tokenData = await fetch(`https://accounts.spotify.com/api/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization:
          'Basic ' + btoa(settings.clientId + ':' + settings.clientSecret),
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: data.code,
        redirect_uri: this.redirectUri,
      }),
    })
      .then((response) => response.json())
      .then((data) => ({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      }))
      .catch((error) => {
        console.error('Error fetching token:', error);
        return null;
      });

    if (this.authPromiseResolve) this.authPromiseResolve(tokenData);
  }

  private async getToken(
    authUrl: string,
    settings: PlayerPluginSettings
  ): Promise<{ accessToken: string; refreshToken: string } | null> {
    return new Promise((resolve, reject) => {
      this.authPromiseResolve = resolve;
      this.authTimeout = setTimeout(() => {
        this.authPromiseResolve = null;
        this.accessToken = null;
        this.refreshToken = null;
        reject(new Error('Authentication timed out'));
      }, 30000);
      // console.debug('Opening auth URL:', authUrl);
      window.open(authUrl);
    });
  }

  getAccessToken() {
    return this.accessToken;
  }
}
